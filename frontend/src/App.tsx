import { useCallback, useEffect, useState } from 'react'
import {
  getCurrentOrganizer,
  type Organizer,
} from './shared/api/organizers'
import { OrganizerDashboardPage } from './features/organizer-dashboard/OrganizerDashboardPage'
import { OrganizerRegistrationPage } from './features/organizer-registration/OrganizerRegistrationPage'
import { EventBrowsePage } from './features/event-browse/EventBrowsePage'
import { BrandMark } from './shared/components/BrandMark'

const ACCESS_TOKEN_STORAGE_KEY = 'eventcheck-access-token'

interface OrganizerSession {
  organizer: Organizer
  accessToken: string
}

function App() {
  const [session, setSession] = useState<OrganizerSession | null>(null)
  const [currentPage, setCurrentPage] = useState<'browse' | 'organizer'>('browse')
  const [isCheckingSession, setIsCheckingSession] = useState(() =>
    Boolean(sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)),
  )
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    let isActive = true
    const storedAccessToken = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)

    if (!storedAccessToken) {
      return () => {
        isActive = false
      }
    }

    getCurrentOrganizer(storedAccessToken)
      .then((organizer) => {
        if (isActive) {
          setSession({ organizer, accessToken: storedAccessToken })
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return
        }

        sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
        setCurrentPage('organizer')
        setSessionError(
          error instanceof Error
            ? error.message
            : 'Não foi possível validar sua sessão. Entre novamente.',
        )
      })
      .finally(() => {
        if (isActive) {
          setIsCheckingSession(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const handleAuthenticated = useCallback(
    (organizer: Organizer, accessToken: string) => {
      sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken)
      setSessionError('')
      setSession({ organizer, accessToken })
    },
    [],
  )

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
    setSession(null)
    setSessionError('')
    setCurrentPage('browse')
  }, [])

  if (isCheckingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0c0815] px-5 text-violet-50">
        <div className="flex flex-col items-center gap-5">
          <BrandMark />
          <p className="flex items-center gap-3 text-sm text-violet-100/55">
            <span className="size-5 animate-spin rounded-full border-2 border-violet-200/20 border-t-violet-300" />
            Verificando sua sessão...
          </p>
        </div>
      </main>
    )
  }

  if (session) {
    return (
      <OrganizerDashboardPage
        organizer={session.organizer}
        accessToken={session.accessToken}
        onLogout={handleLogout}
      />
    )
  }

  if (currentPage === 'organizer') {
    return (
      <OrganizerRegistrationPage
        initialErrorMessage={sessionError}
        onAuthenticated={handleAuthenticated}
        onBackToBrowse={() => setCurrentPage('browse')}
      />
    )
  }

  return <EventBrowsePage onOrganizerClick={() => setCurrentPage('organizer')} />
}

export default App
