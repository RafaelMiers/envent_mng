import { useState } from 'react'
import type { Event } from '../../../shared/api/events'

interface EventCardProps {
  event: Event
  isDeleting: boolean
  isBusy: boolean
  onDelete: () => void
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatEventDate(value: string): string {
  return dateFormatter.format(new Date(value))
}

export function EventCard({
  event,
  isDeleting,
  isBusy,
  onDelete,
}: EventCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#130e1d]/85 p-5 shadow-lg shadow-black/10 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-400/[0.08] px-3 py-1 text-xs font-medium text-violet-200">
            <span className="size-1.5 rounded-full bg-violet-300" />
            Evento
          </div>
          <h3 className="break-words text-lg font-semibold text-white">
            {event.title}
          </h3>
          <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-violet-100/55">
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
          <div className="mt-4 flex flex-col gap-2 text-sm text-violet-100/70 sm:flex-row sm:flex-wrap sm:gap-x-5">
            <p className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="size-4 shrink-0 text-violet-300/75"
              >
                <rect
                  x="4"
                  y="6"
                  width="16"
                  height="15"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M8 3v5m8-5v5M4 10h16"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
              <time dateTime={event.starts_at}>
                {formatEventDate(event.starts_at)}
              </time>
            </p>
            <p className="flex items-center gap-2 sm:pl-6">
              <span className="text-xs text-violet-100/40">até</span>
              <time dateTime={event.ends_at}>
                {formatEventDate(event.ends_at)}
              </time>
            </p>
          </div>
        </div>

        {isConfirmingDelete ? (
          <div className="shrink-0 rounded-xl border border-rose-300/15 bg-rose-400/[0.06] p-3 sm:max-w-52">
            <p className="text-sm font-medium text-rose-100">
              Excluir este evento?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-rose-100/55">
              Essa ação não pode ser desfeita.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isBusy}
                className="min-h-10 flex-1 rounded-lg border border-white/10 px-3 text-xs font-semibold text-violet-100/75 hover:bg-white/[0.04] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isBusy}
                aria-busy={isDeleting}
                className="min-h-10 flex-1 rounded-lg bg-rose-500/90 px-3 text-xs font-semibold text-white hover:bg-rose-400 disabled:cursor-wait disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <span className="mr-1.5 inline-block size-3 animate-spin rounded-full border-2 border-white/35 border-t-white align-[-2px]" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            disabled={isBusy}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-300/15 px-4 text-sm font-medium text-rose-200/80 transition hover:border-rose-300/30 hover:bg-rose-400/[0.07] hover:text-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
            aria-label={`Excluir evento ${event.title}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="size-4"
            >
              <path
                d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Excluir
          </button>
        )}
      </div>
    </article>
  )
}
