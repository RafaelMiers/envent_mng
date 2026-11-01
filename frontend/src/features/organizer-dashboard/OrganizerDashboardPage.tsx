import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../shared/api/client'
import {
  deleteEvent,
  listEvents,
  type Event,
} from '../../shared/api/events'
import type { Organizer } from '../../shared/api/organizers'
import { BrandMark } from '../../shared/components/BrandMark'
import { LoadingIndicator } from '../../shared/components/LoadingIndicator'
import { EventCard } from './components/EventCard'
import { EventCreateForm } from './components/EventCreateForm'
import { ParticipantsPanel } from './components/ParticipantsPanel'

interface OrganizerDashboardPageProps {
  organizer: Organizer
  accessToken: string
  onLogout: () => void
}

export function OrganizerDashboardPage({
  organizer,
  accessToken,
  onLogout,
}: OrganizerDashboardPageProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [activeSection, setActiveSection] = useState<'events' | 'participants'>(
    'events',
  )

  useEffect(() => {
    let isActive = true

    listEvents(accessToken)
      .then((loadedEvents) => {
        if (isActive) {
          setEvents(loadedEvents)
          setErrorMessage('')
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return
        }

        if (error instanceof ApiError && error.status === 401) {
          onLogout()
        } else if (error instanceof TypeError) {
          setErrorMessage(
            'Não foi possível conectar à API. Verifique sua conexão e tente novamente.',
          )
        } else if (error instanceof Error) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('Não foi possível carregar os eventos.')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [accessToken, onLogout, reloadKey])

  const reloadEvents = useCallback(() => {
    setIsLoading(true)
    setErrorMessage('')
    setReloadKey((key) => key + 1)
  }, [])

  async function handleDeleteEvent(event: Event) {
    setDeletingEventId(event.id)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await deleteEvent(event.id, accessToken)
      setEvents((currentEvents) =>
        currentEvents.filter((currentEvent) => currentEvent.id !== event.id),
      )
      setSuccessMessage(`O evento "${event.title}" foi excluído.`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onLogout()
      } else if (error instanceof TypeError) {
        setErrorMessage(
          'Não foi possível conectar à API. Verifique sua conexão e tente novamente.',
        )
      } else if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Não foi possível excluir o evento.')
      }
    } finally {
      setDeletingEventId(null)
    }
  }

  function handleCreated() {
    setIsCreateFormOpen(false)
    setSuccessMessage('Evento criado com sucesso.')
    reloadEvents()
  }

  return (
    <main className="min-h-screen bg-[#100d16] text-violet-50 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="border-b border-white/[0.08] bg-[#0c0912] px-4 py-4 sm:px-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:min-h-0 lg:flex-col lg:border-b-0 lg:border-r lg:border-white/[0.08] lg:px-5 lg:py-7">
        <div className="flex items-center justify-between gap-4 lg:block">
          <div>
            <BrandMark />
            <p className="mt-1 hidden pl-[52px] text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-100/40 lg:block">
              Área da organização
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-10 rounded-lg border border-white/10 px-3 text-xs font-medium text-violet-100/60 transition hover:border-violet-300/30 hover:bg-white/[0.04] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 lg:hidden"
          >
            Sair
          </button>
        </div>

        <nav className="mt-5 flex gap-2 overflow-x-auto lg:mt-10 lg:flex-col">
          <button
            type="button"
            aria-current={activeSection === 'events' ? 'page' : undefined}
            onClick={() => setActiveSection('events')}
            className={`flex min-h-10 shrink-0 items-center gap-3 rounded-lg border px-3 text-sm font-medium transition lg:min-h-11 ${
              activeSection === 'events'
                ? 'border-violet-300/15 bg-violet-400/[0.09] text-violet-100'
                : 'border-transparent text-violet-100/45 hover:bg-white/[0.04] hover:text-violet-100/80'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="size-4 shrink-0 text-violet-300"
            >
              <rect
                x="3.5"
                y="5"
                width="17"
                height="16"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M7.5 3v4m9-4v4M3.5 10h17"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            Meus eventos
          </button>
          <button
            type="button"
            aria-current={activeSection === 'participants' ? 'page' : undefined}
            onClick={() => setActiveSection('participants')}
            className={`flex min-h-10 shrink-0 items-center gap-3 rounded-lg border px-3 text-sm transition lg:min-h-11 ${
              activeSection === 'participants'
                ? 'border-violet-300/15 bg-violet-400/[0.09] font-medium text-violet-100'
                : 'border-transparent text-violet-100/45 hover:bg-white/[0.04] hover:text-violet-100/80'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="size-4 shrink-0"
            >
              <path
                d="M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20m16 0v-1.5a3.5 3.5 0 00-2.5-3.35M10 11a4 4 0 100-8 4 4 0 000 8zm7-7.5a4 4 0 010 7.75"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            Participantes
          </button>
        </nav>

        <div className="mt-6 hidden border-t border-white/[0.08] pt-5 lg:mt-auto lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-100/35">
            Organização
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-xs font-semibold text-violet-200">
              {organizer.organization_name.slice(0, 2).toLocaleUpperCase('pt-BR')}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-violet-100/85">
                {organizer.organization_name}
              </span>
              <span className="mt-0.5 block text-xs text-violet-100/35">
                Conta conectada
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-5 min-h-10 w-full rounded-lg border border-white/10 px-3 text-left text-xs font-medium text-violet-100/55 transition hover:border-violet-300/25 hover:bg-white/[0.04] hover:text-white focus-visible:outline-2 focus-visible:outline-violet-300"
          >
            Sair da conta
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mx-auto min-h-screen max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
          <header className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <p className="text-xs font-medium text-violet-100/40">
                Área da organização
              </p>
              <p className="mt-1 text-sm font-semibold text-violet-100/80">
                {activeSection === 'events'
                  ? 'Gerenciamento de eventos'
                  : 'Participantes e check-in'}
              </p>
            </div>
            <span className="hidden rounded-full border border-white/[0.08] px-3 py-1.5 text-xs text-violet-100/45 sm:inline-flex">
              {organizer.organization_name}
            </span>
          </header>

        <section className="py-9 sm:py-12">
          <p className="text-sm font-medium text-violet-300">
            {activeSection === 'events' ? 'Painel da organização' : 'Acesso do evento'}
          </p>
          <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {activeSection === 'events'
                  ? `Olá, ${organizer.organization_name}`
                  : 'Participantes e check-in'}
              </h1>
              <p className="mt-2 text-sm text-violet-100/50 sm:text-base">
                {activeSection === 'events'
                  ? 'Crie seus eventos e acompanhe tudo em um só lugar.'
                  : 'Consulte os inscritos e confirme a entrada lendo o QR code do ingresso.'}
              </p>
            </div>
            {activeSection === 'events' && !isCreateFormOpen ? (
              <button
                type="button"
                onClick={() => {
                  setIsCreateFormOpen(true)
                  setErrorMessage('')
                  setSuccessMessage('')
                }}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 text-sm font-semibold text-white shadow-[0_12px_35px_-12px_rgba(139,92,246,0.65)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="size-5"
                >
                  <path
                    d="M12 5v14m-7-7h14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                Criar evento
              </button>
            ) : null}
          </div>
        </section>

        {activeSection === 'events' && isCreateFormOpen ? (
          <div className="mb-8">
            <EventCreateForm
              accessToken={accessToken}
              onCreated={handleCreated}
              onCancel={() => setIsCreateFormOpen(false)}
              onUnauthorized={onLogout}
            />
          </div>
        ) : null}

        {activeSection === 'events' && errorMessage ? (
          <div
            className="mb-5 flex flex-col gap-3 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-4 text-sm leading-relaxed text-rose-200 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p>{errorMessage}</p>
            <button
              type="button"
              onClick={reloadEvents}
              disabled={isLoading}
              aria-busy={isLoading}
              className="min-h-10 shrink-0 rounded-lg border border-rose-200/20 px-3 font-semibold hover:bg-rose-300/10"
            >
              {isLoading ? (
                <>
                  <span className="mr-2 inline-block size-3 animate-spin rounded-full border-2 border-rose-100/30 border-t-rose-100 align-[-2px]" />
                  Carregando...
                </>
              ) : (
                'Tentar novamente'
              )}
            </button>
          </div>
        ) : null}

        {activeSection === 'events' && successMessage ? (
          <p
            className="mb-5 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.07] px-4 py-3 text-sm text-emerald-200"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}

        {activeSection === 'participants' ? (
          <ParticipantsPanel
            events={events}
            accessToken={accessToken}
            onUnauthorized={onLogout}
          />
        ) : (
        <section aria-labelledby="events-heading">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2
                id="events-heading"
                className="text-xl font-semibold text-white sm:text-2xl"
              >
                Seus eventos
              </h2>
              <p className="mt-1 text-sm text-violet-100/45">
                {isLoading
                  ? 'Carregando eventos...'
                  : `${events.length} ${events.length === 1 ? 'evento cadastrado' : 'eventos cadastrados'}`}
              </p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-violet-300/15 bg-violet-400/[0.07] text-sm font-semibold text-violet-200">
              {events.length}
            </span>
          </div>

          {isLoading ? (
            <div className="grid place-items-center rounded-2xl border border-white/[0.08] bg-[#130e1d]/70 px-5 py-14">
              <LoadingIndicator label="Carregando seus eventos..." />
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isDeleting={deletingEventId === event.id}
                  isBusy={deletingEventId !== null}
                  onDelete={() => void handleDeleteEvent(event)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-violet-200/15 bg-[#130e1d]/60 px-5 py-12 text-center sm:py-16">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-violet-300/15 bg-violet-400/[0.07] text-violet-200">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="size-7"
                >
                  <rect
                    x="4"
                    y="6"
                    width="16"
                    height="15"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 3v5m8-5v5M4 10h16m-8 3v5m-2.5-2.5h5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                Nenhum evento por aqui
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-violet-100/50">
                Crie seu primeiro evento para começar a organizar as
                informações e receber participantes.
              </p>
              {!isCreateFormOpen ? (
                <button
                  type="button"
                  onClick={() => setIsCreateFormOpen(true)}
                  className="mt-5 min-h-11 rounded-xl border border-violet-300/20 px-4 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/10"
                >
                  Criar meu primeiro evento
                </button>
              ) : null}
            </div>
          )}
        </section>
        )}
        </div>
      </div>
    </main>
  )
}
