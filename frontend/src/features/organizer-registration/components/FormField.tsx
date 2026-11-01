import type { ReactNode } from 'react'

interface FormFieldProps {
  id: string
  label: ReactNode
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}

export const inputClasses =
  'min-h-12 w-full rounded-xl border border-white/10 bg-[#100b18] px-4 text-[15px] text-white outline-none transition placeholder:text-violet-100/30 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/15'

export function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  children,
}: FormFieldProps) {
  const descriptionId = `${id}-description`

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-violet-50/90"
      >
        {label}
        {required ? (
          <>
            <span className="ml-1 text-violet-300" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (obrigatório)</span>
          </>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={descriptionId} className="text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={descriptionId} className="text-xs leading-relaxed text-violet-100/45">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
