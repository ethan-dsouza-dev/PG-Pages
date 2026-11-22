import { create } from 'zustand'
import { createMockGoogleProvider } from './mockGoogleProvider'
import type { AuthProvider, AuthUser } from './types'

export type AuthStatus = 'signed-out' | 'signing-in' | 'signed-in'

type AuthState = {
  status: AuthStatus
  user: AuthUser | null
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

/** Builds an auth store around a provider. Tests pass their own provider. */
export function createAuthStore(provider: AuthProvider) {
  const restored = provider.restoreSession()

  return create<AuthState>()((set, get) => ({
    status: restored ? 'signed-in' : 'signed-out',
    user: restored,
    error: null,
    signInWithGoogle: async () => {
      if (get().status === 'signing-in') return
      set({ status: 'signing-in', error: null })
      try {
        const user = await provider.signInWithGoogle()
        set({ status: 'signed-in', user, error: null })
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Sign-in failed. Please try again.'
        set({ status: 'signed-out', user: null, error: message })
      }
    },
    signOut: async () => {
      await provider.signOut()
      set({ status: 'signed-out', user: null, error: null })
    },
  }))
}

export type AuthStore = ReturnType<typeof createAuthStore>

export const useAuthStore = createAuthStore(createMockGoogleProvider())
