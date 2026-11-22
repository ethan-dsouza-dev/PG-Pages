/** The signed-in person, as far as the PG Page needs to know. */
export type AuthUser = {
  id: string
  name: string
  email: string
}

/**
 * Where sign-in actually happens. The UI only talks to this interface, so the
 * mock below can be swapped for a Supabase Google OAuth provider (LP-2.6) and,
 * later, email + password or other providers, without touching the pages.
 */
export interface AuthProvider {
  /** The session restored from a previous visit, if any. */
  restoreSession(): AuthUser | null
  /** Resolves with the user, or rejects with an Error whose message is safe to show. */
  signInWithGoogle(): Promise<AuthUser>
  signOut(): Promise<void>
}
