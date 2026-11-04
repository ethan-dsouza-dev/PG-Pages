import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AddChip } from './AddChip'
import { Chip } from './Chip'
import { Panel } from './Panel'
import { PhaseBar } from './PhaseBar'
import { SeeAllButton } from './SeeAllButton'
import { SectionHeading } from './SectionHeading'
import { TextLink } from './TextLink'

function ToggleableChip() {
  const [done, setDone] = useState(false)
  return <Chip label="Clean your room" completed={done} onToggle={() => setDone((d) => !d)} />
}

describe('Chip', () => {
  it('is a toggle button whose pressed state and color follow completion', async () => {
    const user = userEvent.setup()
    render(<ToggleableChip />)
    const chip = screen.getByRole('button', { name: 'Clean your room' })

    expect(chip).toHaveAttribute('aria-pressed', 'false')
    expect(chip).toHaveClass('bg-goal-todo')

    await user.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(chip).toHaveClass('bg-goal-done')
  })

  it('toggles from the keyboard', async () => {
    const user = userEvent.setup()
    render(<ToggleableChip />)
    await user.tab()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Clean your room' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

describe('AddChip', () => {
  it('shows "+" but is named by its label', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<AddChip label="Add day goal" onClick={onClick} />)
    const button = screen.getByRole('button', { name: 'Add day goal' })

    expect(button).toHaveTextContent('+')
    await user.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('announces placeholders as coming soon and only logs', async () => {
    const user = userEvent.setup()
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    render(<AddChip label="Add month goal" placeholder />)
    const button = screen.getByRole('button', { name: 'Add month goal, coming soon' })

    expect(button).toHaveAttribute('aria-disabled', 'true')
    await user.click(button)
    expect(info).toHaveBeenCalledOnce()
    info.mockRestore()
  })
})

describe('TextLink', () => {
  it('renders an anchor when given href', () => {
    render(<TextLink href="/somewhere">Other PG Pages</TextLink>)
    expect(screen.getByRole('link', { name: 'Other PG Pages' })).toHaveAttribute('href', '/somewhere')
  })

  it('renders a button when given onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<TextLink onClick={onClick}>Reset Day</TextLink>)
    await user.click(screen.getByRole('button', { name: 'Reset Day' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders placeholders as focusable, aria-disabled buttons', async () => {
    const user = userEvent.setup()
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    render(<TextLink placeholder>Export to Sheets</TextLink>)
    const button = screen.getByRole('button', { name: 'Export to Sheets, coming soon' })

    await user.tab()
    expect(button).toHaveFocus()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await user.keyboard('{Enter}')
    expect(info).toHaveBeenCalledWith(expect.stringContaining('Export to Sheets'))
    info.mockRestore()
  })
})

describe('Panel and SectionHeading', () => {
  it('render their content with the expected semantics', () => {
    render(
      <Panel data-testid="panel">
        <SectionHeading>Goals for the day</SectionHeading>
        <SectionHeading as="h3">Sub heading</SectionHeading>
      </Panel>,
    )
    expect(screen.getByTestId('panel')).toHaveClass('bg-surface-panel')
    expect(screen.getByRole('heading', { level: 2, name: 'Goals for the day' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Sub heading' })).toBeInTheDocument()
  })
})

describe('PhaseBar', () => {
  it('draws one decorative segment per entry, sized as a fraction of the bar', () => {
    const { container } = render(
      <PhaseBar
        segments={[
          { id: 'a', startFr: 0, endFr: 0.25 },
          { id: 'b', startFr: 0.25, endFr: 1 },
        ]}
      />,
    )
    const bar = container.firstElementChild as HTMLElement
    expect(bar).toHaveAttribute('aria-hidden', 'true')
    const segments = bar.querySelectorAll<HTMLElement>('[data-phase-segment]')
    expect([...segments].map((s) => [s.style.left, s.style.width])).toEqual([
      ['0%', '25%'],
      ['25%', '75%'],
    ])
  })
})

describe('SeeAllButton', () => {
  it('is a placeholder named by its label', async () => {
    const user = userEvent.setup()
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    render(<SeeAllButton count={22} label="See all 22 Self-Care items in Cleaning Day" />)
    const button = screen.getByRole('button', { name: 'See all 22 Self-Care items in Cleaning Day, coming soon' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await user.click(button)
    expect(info).toHaveBeenCalledOnce()
    info.mockRestore()
  })
})
