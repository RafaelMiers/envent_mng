export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-purple-700 shadow-lg shadow-violet-950/50">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="size-6 text-white"
        >
          <path
            d="M7 3.8h7l4 4v12.4H7a2 2 0 01-2-2V5.8a2 2 0 012-2z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M14 4v4h4m-8 4h4m-4 4h4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-lg font-semibold tracking-tight text-white">
        Event<span className="text-violet-300">Check</span>
      </span>
    </div>
  )
}
