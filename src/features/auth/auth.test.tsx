import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AuthGate } from './AuthGate'
import { createAuthStore } from './authStore'
import { createMockGoogleProvider, MOCK_SESSION_KEY, MOCK_USER } from './mockGoogleProvider'
import { SignOutLink } from './SignOutLink'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  }
}

function setup({ fail = false, storage = memoryStorage() } = {}) {
  const provider = createMockGoogleProvider({ delayMs: 0, shouldFail: () => fail, storage })
  return { store: createAuthStore(provider), storage }
}

function Page({ store }: { store: ReturnType<typeof createAuthStore> }) {
  return (
    <div>
      <p>The PG Page</p>
      <SignOutLink enabled useStore={store} />
    </div>
  )
}

describe('AuthGate', () => {
  it('shows the page straight away when sign-in is off', () => {
    const { store } = setup()
    render(<AuthGate enabled={false} useStore={store}><Page store={store} /></AuthGate>)
    expect(screen.getByText('The PG Page')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })

  it('signs in with Google, shows the page, then signs out back to the sign-in page', async () => {
    const user = userEvent.setup()
    const { store, storage } = setup()
    render(<AuthGate enabled useStore={store}><Page store={store} /></AuthGate>)

    expect(screen.queryByText('The PG Page')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }))

    expect(await screen.findByText('The PG Page')).toBeInTheDocument()
    expect(storage.data.has(MOCK_SESSION_KEY)).toBe(true)

    await user.click(screen.getByRole('button', { name: `Sign out (${MOCK_USER.name})` }))
    expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
    expect(storage.data.has(MOCK_SESSION_KEY)).toBe(false)
  })

  it('shows an error and stays on the sign-in page when sign-in fails', async () => {
    const user = userEvent.setup()
    const { store } = setup({ fail: true })
    render(<AuthGate enabled useStore={store}><Page store={store} /></AuthGate>)

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't sign in/i)
    expect(screen.queryByText('The PG Page')).not.toBeInTheDocument()
  })

  it('restores a saved session, so a reload skips the sign-in page', () => {
    const { store } = setup({ storage: memoryStorage({ [MOCK_SESSION_KEY]: JSON.stringify(MOCK_USER) }) })
    render(<AuthGate enabled useStore={store}><Page store={store} /></AuthGate>)
    expect(screen.getByText('The PG Page')).toBeInTheDocument()
  })
})
