import { prisma } from '../lib/prisma';

export async function listEvents(
  userId: string,
  opts: { from?: string; to?: string; date?: string },
) {
  let where: Record<string, unknown> = { userId };

  if (opts.date) {
    const d = new Date(opts.date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    where = { ...where, startDate: { gte: start, lt: end } };
  } else if (opts.from || opts.to) {
    const dateFilter: Record<string, Date> = {};
    if (opts.from) dateFilter.gte = new Date(opts.from);
    if (opts.to)   dateFilter.lte = new Date(opts.to);
    where = { ...where, startDate: dateFilter };
  }

  return prisma.agendaEvent.findMany({
    where,
    orderBy: { startDate: 'asc' },
  });
}

export async function getUpcoming(userId: string, limit = 5) {
  return prisma.agendaEvent.findMany({
    where: { userId, startDate: { gte: new Date() }, isCompleted: false },
    orderBy: { startDate: 'asc' },
    take: limit,
  });
}

export async function getEvent(userId: string, id: string) {
  return prisma.agendaEvent.findFirst({ where: { id, userId } });
}

export async function createEvent(
  userId: string,
  body: {
    title: string;
    description?: string;
    category?: string;
    startDate: string;
    endDate?: string;
    isAllDay?: boolean;
    location?: string;
    reminder?: number;
    color?: string;
  },
) {
  return prisma.agendaEvent.create({
    data: {
      userId,
      title: body.title,
      description: body.description,
      category: body.category ?? 'personal',
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      isAllDay: body.isAllDay ?? false,
      location: body.location,
      reminder: body.reminder,
      color: body.color,
    },
  });
}

export async function updateEvent(
  userId: string,
  id: string,
  body: Record<string, unknown>,
) {
  const data: Record<string, unknown> = {};
  const fields = ['title', 'description', 'category', 'location', 'reminder', 'color', 'isAllDay', 'isCompleted'] as const;
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  if (body.startDate) data.startDate = new Date(body.startDate as string);
  if (body.endDate)   data.endDate   = new Date(body.endDate as string);

  return prisma.agendaEvent.update({ where: { id, userId }, data });
}

export async function deleteEvent(userId: string, id: string) {
  return prisma.agendaEvent.delete({ where: { id, userId } });
}

// ─── Google Calendar Integration ─────────────────────────────────────────────

export function getGoogleAuthUrl(redirectUri: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events');
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
}

export async function handleGoogleCallback(userId: string, code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  if (!clientId || !clientSecret) {
    throw new Error('Las credenciales de Google OAuth (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) no están configuradas en el servidor.');
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const errorData = await tokenRes.text();
    console.error('[GOOGLE_OAUTH_TOKEN_ERROR]', errorData);
    if (errorData.includes('invalid_grant')) {
      throw new Error('El código de autorización ya fue usado o expiró. Intenta conectar tu cuenta de Google nuevamente.');
    }
    throw new Error(`Error de autenticación con Google: ${errorData}`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: tokens.access_token,
      ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
      googleTokenExpiresAt: expiresAt,
      googleCalendarSyncEnabled: true,
      googleCalendarLastSyncAt: new Date(),
    },
    select: {
      id: true,
      googleCalendarSyncEnabled: true,
      googleCalendarLastSyncAt: true,
    },
  });

  // Perform immediate initial sync
  await syncGoogleCalendar(userId).catch((err) => {
    console.error('[GOOGLE_CALENDAR_INITIAL_SYNC_ERROR]', err);
  });

  return updatedUser;
}

export async function refreshGoogleToken(userId: string, refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    throw new Error('No se pudo refrescar el token de Google.');
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: data.access_token,
      googleTokenExpiresAt: expiresAt,
    },
  });

  return data.access_token;
}

export async function syncGoogleCalendar(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiresAt: true,
      googleCalendarSyncEnabled: true,
    },
  });

  if (!user || !user.googleCalendarSyncEnabled) {
    return { syncedCount: 0, message: 'Google Calendar no está conectado.' };
  }

  let accessToken = user.googleAccessToken;

  if (!accessToken || (user.googleTokenExpiresAt && user.googleTokenExpiresAt <= new Date())) {
    if (user.googleRefreshToken) {
      accessToken = await refreshGoogleToken(userId, user.googleRefreshToken);
    } else {
      throw new Error('Sesión de Google expirada. Por favor vuelve a conectar Google Calendar.');
    }
  }

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${thirtyDaysLater.toISOString()}&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!calRes.ok) {
    const errText = await calRes.text();
    throw new Error(`Error al consultar Google Calendar: ${errText}`);
  }

  const calData = (await calRes.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      description?: string;
      location?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };

  const items = calData.items || [];
  let syncedCount = 0;

  for (const item of items) {
    if (!item.summary) continue;

    const startStr = item.start?.dateTime || item.start?.date;
    const endStr = item.end?.dateTime || item.end?.date;

    if (!startStr) continue;

    const startDate = new Date(startStr);
    const endDate = endStr ? new Date(endStr) : new Date(startDate.getTime() + 60 * 60 * 1000);
    const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);

    await prisma.agendaEvent.upsert({
      where: { googleEventId: item.id },
      create: {
        userId,
        title: item.summary,
        description: item.description ?? null,
        location: item.location ?? null,
        startDate,
        endDate,
        isAllDay,
        category: 'work',
        googleEventId: item.id,
      },
      update: {
        title: item.summary,
        description: item.description ?? null,
        location: item.location ?? null,
        startDate,
        endDate,
        isAllDay,
      },
    });

    syncedCount++;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { googleCalendarLastSyncAt: new Date() },
  });

  return { syncedCount, message: `Sincronizados ${syncedCount} eventos de Google Calendar.` };
}

export async function disconnectGoogleCalendar(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiresAt: null,
      googleCalendarSyncEnabled: false,
      googleCalendarLastSyncAt: null,
    },
  });

  return { success: true };
}
