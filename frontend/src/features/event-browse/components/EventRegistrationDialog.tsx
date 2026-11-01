import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ApiError } from '../../../shared/api/client'
import {
  getRegistrationTicket,
  startEventRegistration,
  verifyRegistrationCode,
  type RegistrationTicket,
} from '../../../shared/api/registrations'
import type { Event } from '../../../shared/api/events'
import { formatPhone } from '../../../shared/formatters/phone'
import {
  formatCpf,
  validateRegistrationForm,
  type RegistrationFormErrors,
  type RegistrationFormValues,
} from '../validation'

interface EventRegistrationDialogProps {
  event: Event
  onClose: () => void
}

const initialValues: RegistrationFormValues = {
  name: '',
  cpf: '',
  age: '',
  email: '',
  phone: '',
}

const inputClasses =
  'min-h-12 w-full rounded-xl border border-white/10 bg-[#100b18] px-4 text-[15px] text-white outline-none transition placeholder:text-violet-100/30 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15'

const ticketDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof TypeError) {
    return 'Não foi possível conectar à API. Verifique sua conexão e tente novamente.'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Não foi possível concluir a inscrição. Tente novamente.'
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-violet-100/80"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-200">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function EventRegistrationDialog({
  event,
  onClose,
}: EventRegistrationDialogProps) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<RegistrationFormErrors>({})
  const [participantId, setParticipantId] = useState<number | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [ticket, setTicket] = useState<RegistrationTicket | null>(null)
  const [ticketEmailSent, setTicketEmailSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (resendCountdown === 0) {
      return
    }

    const timer = window.setTimeout(
      () => setResendCountdown((seconds) => seconds - 1),
      1000,
    )
    return () => window.clearTimeout(timer)
  }, [resendCountdown])

  function updateField(field: keyof RegistrationFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setErrorMessage('')
  }

  async function handleStartRegistration(
    formEvent: FormEvent<HTMLFormElement>,
  ) {
    formEvent.preventDefault()
    const formErrors = validateRegistrationForm(values)
    setErrors(formErrors)
    setErrorMessage('')
    if (Object.keys(formErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const result = await startEventRegistration(event.id, {
        name: values.name.trim(),
        cpf: values.cpf.replace(/\D/g, ''),
        age: Number(values.age),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim() || null,
      })
      setParticipantId(result.participant_id)
      setResendCountdown(60)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerifyCode(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    if (participantId === null || !/^\d{6}$/.test(verificationCode)) {
      setErrorMessage('Informe o código de 6 dígitos enviado por e-mail.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const access = await verifyRegistrationCode(
        event.id,
        participantId,
        verificationCode,
      )
      const registrationTicket = await getRegistrationTicket(
        access.registration_id,
        access.ticket_access_token,
      )
      setTicket(registrationTicket)
      setTicketEmailSent(access.ticket_email_sent)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResendCode() {
    setIsSubmitting(true)
    setErrorMessage('')
    try {
      const result = await startEventRegistration(event.id, {
        name: values.name.trim(),
        cpf: values.cpf.replace(/\D/g, ''),
        age: Number(values.age),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim() || null,
      })
      setParticipantId(result.participant_id)
      setResendCountdown(60)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget && !isSubmitting) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-dialog-title"
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#130e1d] p-5 shadow-2xl shadow-black/50 sm:rounded-3xl sm:p-8"
      >
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
              {ticket
                ? 'Inscrição confirmada'
                : participantId
                  ? 'Confirme seu e-mail'
                  : 'Inscrição no evento'}
            </p>
            <h2
              id="registration-dialog-title"
              className="mt-2 text-xl font-semibold text-white sm:text-2xl"
            >
              {ticket
                ? 'Seu ingresso está pronto'
                : participantId
                  ? 'Digite o código de confirmação'
                  : event.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-violet-100/55">
              {ticket
                ? 'Apresente este QR code na entrada do evento.'
                : participantId
                  ? 'Enviamos um código de 6 dígitos para o e-mail de contato.'
                  : 'Preencha seus dados para receber o código e garantir sua vaga.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 text-violet-100/65 transition hover:bg-white/[0.06] disabled:opacity-50"
            aria-label="Fechar inscrição"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {errorMessage ? (
          <p
            className="mb-5 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm leading-relaxed text-rose-200"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        {ticket ? (
          <div>
            <article className="overflow-hidden rounded-2xl border border-violet-300/20 bg-[#0c0815]">
              <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
                <p className="text-base font-semibold tracking-tight text-white">
                  Event<span className="text-violet-300">Check</span>
                </p>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                  Ingresso confirmado
                </span>
              </header>

              <div className="grid gap-5 p-4 sm:grid-cols-[minmax(0,1fr)_176px] sm:items-center sm:p-5">
                <div className="order-2 min-w-0 space-y-3 sm:order-1">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-300">
                      Participante
                    </p>
                    <p className="mt-1 break-words text-base font-semibold text-white">
                      {values.name.trim()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-300">
                      Evento
                    </p>
                    <p className="mt-1 break-words text-sm font-medium text-white">
                      {ticket.event_title}
                    </p>
                  </div>
                  <div className="grid gap-3 border-t border-white/[0.08] pt-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-100/40">
                        Local
                      </p>
                      <p className="mt-1 break-words text-xs text-violet-100/75">
                        {ticket.event_location}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-100/40">
                        Data e hora
                      </p>
                      <time
                        dateTime={ticket.starts_at}
                        className="mt-1 block text-xs text-violet-100/75"
                      >
                        {ticketDateFormatter.format(new Date(ticket.starts_at))}
                      </time>
                    </div>
                  </div>
                </div>

                <div className="order-1 flex min-h-44 flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white p-3 sm:order-2">
                  {ticket.qr_svg ? (
                    <img
                      src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(ticket.qr_svg)}`}
                      alt={`QR code do ingresso para ${ticket.event_title}`}
                      className="size-36"
                    />
                  ) : (
                    <p className="text-center text-xs text-rose-700">
                      QR code indisponível
                    </p>
                  )}
                  <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Apresente na entrada
                  </p>
                </div>
              </div>
            </article>
            <p className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-400/[0.06] px-4 py-3 text-sm leading-relaxed text-emerald-100">
              {ticket.message.body}
            </p>
            <p
              className={`mt-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                ticketEmailSent
                  ? 'border-violet-300/15 bg-violet-400/[0.06] text-violet-100/80'
                  : 'border-amber-300/20 bg-amber-400/[0.06] text-amber-100'
              }`}
              role="status"
            >
              {ticketEmailSent
                ? 'Também enviamos o ingresso para o e-mail informado na inscrição.'
                : 'Não foi possível enviar o ingresso por e-mail. Salve o QR code exibido acima.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 min-h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Concluir
            </button>
          </div>
        ) : participantId ? (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <Field id="verification-code" label="Código de confirmação">
              <input
                id="verification-code"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                className={`${inputClasses} text-center text-xl tracking-[0.35em]`}
                value={verificationCode}
                onChange={(event) =>
                  setVerificationCode(
                    event.target.value.replace(/\D/g, '').slice(0, 6),
                  )
                }
                required
              />
            </Field>
            <p className="text-xs leading-relaxed text-violet-100/45">
              Se o CPF já estiver cadastrado, o código vai para o e-mail
              associado a ele.
            </p>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isSubmitting || resendCountdown > 0}
              className="min-h-10 text-sm font-medium text-violet-300 underline decoration-violet-300/30 underline-offset-4 transition hover:text-violet-200 disabled:cursor-wait disabled:opacity-50"
            >
              {resendCountdown > 0
                ? `Reenviar código em ${resendCountdown}s`
                : 'Reenviar código'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-65"
            >
              {isSubmitting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Confirmando inscrição...
                </>
              ) : (
                'Confirmar e ver ingresso'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStartRegistration} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="attendee-name" label="Nome completo" error={errors.name}>
                <input
                  id="attendee-name"
                  autoComplete="name"
                  maxLength={150}
                  className={inputClasses}
                  value={values.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  required
                />
              </Field>
              <Field id="attendee-cpf" label="CPF" error={errors.cpf}>
                <input
                  id="attendee-cpf"
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={inputClasses}
                  value={values.cpf}
                  onChange={(event) =>
                    updateField('cpf', formatCpf(event.target.value))
                  }
                  aria-invalid={Boolean(errors.cpf)}
                  required
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="attendee-age" label="Idade" error={errors.age}>
                <input
                  id="attendee-age"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{1,3}"
                  maxLength={3}
                  className={inputClasses}
                  value={values.age}
                  onChange={(event) =>
                    updateField(
                      'age',
                      event.target.value.replace(/\D/g, '').slice(0, 3),
                    )
                  }
                  aria-invalid={Boolean(errors.age)}
                  required
                />
              </Field>
              <Field id="attendee-phone" label="Telefone (opcional)" error={errors.phone}>
                <input
                  id="attendee-phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(00) 0 0000-0000"
                  maxLength={16}
                  className={inputClasses}
                  value={values.phone}
                  onChange={(event) =>
                    updateField('phone', formatPhone(event.target.value))
                  }
                  aria-invalid={Boolean(errors.phone)}
                />
              </Field>
            </div>
            <Field
              id="attendee-email"
              label="E-mail para confirmação"
              error={errors.email}
            >
              <input
                id="attendee-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                maxLength={254}
                placeholder="voce@email.com"
                className={inputClasses}
                value={values.email}
                onChange={(event) => updateField('email', event.target.value)}
                aria-invalid={Boolean(errors.email)}
                required
              />
            </Field>
            <p className="text-xs leading-relaxed text-violet-100/45">
              O CPF é usado para identificar sua inscrição. Não verificamos os
              dígitos, então você pode usar um número fictício para testar.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-65"
            >
              {isSubmitting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Enviando código...
                </>
              ) : (
                'Enviar código de confirmação'
              )}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
