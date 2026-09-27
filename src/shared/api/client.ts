import { supabase } from '@/shared/auth/supabase';
import type { EventDto, EventInput } from './types';
const baseUrl = (
  process.env.EXPO_PUBLIC_API_URL ?? 'https://gather-events.onrender.com/api/v1'
).replace(/\/$/, '');
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(data.session ? { authorization: `Bearer ${data.session.access_token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const eventsApi = {
  list: async (q = '', category = '') =>
    request<{ items: EventDto[]; total: number }>(
      `/events?${new URLSearchParams({ ...(q ? { q } : {}), ...(category ? { category } : {}) })}`,
    ),
  get: async (id: string) => request<EventDto>(`/events/${id}`),
  create: async (input: EventInput) =>
    request<EventDto>('/events', { method: 'POST', body: JSON.stringify(input) }),
  update: async (id: string, input: EventInput) =>
    request<EventDto>(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  rsvp: async (id: string, attending: boolean) =>
    request<void>(`/events/${id}/rsvp`, { method: attending ? 'POST' : 'DELETE' }),
  myRsvps: async () => request<{ items: EventDto[]; total: number }>('/me/rsvps'),
};
