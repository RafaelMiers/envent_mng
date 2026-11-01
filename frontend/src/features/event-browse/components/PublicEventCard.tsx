import type { Event } from '../../../shared/api/events'

interface PublicEventCardProps {
  event: Event
  currentTime: number
  onRegister: (event: Event) => void
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'full',
  timeStyle: 'short',
})

export function PublicEventCard({
  event,
  currentTime,
  onRegister,
}: PublicEventCardProps) {
  const startsAt = new Date(event.starts_at)
  const endsAt = new Date(event.ends_at)
  const canRegister = startsAt.getTime() > currentTime

  return (
    <article className="group flex flex-col rounded-2xl border border-white/[0.08] bg-[#151020]/90 p-5 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-[#191224] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-500/20 to-purple-900/20 text-violet-200">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="size-6"
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
              d="M7.5 3v4m9-4v4M3.5 10h17m-12 4h3m-3 3h7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            canRegister
              ? 'border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-200/85'
              : 'border-amber-300/15 bg-amber-300/[0.06] text-amber-100/80'
          }`}
        >
          {canRegister ? 'Inscrições abertas' : 'Em andamento'}
        </span>
      </div>

      <h2 className="break-words text-xl font-semibold leading-snug text-white sm:text-[22px]">
        {event.title}
      </h2>
      <div className="mt-4 space-y-3 text-sm text-violet-100/60">
        <p className="flex items-start gap-2.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-violet-300/75"
          >
            <path
              d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1114 0z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.7" />
          </svg>
          <span>{event.location}</span>
        </p>
        <p className="flex items-start gap-2.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-violet-300/75"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M12 7v5l3 2"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          <span>
            <time dateTime={event.starts_at}>{dateFormatter.format(startsAt)}</time>
            <span className="mt-1 block text-xs text-violet-100/40">
              Até {new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(endsAt)}
            </span>
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => onRegister(event)}
        disabled={!canRegister}
        className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 text-sm font-semibold text-white shadow-[0_10px_30px_-14px_rgba(139,92,246,0.8)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300 disabled:cursor-not-allowed disabled:from-white/10 disabled:to-white/10 disabled:text-violet-100/45 disabled:shadow-none"
      >
        {canRegister ? (
          <>
            Quero me inscrever
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="size-4 transition group-hover:translate-x-0.5"
            >
              <path
                d="M5 12h14m-6-6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        ) : (
          'Inscrições encerradas'
        )}
      </button>
    </article>
  )
}
