export interface OrganizerRegistrationValues {
  organizationName: string
  cnpj: string
  email: string
  phone: string
  password: string
  passwordConfirmation: string
}

export type OrganizerRegistrationErrors = Partial<
  Record<keyof OrganizerRegistrationValues, string>
>

export function normalizeCnpj(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

export function formatCnpj(value: string): string {
  const normalized = normalizeCnpj(value).slice(0, 14)

  if (!/^\d*$/.test(normalized)) {
    return normalized
  }

  const first = normalized.slice(0, 2)
  const second = normalized.slice(2, 5)
  const third = normalized.slice(5, 8)
  const branch = normalized.slice(8, 12)
  const checkDigits = normalized.slice(12, 14)

  return [
    first,
    second && `.${second}`,
    third && `.${third}`,
    branch && `/${branch}`,
    checkDigits && `-${checkDigits}`,
  ]
    .filter(Boolean)
    .join('')
}

function hasValidCnpjFormat(value: string): boolean {
  const cnpj = normalizeCnpj(value)

  return cnpj.length === 14 && /^[A-Z0-9]{12}\d{2}$/.test(cnpj)
}

export function validateOrganizerRegistration(
  values: OrganizerRegistrationValues,
): OrganizerRegistrationErrors {
  const errors: OrganizerRegistrationErrors = {}
  const organizationName = values.organizationName.trim()
  const email = values.email.trim()
  const phone = values.phone.trim()

  if (!organizationName) {
    errors.organizationName = 'Informe o nome da organização.'
  } else if (organizationName.length > 150) {
    errors.organizationName = 'Use no máximo 150 caracteres.'
  }

  if (!hasValidCnpjFormat(values.cnpj)) {
    errors.cnpj = 'Informe um CNPJ com 14 caracteres e dois dígitos finais.'
  }

  if (!email) {
    errors.email = 'Informe um e-mail de contato.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (phone) {
    const digitCount = phone.replace(/\D/g, '').length
    if (digitCount !== 11) {
      errors.phone = 'Informe um telefone com 11 dígitos.'
    }
  }

  if (values.password.length < 8 || values.password.length > 128) {
    errors.password = 'A senha deve ter entre 8 e 128 caracteres.'
  }

  if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = 'As senhas não coincidem.'
  }

  return errors
}
