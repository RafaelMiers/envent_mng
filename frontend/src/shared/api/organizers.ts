import { apiRequest } from './client'

export interface RegisterOrganizerInput {
  organization_name: string
  cnpj: string
  email: string
  phone: string | null
  password: string
}

export interface Organizer {
  id: number
  organization_name: string
  cnpj: string
  email: string
  phone: string | null
}

export interface OrganizerCredentials {
  email: string
  password: string
}

export interface OrganizerSession {
  access_token: string
  token_type: string
}

export async function registerOrganizer(
  input: RegisterOrganizerInput,
): Promise<Organizer> {
  return apiRequest<Organizer>('/organizers', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function loginOrganizer(
  credentials: OrganizerCredentials,
): Promise<OrganizerSession> {
  return apiRequest<OrganizerSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function getCurrentOrganizer(
  accessToken: string,
): Promise<Organizer> {
  return apiRequest<Organizer>('/auth/me', {}, accessToken)
}
