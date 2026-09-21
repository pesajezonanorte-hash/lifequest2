import api from '../lib/api';

export interface AgendaEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  startDate: string;
  endDate?: string;
  isAllDay: boolean;
  location?: string;
  reminder?: number;
  isCompleted: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchEvents(params?: { from?: string; to?: string; date?: string }): Promise<AgendaEvent[]> {
  const q = new URLSearchParams();
  if (params?.from) q.set('from', params.from);
  if (params?.to)   q.set('to',   params.to);
  if (params?.date) q.set('date', params.date);
  const { data } = await api.get<{ events: AgendaEvent[] }>(`/agenda?${q}`);
  return data.events;
}

export async function fetchUpcoming(): Promise<AgendaEvent[]> {
  const { data } = await api.get<{ events: AgendaEvent[] }>('/agenda/upcoming');
  return data.events;
}

export async function createEvent(body: Omit<AgendaEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isCompleted'>): Promise<AgendaEvent> {
  const { data } = await api.post<{ event: AgendaEvent }>('/agenda', body);
  return data.event;
}

export async function updateEvent(id: string, body: Partial<AgendaEvent>): Promise<AgendaEvent> {
  const { data } = await api.patch<{ event: AgendaEvent }>(`/agenda/${id}`, body);
  return data.event;
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/agenda/${id}`);
}

// ─── Google Calendar API Methods ─────────────────────────────────────────────

export async function getGoogleAuthUrl(redirectUri?: string): Promise<string> {
  const { data } = await api.get<{ url: string }>(`/agenda/google/url${redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : ''}`);
  return data.url;
}

export async function handleGoogleCallback(code: string, redirectUri: string): Promise<void> {
  await api.post('/agenda/google/callback', { code, redirectUri });
}

export async function syncGoogleCalendar(): Promise<{ syncedCount: number; message: string }> {
  const { data } = await api.post<{ syncedCount: number; message: string }>('/agenda/google/sync');
  return data;
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await api.delete('/agenda/google/disconnect');
}
