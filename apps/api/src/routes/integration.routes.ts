import { Router } from 'express';
import type { Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import type { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { signOAuthState, verifyOAuthState } from '../lib/oauth-state';

const router = Router();

// ─── OAuth Callbacks (NO auth header — browser redirect from provider) ─────
// These MUST be defined BEFORE router.use(requireAuth). The userId is taken
// from the signed `state` JWT, NEVER from a request body / unsigned query.

router.get('/google/callback', async (req: AuthRequest, res: Response): Promise<void> => {
  const { code, state } = req.query as { code?: string; state?: string };
  const webUrl = process.env.WEB_URL ?? 'http://localhost:5173';
  if (!code || !state) { res.redirect(`${webUrl}/settings/integrations?google=error`); return; }

  let userId: string;
  try { userId = verifyOAuthState(state, 'google'); }
  catch { res.redirect(`${webUrl}/settings/integrations?google=error`); return; }

  const clientId      = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret  = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri   = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.API_URL ?? 'http://localhost:3001'}/api/v1/integrations/google/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    const tokens = (await tokenRes.json()) as { access_token: string; refresh_token?: string };

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken:  tokens.access_token,
        googleRefreshToken: tokens.refresh_token ?? undefined,
      },
    });

    res.redirect(`${webUrl}/settings/integrations?google=connected`);
  } catch (error) {
    console.error('[Integrations] Google callback error:', error);
    res.redirect(`${webUrl}/settings/integrations?google=error`);
  }
});

router.get('/spotify/callback', async (req: AuthRequest, res: Response): Promise<void> => {
  const { code, state } = req.query as { code?: string; state?: string };
  const webUrl = process.env.WEB_URL ?? 'http://localhost:5173';
  if (!code || !state) { res.redirect(`${webUrl}/settings/integrations?spotify=error`); return; }

  let userId: string;
  try { userId = verifyOAuthState(state, 'spotify'); }
  catch { res.redirect(`${webUrl}/settings/integrations?spotify=error`); return; }

  const clientId     = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri  = process.env.SPOTIFY_REDIRECT_URI ?? `${process.env.API_URL ?? 'http://localhost:3001'}/api/v1/integrations/spotify/callback`;

  try {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization:  `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
    });
    const tokens = (await tokenRes.json()) as { access_token: string; refresh_token?: string };

    await prisma.user.update({
      where: { id: userId },
      data: {
        spotifyAccessToken:  tokens.access_token,
        spotifyRefreshToken: tokens.refresh_token ?? undefined,
      },
    });

    res.redirect(`${webUrl}/settings/integrations?spotify=connected`);
  } catch (error) {
    console.error('[Integrations] Spotify callback error:', error);
    res.redirect(`${webUrl}/settings/integrations?spotify=error`);
  }
});

router.get('/googlefit/callback', async (req: AuthRequest, res: Response): Promise<void> => {
  const { code, state } = req.query as { code?: string; state?: string };
  const webUrl = process.env.WEB_URL ?? 'http://localhost:5173';
  if (!code || !state) { res.redirect(`${webUrl}/settings/integrations?googlefit=error`); return; }

  let userId: string;
  try { userId = verifyOAuthState(state, 'googlefit'); }
  catch { res.redirect(`${webUrl}/settings/integrations?googlefit=error`); return; }

  const clientId     = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri  = process.env.GOOGLEFIT_REDIRECT_URI ?? `${process.env.API_URL ?? 'http://localhost:3001'}/api/v1/integrations/googlefit/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    const tokens = (await tokenRes.json()) as { access_token: string; refresh_token?: string };

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken:  tokens.access_token,
        googleRefreshToken: tokens.refresh_token ?? undefined,
        googleFitConnected: true,
      },
    });

    res.redirect(`${webUrl}/settings/integrations?googlefit=connected`);
  } catch (error) {
    console.error('[Integrations] Google Fit callback error:', error);
    res.redirect(`${webUrl}/settings/integrations?googlefit=error`);
  }
});

// ─── All other routes require auth ───────────────────────────────────────────
router.use(requireAuth);

// ─── Google Calendar ──────────────────────────────────────────────────────────

router.get('/google/auth', (req: AuthRequest, res: Response): void => {
  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const redirectUri  = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.API_URL ?? 'http://localhost:3001'}/api/v1/integrations/google/callback`;

  if (!clientId) { res.status(500).json({ error: 'GOOGLE_CLIENT_ID no configurado' }); return; }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/tasks',
    ].join(' '),
    access_type:   'offline',
    prompt:        'consent',
    state:         signOAuthState({ userId: req.userId!, provider: 'google' }),
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.delete('/google/disconnect', async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.user.update({
    where: { id: req.userId! },
    data: { googleAccessToken: null, googleRefreshToken: null },
  });
  res.json({ ok: true });
});

router.post('/google/sync', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId! },
    select: { googleAccessToken: true },
  });

  if (!user.googleAccessToken) { res.status(401).json({ error: 'Google no conectado' }); return; }

  const quests = await prisma.quest.findMany({
    where: { userId: req.userId!, status: 'ACTIVE', deadline: { not: null } },
    take: 20,
  });

  let synced = 0;
  for (const quest of quests) {
    try {
      const event = {
        summary:     `[LifeQuest] ${quest.title}`,
        description: quest.description ?? '',
        start: { dateTime: quest.deadline!.toISOString() },
        end:   { dateTime: new Date(quest.deadline!.getTime() + 60 * 60 * 1000).toISOString() },
        colorId: '11',
      };
      await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${user.googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
      synced++;
    } catch { /* skip */ }
  }

  res.json({ synced });
});

// ─── Spotify ──────────────────────────────────────────────────────────────────

async function getSpotifyToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { spotifyAccessToken: true, spotifyRefreshToken: true },
  });
  if (!user.spotifyAccessToken) return null;
  return user.spotifyAccessToken;
}

async function refreshSpotifyToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { spotifyRefreshToken: true },
  });
  if (!user.spotifyRefreshToken) return null;
  const clientId     = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: user.spotifyRefreshToken }),
  });
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return null;
  await prisma.user.update({
    where: { id: userId },
    data: { spotifyAccessToken: tokens.access_token },
  });
  return tokens.access_token;
}

async function spotifyFetch(userId: string, url: string, options: RequestInit = {}) {
  let token = await getSpotifyToken(userId);
  if (!token) throw new Error('Spotify no conectado');
  let res = await fetch(url, { ...options, headers: { ...(options.headers as Record<string, string> ?? {}), Authorization: `Bearer ${token}` } });
  if (res.status === 401) {
    token = await refreshSpotifyToken(userId);
    if (!token) throw new Error('Token de Spotify expirado');
    res = await fetch(url, { ...options, headers: { ...(options.headers as Record<string, string> ?? {}), Authorization: `Bearer ${token}` } });
  }
  return res;
}

router.get('/spotify/auth', (req: AuthRequest, res: Response): void => {
  const clientId    = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI ?? `${process.env.API_URL ?? 'http://localhost:3001'}/api/v1/integrations/spotify/callback`;

  if (!clientId) { res.status(500).json({ error: 'SPOTIFY_CLIENT_ID no configurado' }); return; }

  const params = new URLSearchParams({
    client_id:    clientId,
    response_type:'code',
    redirect_uri: redirectUri,
    scope:        'user-read-currently-playing user-read-playback-state user-modify-playback-state playlist-read-private user-library-modify streaming',
    state:        signOAuthState({ userId: req.userId!, provider: 'spotify' }),
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

router.get('/spotify/now-playing', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId! },
    select: { spotifyAccessToken: true },
  });

  if (!user.spotifyAccessToken) { res.status(401).json({ error: 'Spotify no conectado' }); return; }

  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${user.spotifyAccessToken}` },
    });

    if (response.status === 204) { res.json({ playing: false }); return; }

    const data = (await response.json()) as {
      is_playing: boolean;
      item?: { name: string; artists: Array<{ name: string }>; album: { images: Array<{ url: string }> } };
      progress_ms?: number;
      duration_ms?: number;
    };

    res.json({
      playing: data.is_playing,
      track:   data.item?.name,
      artist:  data.item?.artists?.[0]?.name,
      albumArt:data.item?.album?.images?.[0]?.url,
      progressMs:  data.progress_ms,
      durationMs:  data.duration_ms,
    });
  } catch (error) {
    console.error('[Integrations] Spotify now-playing error:', error);
    res.status(500).json({ error: 'spotify_error' });
  }
});

router.post('/spotify/play', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contextUri, deviceId } = req.body as { contextUri?: string; deviceId?: string };
    const body: Record<string, unknown> = {};
    if (contextUri) body.context_uri = contextUri;
    const url = `https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`;
    await spotifyFetch(req.userId!, url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: Object.keys(body).length ? JSON.stringify(body) : undefined });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/spotify/pause', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await spotifyFetch(req.userId!, 'https://api.spotify.com/v1/me/player/pause', { method: 'PUT' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/spotify/next', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await spotifyFetch(req.userId!, 'https://api.spotify.com/v1/me/player/next', { method: 'POST' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/spotify/previous', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await spotifyFetch(req.userId!, 'https://api.spotify.com/v1/me/player/previous', { method: 'POST' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/spotify/seek', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { positionMs } = req.body as { positionMs: number };
    await spotifyFetch(req.userId!, `https://api.spotify.com/v1/me/player/seek?position_ms=${Math.round(positionMs)}`, { method: 'PUT' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/spotify/volume', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { volume } = req.body as { volume: number };
    await spotifyFetch(req.userId!, `https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.round(volume)}`, { method: 'PUT' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.put('/spotify/like', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const nowRes = await spotifyFetch(req.userId!, 'https://api.spotify.com/v1/me/player/currently-playing');
    if (nowRes.status === 204) { res.json({ ok: false }); return; }
    const data = (await nowRes.json()) as { item?: { id: string } };
    if (!data.item?.id) { res.json({ ok: false }); return; }
    await spotifyFetch(req.userId!, `https://api.spotify.com/v1/me/tracks?ids=${data.item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get('/spotify/playlists', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const r = await spotifyFetch(req.userId!, 'https://api.spotify.com/v1/me/playlists?limit=50');
    const data = (await r.json()) as { items?: Array<{ id: string; name: string; uri: string; images: Array<{ url: string }> }> };
    res.json({ playlists: data.items ?? [] });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.post('/spotify/play-playlist', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { playlistUri } = req.body as { playlistUri: string };
    await spotifyFetch(req.userId!, 'https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context_uri: playlistUri }),
    });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.get('/spotify/devices', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const r = await spotifyFetch(req.userId!, 'https://api.spotify.com/v1/me/player/devices');
    const data = (await r.json()) as { devices?: Array<{ id: string; name: string; type: string; is_active: boolean; volume_percent: number }> };
    res.json({ devices: data.devices ?? [] });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

router.delete('/spotify/disconnect', async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.user.update({
    where: { id: req.userId! },
    data: { spotifyAccessToken: null, spotifyRefreshToken: null },
  });
  res.json({ ok: true });
});

// ─── Google Fit ───────────────────────────────────────────────────────────────

router.get('/googlefit/auth', (req: AuthRequest, res: Response): void => {
  const clientId    = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLEFIT_REDIRECT_URI ?? `${process.env.API_URL ?? 'http://localhost:3001'}/api/v1/integrations/googlefit/callback`;

  if (!clientId) { res.status(500).json({ error: 'GOOGLE_CLIENT_ID no configurado' }); return; }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.sleep.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
    ].join(' '),
    access_type: 'offline',
    prompt:      'consent',
    state:       signOAuthState({ userId: req.userId!, provider: 'googlefit' }),
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/googlefit/today', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId! },
    select: { googleAccessToken: true, googleFitConnected: true },
  });

  if (!user.googleFitConnected || !user.googleAccessToken) {
    res.status(401).json({ error: 'Google Fit no conectado' }); return;
  }

  const now = Date.now();
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

  try {
    const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${user.googleAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [
          { dataTypeName: 'com.google.step_count.delta' },
          { dataTypeName: 'com.google.calories.expended' },
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startOfDay.getTime(),
        endTimeMillis:   now,
      }),
    });

    const data = (await response.json()) as {
      bucket?: Array<{
        dataset: Array<{
          dataSourceId: string;
          point: Array<{ value: Array<{ intVal?: number; fpVal?: number }> }>;
        }>;
      }>;
    };

    const bucket = data.bucket?.[0]?.dataset ?? [];
    let steps    = 0;
    let calories = 0;

    for (const ds of bucket) {
      const val = ds.point?.[0]?.value?.[0];
      if (ds.dataSourceId.includes('step_count')) steps    = val?.intVal ?? 0;
      if (ds.dataSourceId.includes('calories'))   calories = Math.round(val?.fpVal ?? 0);
    }

    res.json({ steps, calories, date: startOfDay.toISOString() });
  } catch (error) {
    console.error('[Integrations] Google Fit today error:', error);
    res.status(500).json({ error: 'googlefit_error' });
  }
});

// ─── Integration status ───────────────────────────────────────────────────────

router.get('/status', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId! },
    select: {
      googleAccessToken:  true,
      spotifyAccessToken: true,
      googleFitConnected: true,
    },
  });

  res.json({
    googleCalendar: !!user.googleAccessToken,
    spotify:        !!user.spotifyAccessToken,
    googleFit:      user.googleFitConnected,
  });
});

export default router;
