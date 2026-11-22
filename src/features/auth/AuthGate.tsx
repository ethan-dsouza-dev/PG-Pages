import type { ReactNode } from 'react'
import { flags } from '../../config/flags'
import { useAuthStore, type AuthStore } from './authStore'
import { SignInPage } from './SignInPage'

type AuthGateProps = {
  children: ReactNode
  /** Defaults to the VITE_AUTH_ENABLED flag. */
  enabled?: boolean
  useStore?: AuthStore
}

const MOCK_NOTICE = (
  <>
    Test sign-in: no real Google account is contacted. Add{' '}
    <code className="whitespace-nowrap">?mockAuth=fail</code> to the URL to test a failed sign-in.
  </>
)

/** Renders the page when sign-in is off or the user is signed in; otherwise the sign-in page. */
export function AuthGate({ children, enabled = flags.authEnabled, useStore = useAuthStore }: AuthGateProps) {
  const status = useStore((s) => s.status)

  if (!enabled || status === 'signed-in') return children
  return <SignInPage useStore={useStore} notice={MOCK_NOTICE} />
}
