import { apiRequest } from './client'

export interface StartRegistrationInput {
  name: string
  cpf: string
  age: number
  email: string
  phone: string | null
}

export interface RegistrationStart {
  participant_id: number
}

export interface RegistrationAccess {
  registration_id: number
  ticket_access_token: string
  expires_at: string
  ticket_email_sent: boolean
}

export interface RegistrationTicket {
  registration_id: number
  event_title: string
  event_location: string
  starts_at: string
  ends_at: string
  expires_at: string
  qr_payload: string | null
  qr_svg: string | null
  checked_in_at: string | null
  message: {
    id: number
    body: string
    created_at: string
    read_at: string
  }
}

export interface EventRegistration {
  id: number
  participant_id: number
  participant_name: string
  participant_age: number
  participant_email: string | null
  participant_phone: string | null
  created_at: string
  checked_in_at: string | null
}

export interface CheckInResult {
  registration_id: number
  participant_name: string
  checked_at: string
}

export async function listEventRegistrations(
  eventId: number,
  accessToken: string,
): Promise<EventRegistration[]> {
  return apiRequest<EventRegistration[]>(
    `/events/${eventId}/registrations`,
    {},
    accessToken,
  )
}

export async function checkInTicket(
  eventId: number,
  ticketToken: string,
  accessToken: string,
): Promise<CheckInResult> {
  return apiRequest<CheckInResult>(
    `/events/${eventId}/checkins`,
    {
      method: 'POST',
      body: JSON.stringify({ ticket_token: ticketToken }),
    },
    accessToken,
  )
}

export async function startEventRegistration(
  eventId: number,
  input: StartRegistrationInput,
): Promise<RegistrationStart> {
  return apiRequest<RegistrationStart>(
    `/events/${eventId}/registrations/start`,
    { method: 'POST', body: JSON.stringify(input) },
  )
}

export async function verifyRegistrationCode(
  eventId: number,
  participantId: number,
  code: string,
): Promise<RegistrationAccess> {
  return apiRequest<RegistrationAccess>(
    `/events/${eventId}/registrations/verify-code`,
    {
      method: 'POST',
      body: JSON.stringify({ participant_id: participantId, code }),
    },
  )
}

export async function getRegistrationTicket(
  registrationId: number,
  accessToken: string,
): Promise<RegistrationTicket> {
  return apiRequest<RegistrationTicket>(
    `/registrations/${registrationId}/ticket`,
    { headers: { 'X-Ticket-Access-Token': accessToken } },
  )
}
