import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError } from '../../../shared/api/client'
import type { Event } from '../../../shared/api/events'
import {
  checkInTicket,
  listEventRegistrations,
  type EventRegistration,
} from '../../../shared/api/registrations'
import { LoadingIndicator } from '../../../shared/components/LoadingIndicator'

const QrCodeScanner = lazy(() =>
  import('./QrCodeScanner').then((module) => ({
    default: module.QrCodeScanner,
  })),
)

interface ParticipantsPanelProps {
  events: Event[]
  accessToken: string
  onUnauthorized: () => void
}

type RegistrationFilter = 'all' | 'pending' | 'checked-in'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})
const EMPTY_REGISTRATIONS: EventRegistration[] = []

export function ParticipantsPanel({
  events,
  accessToken,
  onUnauthorized,
}: ParticipantsPanelProps) {
  const [selectedEventId, setSelectedEventId] = useState(
    () => events[0]?.id.toString() ?? '',
  )
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [loadedEventId, setLoadedEventId] = useState('')
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [ticketToken, setTicketToken] = useState('')
  const [filter, setFilter] = useState<RegistrationFilter>('all')
  const [search, setSearch] = useState('')
  const [requestError, setRequestError] = useState<{
    eventId: string
    message: string
  } | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const selectedEvent =
    events.find((event) => event.id.toString() === selectedEventId) ?? events[0]
  const activeEventId = selectedEvent?.id.toString() ?? ''
  const activeLoadKey = `${activeEventId}:${reloadKey}`
  const isLoading = activeEventId.length > 0 && loadedEventId !== activeLoadKey
  const errorMessage =
    requestError?.eventId === activeEventId ? requestError.message : ''
  const displayedRegistrations =
    loadedEventId === activeLoadKey ? registrations : EMPTY_REGISTRATIONS

  useEffect(() => {
    if (!activeEventId) {
      return
    }

    let isActive = true

    listEventRegistrations(Number(activeEventId), accessToken)
      .then((loadedRegistrations) => {
        if (isActive) {
          setRegistrations(loadedRegistrations)
          setRequestError(null)
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return
        }
        setRegistrations([])
        if (error instanceof ApiError && error.status === 401) {
          onUnauthorized()
        } else if (error instanceof Error) {
          setRequestError({ eventId: activeEventId, message: error.message })
        } else {
          setRequestError({
            eventId: activeEventId,
            message: 'Não foi possível carregar os participantes.',
          })
        }
      })
      .finally(() => {
        if (isActive) {
          setLoadedEventId(activeLoadKey)
        }
      })

    return () => {
      isActive = false
    }
  }, [accessToken, activeEventId, activeLoadKey, onUnauthorized])

  const handleCheckIn = useCallback(
    async (rawToken: string) => {
      const token = rawToken.trim()
      if (!/^[a-f0-9]{64}$/.test(token)) {
        setRequestError({
          eventId: activeEventId,
          message: 'O QR code não contém um código de ingresso válido.',
        })
        setSuccessMessage('')
        return
      }
      if (!activeEventId || isCheckingIn) {
        return
      }

      setIsCheckingIn(true)
      setRequestError(null)
      setSuccessMessage('')
      try {
        const result = await checkInTicket(
          Number(activeEventId),
          token,
          accessToken,
        )
        setRegistrations((current) =>
          current.map((registration) =>
            registration.id === result.registration_id
              ? { ...registration, checked_in_at: result.checked_at }
              : registration,
          ),
        )
        setSuccessMessage(`Check-in confirmado para ${result.participant_name}.`)
        setTicketToken('')
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          onUnauthorized()
        } else if (error instanceof Error) {
          setRequestError({ eventId: activeEventId, message: error.message })
        } else {
          setRequestError({
            eventId: activeEventId,
            message: 'Não foi possível confirmar o check-in.',
          })
        }
      } finally {
        setIsCheckingIn(false)
      }
    },
    [accessToken, activeEventId, isCheckingIn, onUnauthorized],
  )

  const visibleRegistrations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    return displayedRegistrations.filter((registration) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'checked-in' && registration.checked_in_at !== null) ||
        (filter === 'pending' && registration.checked_in_at === null)
      const matchesSearch =
        query.length === 0 ||
        registration.participant_name.toLocaleLowerCase('pt-BR').includes(query)
      return matchesFilter && matchesSearch
    })
  }, [displayedRegistrations, filter, search])

  const checkedInCount = displayedRegistrations.filter(
    (registration) => registration.checked_in_at !== null,
  ).length
  const pendingCount = displayedRegistrations.length - checkedInCount

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-200/15 bg-[#130e1d]/60 px-5 py-12 text-center">
        <h3 className="text-lg font-semibold text-white">Nenhum evento cadastrado</h3>
        <p className="mt-2 text-sm text-violet-100/50">
          Crie um evento para acompanhar inscrições e fazer check-in.
        </p>
      </div>
    )
  }

  return (
    <section aria-labelledby="participants-heading" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="participants-heading"
            className="text-xl font-semibold text-white sm:text-2xl"
          >
            Participantes
          </h2>
          <p className="mt-1 text-sm text-violet-100/45">
            Consulte as inscrições e valide os ingressos na entrada.
          </p>
        </div>
        <label className="grid gap-1.5 text-xs font-medium text-violet-100/60 sm:min-w-64">
          Evento
          <select
          value={activeEventId}
          disabled={isCheckingIn}
          onChange={(event) => {
            setSelectedEventId(event.target.value)
            setSuccessMessage('')
              setTicketToken('')
            setRequestError(null)
          }}
            className="min-h-11 rounded-xl border border-white/10 bg-[#130e1d] px-3 text-sm text-white outline-none focus:border-violet-300/50"
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedEvent ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="rounded-2xl border border-white/[0.08] bg-[#130e1d]/75 p-4 sm:p-5">
            <div className="flex flex-wrap gap-2">
              <Stat label="Inscritos" value={displayedRegistrations.length} />
              <Stat label="Check-ins" value={checkedInCount} />
              <Stat label="Pendentes" value={pendingCount} />
            </div>

            <form
              className="mt-5 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                void handleCheckIn(ticketToken)
              }}
            >
              <label className="sr-only" htmlFor="ticket-token">
                Código do ingresso
              </label>
              <input
                id="ticket-token"
                value={ticketToken}
                disabled={isCheckingIn}
                onChange={(event) => setTicketToken(event.target.value)}
                placeholder="Leia ou digite o código do ingresso"
                autoComplete="off"
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-violet-100/30 outline-none focus:border-violet-300/50"
              />
              <button
                type="submit"
                disabled={
                  isLoading || isCheckingIn || ticketToken.trim().length === 0
                }
                aria-busy={isCheckingIn}
                className="min-h-11 rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-50"
              >
                {isCheckingIn ? 'Validando...' : 'Confirmar check-in'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setIsScannerOpen((open) => !open)}
              disabled={isLoading || isCheckingIn}
              className="mt-3 min-h-10 rounded-lg border border-violet-300/20 px-3 text-sm font-medium text-violet-200 transition hover:bg-violet-400/[0.08]"
            >
              {isScannerOpen ? 'Fechar leitor' : 'Ler QR code com a câmera'}
            </button>

            {isScannerOpen ? (
              <div className="mt-4">
                <Suspense
                  fallback={
                    <p className="text-sm text-violet-100/55">
                      Preparando leitor de QR code...
                    </p>
                  }
                >
                  <QrCodeScanner
                    onDetected={(value) => {
                      setIsScannerOpen(false)
                      void handleCheckIn(value)
                    }}
                    onClose={() => setIsScannerOpen(false)}
                  />
                </Suspense>
              </div>
            ) : null}

            {errorMessage ? (
              <p
                className="mt-4 rounded-xl border border-rose-300/15 bg-rose-400/[0.07] px-3 py-3 text-sm leading-relaxed text-rose-200"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p
                className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-3 text-sm text-emerald-200"
                role="status"
              >
                {successMessage}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#130e1d]/75 p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-white">Sobre o check-in</h3>
            <p className="mt-2 text-sm leading-relaxed text-violet-100/50">
              O ingresso é validado para o evento selecionado. Cada QR code só
              pode ser utilizado uma vez e o sistema mostra se já foi usado.
            </p>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/[0.08] bg-[#130e1d]/75">
        <div className="flex flex-col gap-3 border-b border-white/[0.08] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-white">Lista de inscritos</h3>
              <p className="mt-1 text-xs text-violet-100/40">
                {selectedEvent?.title}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="participant-search">
                Buscar participante
              </label>
              <input
                id="participant-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome"
                className="min-h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-violet-100/30 outline-none focus:border-violet-300/50 sm:w-56"
              />
              <button
                type="button"
                onClick={() => {
                  setRequestError(null)
                  setReloadKey((key) => key + 1)
                }}
                disabled={isLoading}
                aria-busy={isLoading}
                className="min-h-10 rounded-lg border border-white/10 px-3 text-xs font-medium text-violet-100/65 hover:bg-white/[0.04] disabled:opacity-50"
              >
                {isLoading ? 'Atualizando...' : 'Atualizar lista'}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Filtrar participantes">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              Todos ({displayedRegistrations.length})
            </FilterButton>
            <FilterButton
              active={filter === 'pending'}
              onClick={() => setFilter('pending')}
            >
              Pendentes ({pendingCount})
            </FilterButton>
            <FilterButton
              active={filter === 'checked-in'}
              onClick={() => setFilter('checked-in')}
            >
              Check-in feito ({checkedInCount})
            </FilterButton>
          </div>
        </div>

        {isLoading ? (
          <div className="grid place-items-center px-5 py-12">
            <LoadingIndicator label="Carregando participantes..." />
          </div>
        ) : visibleRegistrations.length > 0 ? (
          <ul className="divide-y divide-white/[0.06]">
            {visibleRegistrations.map((registration) => (
              <li
                key={registration.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-white">
                    {registration.participant_name}
                    <span className="ml-2 font-normal text-violet-100/40">
                      {registration.participant_age} anos
                    </span>
                  </p>
                  <div className="mt-1 flex flex-col gap-x-4 gap-y-1 text-xs text-violet-100/45 sm:flex-row sm:flex-wrap">
                    {registration.participant_email ? (
                      <span className="break-all">
                        {registration.participant_email}
                      </span>
                    ) : null}
                    {registration.participant_phone ? (
                      <span>{registration.participant_phone}</span>
                    ) : null}
                    <span>
                      Inscrição em {dateFormatter.format(new Date(registration.created_at))}
                    </span>
                  </div>
                </div>
                {registration.checked_in_at ? (
                  <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-2.5 py-1 text-xs font-medium text-emerald-200">
                    Check-in às{' '}
                    {dateFormatter.format(new Date(registration.checked_in_at))}
                  </span>
                ) : (
                  <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-amber-300/15 bg-amber-300/[0.06] px-2.5 py-1 text-xs font-medium text-amber-100/75">
                    Aguardando entrada
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-violet-100/75">
              {errorMessage
                ? 'A lista não pôde ser carregada. Verifique a mensagem acima e tente novamente.'
                : displayedRegistrations.length === 0
                ? 'Ainda não há inscritos neste evento.'
                : 'Nenhum participante corresponde a esse filtro.'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24 rounded-xl border border-white/[0.08] bg-black/15 px-3 py-2">
      <p className="text-[11px] text-violet-100/45">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-9 rounded-lg border px-3 text-xs font-medium transition ${
        active
          ? 'border-violet-300/25 bg-violet-400/[0.1] text-violet-100'
          : 'border-white/[0.08] text-violet-100/50 hover:bg-white/[0.04]'
      }`}
    >
      {children}
    </button>
  )
}
