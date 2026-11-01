export interface RegistrationFormValues {
  name: string
  cpf: string
  age: string
  email: string
  phone: string
}

export type RegistrationFormErrors = Partial<
  Record<keyof RegistrationFormValues, string>
>

export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  const first = digits.slice(0, 3)
  const second = digits.slice(3, 6)
  const third = digits.slice(6, 9)
  const last = digits.slice(9)

  return [
    first,
    second && `.${second}`,
    third && `.${third}`,
    last && `-${last}`,
  ]
    .filter(Boolean)
    .join('')
}

export function validateRegistrationForm(
  values: RegistrationFormValues,
): RegistrationFormErrors {
  const errors: RegistrationFormErrors = {}
  const name = values.name.trim()
  const cpfDigits = values.cpf.replace(/\D/g, '')
  const age = Number(values.age)
  const email = values.email.trim()
  const phoneDigits = values.phone.replace(/\D/g, '')

  if (!name) {
    errors.name = 'Informe seu nome.'
  } else if (name.length > 150) {
    errors.name = 'Use no máximo 150 caracteres.'
  }

  if (cpfDigits.length !== 11) {
    errors.cpf = 'Informe os 11 dígitos do CPF.'
  }

  if (!values.age.trim() || !Number.isInteger(age) || age < 0 || age > 120) {
    errors.age = 'Informe uma idade entre 0 e 120 anos.'
  }

  if (!email) {
    errors.email = 'Informe seu e-mail para receber o código.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (values.phone.trim() && phoneDigits.length !== 11) {
    errors.phone = 'Informe um telefone com 11 dígitos.'
  }

  return errors
}
