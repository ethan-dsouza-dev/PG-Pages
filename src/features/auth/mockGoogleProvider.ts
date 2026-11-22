import type { AuthProvider, AuthUser } from './types'

// PLACEHOLDER(auth): stands in for Supabase Google OAuth until a project is set up.
// No network calls and no real Google account: it only simulates the flow.

export const MOCK_SESSION_KEY = 'pg-page.mock-session'

export const MOCK_USER: AuthUser = {
  id: 'mock-user-1',
  name: 'Test User',
  email: 'test.user@example.com',
}

type MockOptions = {
  /** How long the fake Google round trip takes. */
  delayMs?: number
  /** When true, sign-in rejects, so the error state can be tested. */
  shouldFail?: () => boolean
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null
}

function safeStorage(): MockOptions['storage'] {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Dev helper: add `?mockAuth=fail` to the URL to make sign-in fail. */
function failRequestedInUrl(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('mockAuth') === 'fail'
  } catch {
    return false
  }
}

export function createMockGoogleProvider({
  delayMs = 800,
  shouldFail = failRequestedInUrl,
  storage = safeStorage(),
}: MockOptions = {}): AuthProvider {
  const read = () => {
    try {
      const raw = storage?.getItem(MOCK_SESSION_KEY)
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
      return null
    }
  }
  const write = (user: AuthUser | null) => {
    try {
      if (user) storage?.setItem(MOCK_SESSION_KEY, JSON.stringify(user))
      else storage?.removeItem(MOCK_SESSION_KEY)
    } catch {
      // Storage blocked (private window etc.): the session just won't survive a reload.
    }
  }

  return {
    restoreSession: read,
    signInWithGoogle: () =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          if (shouldFail()) {
            reject(new Error("Couldn't sign in with Google. Please try again."))
            return
          }
          write(MOCK_USER)
          resolve(MOCK_USER)
        }, delayMs)
      }),
    signOut: async () => {
      write(null)
    },
  }
}
