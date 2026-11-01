import { apiRequest, apiRequestVoid } from './client'

export interface Event {
  id: number
  organizer_id: number
  title: string
  location: string
  starts_at: string
  ends_at: string
}

export interface CreateEventInput {
  title: string
  location: string
  starts_at: string
  ends_at: string
}

export async function listPublicEvents(): Promise<Event[]> {
  return apiRequest<Event[]>('/events/public')
}

export async function listEvents(accessToken: string): Promise<Event[]> {
  return apiRequest<Event[]>('/events', {}, accessToken)
}

export async function createEvent(
  input: CreateEventInput,
  accessToken: string,
): Promise<Event> {
  return apiRequest<Event>(
    '/events',
    { method: 'POST', body: JSON.stringify(input) },
    accessToken,
  )
}

export async function deleteEvent(
  eventId: number,
  accessToken: string,
): Promise<void> {
  return apiRequestVoid(`/events/${eventId}`, { method: 'DELETE' }, accessToken)
}
