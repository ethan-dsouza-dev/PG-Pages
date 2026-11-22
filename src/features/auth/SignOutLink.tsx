import { flags } from '../../config/flags'
import { TextLink } from '../../ui'
import { useAuthStore, type AuthStore } from './authStore'

/** "Sign out (name)" link. Renders nothing when sign-in is off. */
export function SignOutLink({ enabled = flags.authEnabled, useStore = useAuthStore }: { enabled?: boolean; useStore?: AuthStore }) {
  const user = useStore((s) => s.user)
  const signOut = useStore((s) => s.signOut)

  if (!enabled || !user) return null
  return (
    <TextLink size="meta" onClick={() => void signOut()}>
      {`Sign out (${user.name})`}
    </TextLink>
  )
}
