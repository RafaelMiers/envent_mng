import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/client'
import {
  getCurrentOrganizer,
  loginOrganizer,
  registerOrganizer,
  type Organizer,
} from '../../../shared/api/organizers'
import { FormField, inputClasses } from './FormField'
import {
  formatCnpj,
  normalizeCnpj,
  validateOrganizerRegistration,
  type OrganizerRegistrationErrors,
  type OrganizerRegistrationValues,
} from '../validation'
import { LoadingIndicator } from '../../../shared/components/LoadingIndicator'
import { formatPhone } from '../../../shared/formatters/phone'

const initialValues: OrganizerRegistrationValues = {
  organizationName: '',
  cnpj: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirmation: '',
}

interface OrganizerRegistrationFormProps {
  onRegistered: (organizer: Organizer, accessToken: string) => void
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
      <path
        d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A10.7 10.7 0 0112 5c5.5 0 9 7 9 7a15.6 15.6 0 01-3 3.8M6.2 6.3C4.1 7.7 3 10 3 12c0 0 3.5 7 9 7 1.3 0 2.5-.4 3.5-1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
      <path
        d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export function OrganizerRegistrationForm({
  onRegistered,
}: OrganizerRegistrationFormProps) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<OrganizerRegistrationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  function updateField(
    field: keyof OrganizerRegistrationValues,
    value: string,
  ) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validateOrganizerRegistration(values)
    setErrors(validationErrors)
    setFormError('')

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    let registrationCompleted = false
    try {
      setLoadingMessage('Criando sua organização...')
      const organizer = await registerOrganizer({
        organization_name: values.organizationName.trim(),
        cnpj: normalizeCnpj(values.cnpj),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim() || null,
        password: values.password,
      })
      registrationCompleted = true
      setLoadingMessage('Preparando seu acesso...')
      const session = await loginOrganizer({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      })
      setLoadingMessage('Abrindo seu painel...')
      const currentOrganizer = await getCurrentOrganizer(session.access_token)
      if (currentOrganizer.id !== organizer.id) {
        throw new Error('A conta autenticada não corresponde ao cadastro.')
      }
      onRegistered(currentOrganizer, session.access_token)
    } catch (error) {
      if (registrationCompleted) {
        const detail =
          error instanceof ApiError
            ? ` ${error.message}`
            : error instanceof TypeError
              ? ' Verifique sua conexão com a API e entre pela opção de login.'
              : ''
        setFormError(
          `Organização criada, mas não foi possível entrar automaticamente.${detail} Você pode acessar pela opção "Já tem uma conta? Entrar".`,
        )
      } else if (error instanceof ApiError) {
        setFormError(error.message)
      } else if (error instanceof TypeError) {
        setFormError(
          'Não foi possível conectar à API. Verifique se o servidor está funcionando e tente novamente.',
        )
      } else {
        setFormError('O cadastro não foi concluído. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
      setLoadingMessage('')
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSubmitting}
    >
      {isSubmitting ? (
        <LoadingIndicator label={loadingMessage} fullScreen />
      ) : null}
      <FormField
        id="organization-name"
        label="Nome da organização"
        required
        error={errors.organizationName}
      >
        <input
          id="organization-name"
          name="organization_name"
          className={inputClasses}
          autoComplete="organization"
          placeholder="Ex.: Instituto Horizonte"
          maxLength={150}
          value={values.organizationName}
          onChange={(event) => updateField('organizationName', event.target.value)}
          aria-invalid={Boolean(errors.organizationName)}
          aria-describedby={
            errors.organizationName ? 'organization-name-description' : undefined
          }
          required
        />
      </FormField>

      <FormField
        id="cnpj"
        label="CNPJ"
        required
        hint="Digite os 14 caracteres do CNPJ da organização."
        error={errors.cnpj}
      >
        <input
          id="cnpj"
          name="cnpj"
          className={inputClasses}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          placeholder="00.000.000/0000-00"
          value={values.cnpj}
          onChange={(event) =>
            updateField('cnpj', formatCnpj(event.target.value))
          }
          aria-invalid={Boolean(errors.cnpj)}
          aria-describedby="cnpj-description"
          required
        />
      </FormField>

      <FormField
        id="email"
        label="E-mail de contato"
        required
        error={errors.email}
      >
        <input
          id="email"
          name="email"
          type="email"
          className={inputClasses}
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="voce@suaorganizacao.com.br"
          maxLength={254}
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-description' : undefined}
          required
        />
      </FormField>

      <FormField
        id="phone"
        label={
          <>
            Telefone <span className="font-normal text-violet-100/40">(opcional)</span>
          </>
        }
        error={errors.phone}
      >
        <input
          id="phone"
          name="phone"
          type="tel"
          className={inputClasses}
          autoComplete="tel"
          inputMode="tel"
          placeholder="(00) 0 0000-0000"
          maxLength={16}
          value={values.phone}
          onChange={(event) =>
            updateField('phone', formatPhone(event.target.value))
          }
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? 'phone-description' : undefined}
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="password"
          label="Senha"
          required
          hint="Use pelo menos 8 caracteres."
          error={errors.password}
        >
          <div className="relative">
            <input
              id="password"
              name="new-password"
              type={showPassword ? 'text' : 'password'}
              className={`${inputClasses} pr-12`}
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              minLength={8}
              maxLength={128}
              value={values.password}
              onChange={(event) => updateField('password', event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby="password-description"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 grid min-h-12 w-12 place-items-center text-violet-100/45 transition hover:text-violet-100 focus-visible:outline-2 focus-visible:outline-violet-300"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
        </FormField>

        <FormField
          id="password-confirmation"
          label="Confirme a senha"
          required
          error={errors.passwordConfirmation}
        >
          <div className="relative">
            <input
              id="password-confirmation"
              name="confirm-password"
              type={showPasswordConfirmation ? 'text' : 'password'}
              className={`${inputClasses} pr-12`}
              autoComplete="new-password"
              placeholder="Digite a senha novamente"
              maxLength={128}
              value={values.passwordConfirmation}
              onChange={(event) =>
                updateField('passwordConfirmation', event.target.value)
              }
              aria-invalid={Boolean(errors.passwordConfirmation)}
              aria-describedby={
                errors.passwordConfirmation
                  ? 'password-confirmation-description'
                  : undefined
              }
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 grid min-h-12 w-12 place-items-center text-violet-100/45 transition hover:text-violet-100 focus-visible:outline-2 focus-visible:outline-violet-300"
              onClick={() =>
                setShowPasswordConfirmation((visible) => !visible)
              }
              aria-label={
                showPasswordConfirmation ? 'Ocultar senha' : 'Mostrar senha'
              }
              aria-pressed={showPasswordConfirmation}
            >
              <EyeIcon visible={showPasswordConfirmation} />
            </button>
          </div>
        </FormField>
      </div>

      {formError ? (
        <div
          className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm leading-relaxed text-rose-200"
          role="alert"
          aria-live="polite"
        >
          {formError}
        </div>
      ) : null}

      <div className="space-y-4 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="group flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 text-base font-semibold text-white shadow-[0_12px_35px_-12px_rgba(139,92,246,0.8)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300 disabled:cursor-wait disabled:opacity-65"
        >
          {isSubmitting ? (
            <>
              <span className="size-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
              Criando sua organização...
            </>
          ) : (
            <>
              Criar minha organização
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className="size-5 transition-transform group-hover:translate-x-1"
              >
                <path
                  d="M4.2 10h11.6m-4.8-4.8l4.8 4.8-4.8 4.8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          )}
        </button>
        <p className="text-center text-xs leading-relaxed text-violet-100/40">
          Ao continuar, você confirma que os dados da organização estão corretos.
        </p>
      </div>
    </form>
  )
}
