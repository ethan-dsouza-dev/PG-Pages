import type { ReactNode } from 'react'
import { Panel } from '../../ui'
import type { AuthStore } from './authStore'

type SignInPageProps = {
  /** The auth store hook (named use* so React and its compiler treat calls as hooks). */
  useStore: AuthStore
  /** Shown under the button, e.g. to say the sign-in is simulated. */
  notice?: ReactNode
}

/** Shown instead of the PG Page when sign-in is required and nobody is signed in (LP-2.5). */
export function SignInPage({ useStore, notice }: SignInPageProps) {
  const status = useStore((s) => s.status)
  const error = useStore((s) => s.error)
  const signInWithGoogle = useStore((s) => s.signInWithGoogle)
  const busy = status === 'signing-in'

  return (
    <main className="grid min-h-dvh place-items-center bg-surface-page px-6 py-10">
      <Panel className="flex w-full max-w-md flex-col gap-8 px-10 py-12">
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-title font-bold">PG Page</h1>
          <p className="text-label">Sign in to open your PG Page.</p>
        </div>

        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          disabled={busy}
          aria-busy={busy}
          className="interactive rounded-add border-2 border-border-strong bg-surface-base px-6 py-3 text-label font-bold disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && (
          <p role="alert" className="border-l-4 border-error pl-3 text-meta">
            {error}
          </p>
        )}

        {notice && <p className="text-caption">{notice}</p>}
      </Panel>
    </main>
  )
}
