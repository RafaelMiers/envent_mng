interface LoadingIndicatorProps {
  label: string
  fullScreen?: boolean
}

export function LoadingIndicator({
  label,
  fullScreen = false,
}: LoadingIndicatorProps) {
  const content = (
    <div
      className="flex items-center gap-3 text-sm text-violet-100/70"
      role="status"
      aria-live="polite"
    >
      <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-violet-200/20 border-t-violet-300" />
      <span>{label}</span>
    </div>
  )

  if (!fullScreen) {
    return content
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#0c0815]/90 px-5 backdrop-blur-md"
      aria-busy="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-violet-200/10 bg-[#171021] p-6 shadow-2xl shadow-black/40 sm:p-8">
        <div className="mb-5 grid size-12 place-items-center rounded-xl bg-violet-400/10">
          <span className="size-6 animate-spin rounded-full border-2 border-violet-200/20 border-t-violet-300" />
        </div>
        <p className="text-base font-semibold text-white">{label}</p>
        <p className="mt-2 text-sm leading-relaxed text-violet-100/50">
          Isso pode levar alguns instantes. Mantenha esta tela aberta.
        </p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-1/3 animate-[loading-progress_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" />
        </div>
      </div>
    </div>
  )
}
