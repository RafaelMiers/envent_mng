import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/client'
import {
  getCurrentOrganizer,
  loginOrganizer,
  type Organizer,
} from '../../../shared/api/organizers'
import { FormField, inputClasses } from '../../organizer-registration/components/FormField'

interface OrganizerLoginFormProps {
  onAuthenticated: (organizer: Organizer, accessToken: string) => void
}

export function OrganizerLoginForm({
  onAuthenticated,
}: OrganizerLoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const session = await loginOrganizer({ email: email.trim(), password })
      const organizer = await getCurrentOrganizer(session.access_token)
      onAuthenticated(organizer, session.access_token)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else if (error instanceof TypeError) {
        setErrorMessage(
          'Não foi possível conectar à API. Verifique se o servidor está funcionando e tente novamente.',
        )
      } else {
        setErrorMessage('Não foi possível entrar. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <FormField id="login-email" label="E-mail" required>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          className={inputClasses}
          placeholder="voce@suaorganizacao.com.br"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </FormField>

      <FormField id="login-password" label="Senha" required>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`${inputClasses} pr-12`}
            placeholder="Sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 grid min-h-12 w-12 place-items-center text-violet-100/45 transition hover:text-violet-100 focus-visible:outline-2 focus-visible:outline-violet-300"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="size-5"
            >
              {showPassword ? (
                <path
                  d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A10.7 10.7 0 0112 5c5.5 0 9 7 9 7a15.6 15.6 0 01-3 3.8M6.2 6.3C4.1 7.7 3 10 3 12c0 0 3.5 7 9 7 1.3 0 2.5-.4 3.5-1"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <>
                  <path
                    d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="2.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                </>
              )}
            </svg>
          </button>
        </div>
      </FormField>

      {errorMessage ? (
        <p
          className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm leading-relaxed text-rose-200"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 text-base font-semibold text-white shadow-[0_12px_35px_-12px_rgba(139,92,246,0.8)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300 disabled:cursor-wait disabled:opacity-65"
      >
        {isSubmitting ? (
          <>
            <span className="size-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
            Validando seu acesso...
          </>
        ) : (
          'Entrar na minha conta'
        )}
      </button>
    </form>
  )
}
