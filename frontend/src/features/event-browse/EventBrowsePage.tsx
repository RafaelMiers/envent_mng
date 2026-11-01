import { useEffect, useState } from 'react'
import { ApiError } from '../../shared/api/client'
import { listPublicEvents, type Event } from '../../shared/api/events'
import { BrandMark } from '../../shared/components/BrandMark'
import { EventRegistrationDialog } from './components/EventRegistrationDialog'
import { PublicEventCard } from './components/PublicEventCard'

interface EventBrowsePageProps {
  onOrganizerClick: () => void
}

export function EventBrowsePage({ onOrganizerClick }: EventBrowsePageProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isActive = true

    listPublicEvents()
      .then((loadedEvents) => {
        if (isActive) {
          setEvents(loadedEvents)
          setCurrentTime(Date.now())
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return
        }
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : error instanceof TypeError
              ? 'Não foi possível conectar à API. Verifique sua conexão e tente novamente.'
              : 'Não foi possível carregar os eventos.',
        )
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [reloadKey])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const filteredEvents = events.filter((event) =>
    `${event.title} ${event.location}`
      .toLocaleLowerCase('pt-BR')
      .includes(normalizedSearch),
  )

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#0c0815] text-violet-50">
      <div
        className="pointer-events-none absolute -left-40 -top-56 size-[34rem] rounded-full bg-violet-700/15 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-52 top-[28rem] size-[34rem] rounded-full bg-purple-950/35 blur-[140px]"
        aria-hidden="true"
      />

      <header className="relative border-b border-white/[0.06] bg-[#0c0815]/70">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-sm text-violet-100/50 sm:inline">
              Quer criar um evento?
            </span>
            <button
              type="button"
              onClick={onOrganizerClick}
              className="min-h-10 rounded-xl border border-violet-300/20 bg-violet-400/[0.07] px-3 text-xs font-semibold text-violet-100 transition hover:border-violet-300/40 hover:bg-violet-400/[0.12] sm:px-4 sm:text-sm"
            >
              Criar conta / Entrar
            </button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-400/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">
            <span className="size-1.5 rounded-full bg-violet-300" />
            Eventos disponíveis
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Eventos disponíveis
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-violet-100/55 sm:text-lg">
            Consulte datas e locais e faça sua inscrição. O ingresso com QR code
            fica disponível após a confirmação do e-mail.
          </p>
        </div>

        <div className="mt-9 flex flex-col gap-4 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300/80">
              Lista pública
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Próximos e em andamento
            </h2>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Buscar evento ou local</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-violet-100/40"
            >
              <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M16 16l4.5 4.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              placeholder="Buscar evento ou local"
              className="min-h-12 w-full rounded-xl border border-white/10 bg-[#130e1d]/80 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-violet-100/35 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-rose-300/15 bg-rose-400/[0.06] p-5 sm:p-6">
            <p className="text-sm leading-relaxed text-rose-100/85" role="alert">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true)
                setErrorMessage('')
                setReloadKey((key) => key + 1)
              }}
              className="mt-4 min-h-10 rounded-lg border border-rose-200/20 px-4 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/10"
            >
              Tentar novamente
            </button>
          </div>
        ) : isLoading ? (
          <div
            className="mt-7 flex min-h-52 flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.07] bg-[#130e1d]/60"
            role="status"
          >
            <span className="size-7 animate-spin rounded-full border-2 border-violet-200/20 border-t-violet-300" />
            <p className="text-sm text-violet-100/55">Buscando eventos...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <PublicEventCard
                key={event.id}
                event={event}
                currentTime={currentTime}
                onRegister={setSelectedEvent}
              />
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-white/[0.07] bg-[#130e1d]/60 px-5 py-12 text-center sm:px-8">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-violet-300/15 bg-violet-400/[0.06] text-violet-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="size-6"
              >
                <path
                  d="M7 3v4m10-4v4M4 9h16m-14-5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              {search
                ? 'Nenhum evento encontrado'
                : 'Ainda não há eventos disponíveis'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-violet-100/50">
              {search
                ? 'Tente buscar por outro nome ou local.'
                : 'Novos eventos aparecerão aqui. Volte em breve para descobrir o que vem por aí.'}
            </p>
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-5 text-sm font-semibold text-violet-300 underline decoration-violet-300/40 underline-offset-4 hover:text-violet-200"
              >
                Limpar busca
              </button>
            ) : null}
          </div>
        )}
      </section>

      {selectedEvent ? (
        <EventRegistrationDialog
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      ) : null}
    </main>
  )
}
