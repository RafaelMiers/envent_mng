import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/client'
import { createEvent, type CreateEventInput } from '../../../shared/api/events'
import { FormField, inputClasses } from '../../organizer-registration/components/FormField'

interface EventCreateFormProps {
  accessToken: string
  onCreated: () => void
  onCancel: () => void
  onUnauthorized: () => void
}

const timeInputClasses = `${inputClasses} [color-scheme:dark]`

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4)

  return `${day}${month ? `/${month}` : ''}${year ? `/${year}` : ''}`
}

function parseLocalDateTime(date: string, time: string): Date | null {
  const dateMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date)
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time)
  if (!dateMatch || !timeMatch) {
    return null
  }

  const [, dayValue, monthValue, yearValue] = dateMatch
  const [, hourValue, minuteValue] = timeMatch
  const day = Number(dayValue)
  const month = Number(monthValue)
  const year = Number(yearValue)
  const hour = Number(hourValue)
  const minute = Number(minuteValue)
  const parsedDate = new Date(year, month - 1, day, hour, minute)

  if (
    year < 1000 ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return null
  }

  return parsedDate
}

export function EventCreateForm({
  accessToken,
  onCreated,
  onCancel,
  onUnauthorized,
}: EventCreateFormProps) {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startsDate, setStartsDate] = useState('')
  const [startsTime, setStartsTime] = useState('')
  const [endsDate, setEndsDate] = useState('')
  const [endsTime, setEndsTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    const startDate = parseLocalDateTime(startsDate, startsTime)
    const endDate = parseLocalDateTime(endsDate, endsTime)
    if (!startDate || !endDate) {
      setErrorMessage('Informe datas no formato dd/mm/aaaa e horários válidos.')
      return
    }

    if (startDate >= endDate) {
      setErrorMessage('O término precisa ser depois do início do evento.')
      return
    }

    const input: CreateEventInput = {
      title: title.trim(),
      location: location.trim(),
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
    }

    setIsSubmitting(true)
    try {
      await createEvent(input, accessToken)
      onCreated()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized()
      } else if (error instanceof ApiError) {
        setErrorMessage(error.message)
      } else if (error instanceof TypeError) {
        setErrorMessage(
          'Não foi possível conectar à API. Verifique sua conexão e tente novamente.',
        )
      } else {
        setErrorMessage('Não foi possível criar o evento. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-violet-300/15 bg-[#171021] p-5 sm:p-6"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="text-lg font-semibold text-white">Novo evento</p>
        <p className="mt-1 text-sm text-violet-100/50">
          Defina as informações principais do evento.
        </p>
      </div>

      <FormField id="event-title" label="Nome do evento" required>
        <input
          id="event-title"
          name="title"
          className={inputClasses}
          placeholder="Ex.: Encontro de tecnologia"
          maxLength={150}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </FormField>

      <FormField id="event-location" label="Local" required>
        <input
          id="event-location"
          name="location"
          className={inputClasses}
          placeholder="Endereço ou espaço do evento"
          maxLength={250}
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          required
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-4">
          <FormField id="event-starts-date" label="Data de início" required>
            <input
              id="event-starts-date"
              name="starts_date"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="dd/mm/aaaa"
              maxLength={10}
              className={inputClasses}
              value={startsDate}
              onChange={(event) =>
                setStartsDate(formatDateInput(event.target.value))
              }
              required
            />
          </FormField>
          <FormField id="event-starts-time" label="Horário de início" required>
            <input
              id="event-starts-time"
              name="starts_time"
              type="time"
              className={timeInputClasses}
              value={startsTime}
              onChange={(event) => setStartsTime(event.target.value)}
              required
            />
          </FormField>
        </div>
        <div className="space-y-4">
          <FormField id="event-ends-date" label="Data de término" required>
            <input
              id="event-ends-date"
              name="ends_date"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="dd/mm/aaaa"
              maxLength={10}
              className={inputClasses}
              value={endsDate}
              onChange={(event) =>
                setEndsDate(formatDateInput(event.target.value))
              }
              required
            />
          </FormField>
          <FormField id="event-ends-time" label="Horário de término" required>
            <input
              id="event-ends-time"
              name="ends_time"
              type="time"
              className={timeInputClasses}
              value={endsTime}
              onChange={(event) => setEndsTime(event.target.value)}
              required
            />
          </FormField>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-violet-100/45">
        Use o formato dd/mm/aaaa. Os horários são informados no fuso local do
        seu dispositivo.
      </p>

      {errorMessage ? (
        <p
          className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm leading-relaxed text-rose-200"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-12 rounded-xl border border-white/10 px-5 text-sm font-semibold text-violet-100/75 transition hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="min-h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300 disabled:cursor-wait disabled:opacity-65"
        >
          {isSubmitting ? (
            <>
              <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-white/35 border-t-white align-[-3px]" />
              Salvando evento...
            </>
          ) : (
            'Criar evento'
          )}
        </button>
      </div>
    </form>
  )
}
