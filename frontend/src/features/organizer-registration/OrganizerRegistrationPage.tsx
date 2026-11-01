import { useState } from 'react'
import { OrganizerLoginForm } from '../organizer-auth/components/OrganizerLoginForm'
import type { Organizer } from '../../shared/api/organizers'
import { BrandMark } from '../../shared/components/BrandMark'
import { OrganizerRegistrationForm } from './components/OrganizerRegistrationForm'

interface OrganizerRegistrationPageProps {
  initialErrorMessage?: string
  onAuthenticated: (organizer: Organizer, accessToken: string) => void
  onBackToBrowse: () => void
}

export function OrganizerRegistrationPage({
  initialErrorMessage = '',
  onAuthenticated,
  onBackToBrowse,
}: OrganizerRegistrationPageProps) {
  const [mode, setMode] = useState<'register' | 'login'>(
    initialErrorMessage ? 'login' : 'register',
  )

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#0c0815] text-violet-50">
      <div
        className="pointer-events-none absolute -left-36 -top-32 size-[28rem] rounded-full bg-violet-700/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-48 -right-36 size-[32rem] rounded-full bg-purple-950/40 blur-[130px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-5 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#130e1d]/90 shadow-[0_40px_140px_-50px_rgba(0,0,0,0.95)] backdrop-blur-xl lg:min-h-[760px] lg:grid-cols-[0.88fr_1.12fr]">
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#291644] via-[#1d1230] to-[#130e1d] p-10 lg:flex xl:p-14">
            <div
              className="pointer-events-none absolute -right-24 top-28 size-80 rounded-full border border-violet-200/[0.08]"
              aria-hidden="true"
            >
              <div className="absolute inset-8 rounded-full border border-violet-200/[0.08]" />
              <div className="absolute inset-16 rounded-full border border-violet-200/[0.08]" />
            </div>
            <div
              className="pointer-events-none absolute -bottom-20 -left-24 size-72 rounded-full bg-purple-500/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <BrandMark />
              <div className="mt-28 max-w-md">
                <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight text-white xl:text-5xl">
                  Gerencie os eventos{' '}
                  <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                    da sua organização.
                  </span>
                </h1>
                <p className="mt-5 max-w-sm text-base leading-relaxed text-violet-100/60">
                  Crie a conta da sua organização e tenha um espaço simples para
                  cuidar dos seus eventos e participantes.
                </p>
              </div>
            </div>
            <div className="relative flex items-center gap-3 text-sm text-violet-100/45">
              <span className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-violet-200">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="size-4"
                >
                  <path
                    d="M12 3l7 3v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Seus dados protegidos em cada etapa
            </div>
          </aside>

          <section className="px-5 py-7 sm:px-10 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
            <button
              type="button"
              onClick={onBackToBrowse}
              className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-violet-100/55 transition hover:text-violet-100 focus-visible:outline-2 focus-visible:outline-violet-300"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="size-4"
              >
                <path
                  d="M19 12H5m6 6l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Ver eventos
            </button>
            <div className="mb-8 lg:hidden">
              <BrandMark />
            </div>

            <header className="mb-7 sm:mb-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                {mode === 'register'
                  ? 'Cadastro de organização'
                  : 'Acesso de organização'}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[30px]">
                {mode === 'register'
                  ? 'Crie sua organização'
                  : 'Entre na sua conta'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-violet-100/50">
                {mode === 'register'
                  ? 'Preencha os dados para começar a organizar seus eventos.'
                  : 'Acesse o painel para gerenciar seus eventos.'}
              </p>
            </header>

            {initialErrorMessage ? (
              <p
                className="mb-5 rounded-xl border border-amber-300/20 bg-amber-400/[0.08] px-4 py-3 text-sm leading-relaxed text-amber-100/85"
                role="status"
              >
                {initialErrorMessage}
              </p>
            ) : null}

            {mode === 'register' ? (
              <OrganizerRegistrationForm onRegistered={onAuthenticated} />
            ) : (
              <OrganizerLoginForm onAuthenticated={onAuthenticated} />
            )}

            <p className="mt-6 text-center text-sm text-violet-100/50">
              {mode === 'register'
                ? 'Já tem uma conta?'
                : 'Ainda não tem uma organização?'}{' '}
              <button
                type="button"
                onClick={() =>
                  setMode((currentMode) =>
                    currentMode === 'register' ? 'login' : 'register',
                  )
                }
                className="font-semibold text-violet-300 underline decoration-violet-300/40 underline-offset-4 transition hover:text-violet-200"
              >
                {mode === 'register' ? 'Entrar' : 'Criar conta'}
              </button>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
