import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { displayName } from '../../domain/pages'
import { usePageCollectionActions, usePageMeta, usePages } from '../../store/pgPageStore'
import { cx } from '../../ui'

const LABEL = 'Your PG Pages'

/**
 * "Your PG Pages" (LP-2.3): a disclosure button that opens a list of every PG
 * Page. Choosing one switches the whole page to it. Arrow keys move through
 * the list; Escape, a click outside, or tabbing away closes it.
 */
export function PageSwitcher() {
  const pages = usePages()
  const { id: activeId } = usePageMeta()
  const { switchPage } = usePageCollectionActions()
  const [open, setOpen] = useState(false)
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const items = () => Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])

  // Opening moves focus to the shown page, so arrows start from there.
  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLButtonElement>('[aria-current]')?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) return
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    const list = items()
    const at = list.indexOf(document.activeElement as HTMLButtonElement)
    const move: Record<string, number> = {
      ArrowDown: at + 1,
      ArrowUp: at - 1,
      Home: 0,
      End: list.length - 1,
    }
    if (!(e.key in move) || list.length === 0) return
    e.preventDefault()
    list[(move[e.key] + list.length) % list.length].focus()
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        if (open && !rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="interactive inline-flex items-baseline gap-2 text-left text-nav"
      >
        <span className="underline decoration-2 underline-offset-4">{LABEL}</span>
        <span aria-hidden="true" className={cx('inline-block text-label transition-transform', open && 'rotate-180')}>
          ▾
        </span>
      </button>
      <ul
        ref={listRef}
        id={listId}
        aria-label={LABEL}
        hidden={!open}
        className="absolute top-full left-0 z-10 mt-2 flex max-h-96 min-w-full flex-col overflow-y-auto rounded-chip border-2 border-border-strong bg-surface-base py-2 shadow-lift"
      >
        {pages.map((page) => {
          const current = page.id === activeId
          return (
            <li key={page.id}>
              <button
                type="button"
                aria-current={current ? 'page' : undefined}
                onClick={() => {
                  switchPage(page.id)
                  close()
                }}
                className={cx(
                  'interactive flex w-full items-baseline gap-2 px-4 py-1 text-left text-label whitespace-nowrap hover:bg-surface-panel focus-visible:bg-surface-panel',
                  current && 'font-bold',
                )}
              >
                <span aria-hidden="true" className={cx('w-4', !current && 'invisible')}>
                  ✓
                </span>
                {displayName(page)}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
