export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ApiErrorBody {
  detail?: string | Array<{ msg?: string }>
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'detail' in value
}

function getErrorMessage(body: unknown, status: number): string {
  if (isApiErrorBody(body)) {
    if (typeof body.detail === 'string') {
      return body.detail
    }

    if (Array.isArray(body.detail)) {
      const messages = body.detail
        .map((error) => error.msg)
        .filter((message): message is string => Boolean(message))
      if (messages.length > 0) {
        return `Confira os dados informados. ${messages.join(' ')}`
      }
    }
  }

  if (status === 401) {
    return 'Sua sessão expirou. Entre novamente.'
  }

  if (status === 409) {
    return 'Não foi possível concluir: há dados duplicados ou vínculos que precisam ser preservados.'
  }

  return `Não foi possível concluir a operação (erro ${status}). Tente novamente.`
}

async function request(
  path: string,
  init: RequestInit,
  accessToken?: string,
): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`/api${path}`, { ...init, headers })
  if (response.ok) {
    return response
  }

  let body: unknown
  try {
    body = await response.json()
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error
    }
  }

  throw new ApiError(getErrorMessage(body, response.status), response.status)
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const response = await request(path, init, accessToken)
  return (await response.json()) as T
}

export async function apiRequestVoid(
  path: string,
  init: RequestInit,
  accessToken?: string,
): Promise<void> {
  await request(path, init, accessToken)
}
