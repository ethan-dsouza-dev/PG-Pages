import { useRef, type KeyboardEvent } from 'react'
import { folderOptions } from '../../domain/boardTasks'
import { evenSplit, withTiming, type ItemForm, type ItemKind } from '../../domain/taskForm'
import type { Board, Category, CategoryId, Goal, GoalHorizon } from '../../domain/types'
import { cx } from '../../ui'
import { Field } from './formControls'
import { inputClass } from './fieldContext'
import { MilestoneFields } from './MilestoneFields'
import { RepeatFields } from './RepeatFields'
import { SubphaseSection } from './SubphaseSection'
import { TimingFields } from './TimingFields'

const KINDS: { value: ItemKind; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'goal', label: 'Goal' },
  { value: 'theme', label: 'Theme' },
]

const HORIZONS: { value: GoalHorizon; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

type MainPanelProps = {
  form: ItemForm
  /** Tabs can only change while creating (TW-2.3). */
  kindLocked: boolean
  /** Edit instance: only this occurrence's time and milestones (TW-6.3). */
  instanceOnly: boolean
  boards: readonly Board[]
  categories: Record<CategoryId, Category>
  goals: readonly Goal[]
  timeZone: string
  newId: () => string
  onChange: (update: (form: ItemForm) => ItemForm) => void
  onOpenSubphase: (id: string) => void
}

/** The window's first panel: the tab bar (TW-2) and the chosen tab's fields (TW-3). */
export function MainPanel(props: MainPanelProps) {
  const { form, kindLocked, instanceOnly, boards, categories, goals, timeZone, newId, onChange, onOpenSubphase } = props
  const patch = (p: Partial<ItemForm>) => onChange((f) => ({ ...f, ...p }))
  const timed = form.kind === 'task' && form.timing === 'timed'

  return (
    <div className="flex flex-col gap-5">
      {!instanceOnly && (
        <KindTabs
          kind={form.kind}
          locked={kindLocked}
          onSelect={(kind) =>
            onChange((f) => {
              // Goals may go without a time; tasks need one (TW-2.2 keeps the rest).
              const timing = kind === 'task' && f.timing === 'none' ? 'timed' : kind !== 'task' && f.kind === 'task' ? 'none' : f.timing
              return withTiming({ ...f, kind }, timing)
            })
          }
        />
      )}

      {!instanceOnly && (
        <Field name="title" label="Label">
          {(p) => <input {...p} value={form.title} onChange={(e) => patch({ title: e.target.value })} className={inputClass} />}
        </Field>
      )}

      {form.kind === 'goal' && !instanceOnly && (
        <Field name="horizon" label="How long-term is this goal?">
          {(p) => (
            <select {...p} value={form.horizon} onChange={(e) => patch({ horizon: e.target.value as GoalHorizon })} className={`${inputClass} w-56`}>
              {HORIZONS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}

      {form.kind === 'theme' && (
        <Field name="themeMonth" label="Month">
          {(p) => (
            <input {...p} type="month" value={form.themeMonth} onChange={(e) => patch({ themeMonth: e.target.value })} className={`${inputClass} w-56`} />
          )}
        </Field>
      )}

      {form.kind === 'task' && !instanceOnly && (
        <>
          <Field name="folderId" label="Folder">
            {(p) => (
              <select {...p} value={form.folderId} onChange={(e) => patch({ folderId: e.target.value })} className={inputClass}>
                <option value="" disabled>
                  Choose a folder
                </option>
                {boards.map((b) => {
                  const board = categories[b.categoryId]?.name ?? b.categoryId
                  return (
                    <optgroup key={b.id} label={board}>
                      {folderOptions([b]).map((f) => (
                        // The board name leads, so a closed select still says which "Unsorted" it is.
                        <option key={f.id} value={f.id}>
                          {[board, ...f.path].join(' › ')}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
            )}
          </Field>
          <label className="flex items-center gap-2 text-label">
            <input
              type="checkbox"
              checked={form.social}
              onChange={(e) => patch({ social: e.target.checked })}
              className="interactive size-5 accent-text"
            />
            Social
          </label>
          <Field name="goalId" label="Counts toward goal (optional)">
            {(p) => (
              <select {...p} value={form.goalId} onChange={(e) => patch({ goalId: e.target.value })} className={inputClass}>
                <option value="">None</option>
                {goals
                  .filter((g) => g.scope !== 'theme')
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
              </select>
            )}
          </Field>
        </>
      )}

      {form.kind !== 'theme' && (
        <TimingFields
          form={form}
          allowNone={form.kind === 'goal'}
          onTiming={(timing) => onChange((f) => withTiming(f, timing))}
          onChange={patch}
        />
      )}

      {form.kind !== 'theme' && form.timing !== 'none' && !instanceOnly && (
        <RepeatFields repeat={form.repeat} startDay={form.start.slice(0, 10)} onChange={(repeat) => patch({ repeat })} />
      )}

      {timed && <MilestoneFields milestones={form.milestones} defaultAt={form.start} newId={newId} onChange={(milestones) => patch({ milestones })} />}

      {timed && !instanceOnly && (
        <SubphaseSection
          start={form.start}
          end={form.end}
          timeZone={timeZone}
          subphases={form.subphases}
          split={form.split}
          milestones={form.milestones}
          ownerName={form.title.trim() || 'this task'}
          onSplit={(count, mode) => patch({ split: mode, subphases: evenSplit(form.start, form.end, count, timeZone, newId) })}
          onOpen={onOpenSubphase}
          onRemoveAll={() => patch({ subphases: [], split: undefined })}
        />
      )}
    </div>
  )
}

/** TW-2.1: Task / Goal / Theme, with arrow-key movement between tabs. */
function KindTabs({ kind, locked, onSelect }: { kind: ItemKind; locked: boolean; onSelect: (kind: ItemKind) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (event: KeyboardEvent, index: number) => {
    if (locked) return
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + KINDS.length) % KINDS.length
    onSelect(KINDS[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label="Item type" className="flex gap-2 border-b-2 border-border-strong">
      {KINDS.map((k, i) => {
        const selected = k.value === kind
        return (
          <button
            key={k.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-disabled={locked && !selected ? true : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => !locked && onSelect(k.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cx(
              'interactive -mb-0.5 rounded-t-chip border-2 border-b-0 px-4 py-1 text-label',
              selected ? 'border-border-strong bg-surface-base font-medium' : 'border-transparent',
            )}
          >
            {k.label}
          </button>
        )
      })}
    </div>
  )
}
