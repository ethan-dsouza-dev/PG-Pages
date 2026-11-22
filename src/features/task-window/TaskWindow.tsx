import * as Dialog from '@radix-ui/react-dialog'
import { useId, useMemo, useState, type FormEvent } from 'react'
import { taskKey, tasksForKey } from '../../domain/boardTasks'
import {
  changesTime,
  countInside,
  deletePhaseAt,
  firstErrorKey,
  phaseAt,
  phaseDisplayName,
  randomId,
  sameForm,
  updatePhaseAt,
  validateForm,
  type FormErrors,
  type ItemForm,
} from '../../domain/taskForm'
import type { EditScope } from '../../domain/taskSave'
import {
  useActivePage,
  useCategories,
  useTaskWindowActions,
  type TaskWindowRequest,
} from '../../store/pgPageStore'
import { TextLink } from '../../ui'
import { ConfirmDialog, type ConfirmChoice } from './ConfirmDialog'
import { controlId, FieldContext } from './fieldContext'
import { MainPanel } from './MainPanel'
import { SubphasePanel } from './SubphasePanel'

const KIND_NAMES = { task: 'task', goal: 'goal', theme: 'theme' } as const

function titleFor(request: TaskWindowRequest, form: ItemForm): string {
  const kind = KIND_NAMES[form.kind]
  switch (request.mode) {
    case 'new':
      return `New ${kind}`
    case 'edit':
      return `Edit ${kind}`
    case 'duplicate':
      return `Duplicate ${kind}`
    case 'instance':
      return 'Edit this occurrence'
  }
}

type Prompt =
  | { type: 'discard' }
  | { type: 'scope' }
  | { type: 'delete-phase'; path: string[] }

type TaskWindowProps = {
  request: TaskWindowRequest
  /** The form it opened with (see initialFormFor). */
  initial: ItemForm
  /** Where focus goes when the window closes (TW-1.1). */
  returnFocus: HTMLElement | null
}

/** TW-1 – TW-6: the New / Edit Task window. Mounted fresh for each request. */
export function TaskWindow({ request, initial, returnFocus }: TaskWindowProps) {
  const page = useActivePage()
  const categories = useCategories()
  const { closeTaskWindow, createItem, updateTask, updateGoal } = useTaskWindowActions()
  const prefix = useId()
  const tz = page.timeZone
  const [form, setForm] = useState<ItemForm>(initial)
  const [errors, setErrors] = useState<FormErrors>({})
  const [path, setPath] = useState<string[]>(() => ('phasePath' in request && request.phasePath) || [])
  const [direction, setDirection] = useState<'right' | 'left'>('right')
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const fieldContext = useMemo(() => ({ prefix, errors }), [prefix, errors])

  const dirty = !sameForm(initial, form)
  const isTaskEdit = (request.mode === 'edit' && request.kind === 'task') || request.mode === 'instance'
  const editedTask = isTaskEdit ? page.tasks.find((t) => t.id === (request as { taskId: string }).taskId) : undefined
  const series = editedTask ? tasksForKey(page.tasks, taskKey(editedTask)) : []

  const change = (update: (f: ItemForm) => ItemForm) => {
    setForm(update)
    if (Object.keys(errors).length) setErrors({})
  }

  const goTo = (next: string[]) => {
    setDirection(next.length >= path.length ? 'right' : 'left')
    setPath(next)
  }

  const requestClose = () => (dirty ? setPrompt({ type: 'discard' }) : closeTaskWindow())

  const commit = (scope: EditScope) => {
    if (request.mode === 'new' || request.mode === 'duplicate') createItem(form)
    else if (request.mode === 'instance') updateTask(request.taskId, form, 'this')
    else if (request.kind === 'task') updateTask(request.taskId, form, scope)
    else updateGoal(request.goalId, form)
    closeTaskWindow()
  }

  const save = (event: FormEvent) => {
    event.preventDefault()
    const found = validateForm(form, page.boards, tz)
    if (Object.keys(found).length) {
      setErrors(found)
      const key = firstErrorKey(found)!
      // A subphase problem lives on its own panel; go back to the top so its section is visible.
      if (path.length && !key.startsWith('phase')) goTo([])
      requestAnimationFrame(() => document.getElementById(controlId(prefix, key))?.focus())
      return
    }
    // TW-6.4: a repeating task whose time moved asks which occurrences change.
    if (request.mode === 'edit' && request.kind === 'task' && series.length > 1 && changesTime(initial, form)) {
      setPrompt({ type: 'scope' })
      return
    }
    commit('all')
  }

  const current = path.length ? phaseAt(form, path) : null
  const parent = path.length > 1 ? phaseAt(form, path.slice(0, -1)) : null
  const siblings = parent ? parent.subphases : form.subphases
  const index = current ? siblings.findIndex((p) => p.id === current.id) : -1
  const trail = [form.title.trim() || 'Task', ...path.slice(0, -1).map((id, depth) => {
    const node = phaseAt(form, path.slice(0, depth + 1))
    const list = depth === 0 ? form.subphases : phaseAt(form, path.slice(0, depth))?.subphases ?? []
    return node ? phaseDisplayName(node, list.indexOf(node)) : id
  })]

  const promptChoices = (): { title: string; description: string; choices: ConfirmChoice[] } => {
    if (prompt?.type === 'discard') {
      return {
        title: 'Discard changes?',
        description: 'Your changes haven’t been saved.',
        choices: [
          { label: 'Keep editing', onSelect: () => setPrompt(null) },
          { label: 'Discard changes', onSelect: closeTaskWindow },
        ],
      }
    }
    if (prompt?.type === 'scope') {
      return {
        title: 'Change which occurrences?',
        description: 'This task repeats. Choose which occurrences get the new time.',
        choices: [
          { label: 'Cancel', onSelect: () => setPrompt(null) },
          { label: 'Only this one', onSelect: () => commit('this') },
          { label: 'This and following', onSelect: () => commit('following') },
          { label: 'All', onSelect: () => commit('all') },
        ],
      }
    }
    const target = prompt?.type === 'delete-phase' ? phaseAt(form, prompt.path) : null
    const inside = target ? countInside(target) : { subphases: 0, milestones: 0 }
    return {
      title: 'Delete this subphase?',
      description:
        inside.subphases + inside.milestones > 0
          ? `This also deletes ${inside.subphases} subphase${inside.subphases === 1 ? '' : 's'} and ${inside.milestones} milestone${inside.milestones === 1 ? '' : 's'} inside it. Its time becomes an empty gap.`
          : 'Its time becomes an empty gap; the other subphases keep their times.',
      choices: [
        { label: 'Cancel', onSelect: () => setPrompt(null) },
        {
          label: 'Delete',
          onSelect: () => {
            if (prompt?.type !== 'delete-phase') return
            change((f) => deletePhaseAt(f, prompt.path))
            goTo(prompt.path.slice(0, -1))
            setPrompt(null)
          },
        },
      ],
    }
  }

  const deletePhase = (p: string[]) => {
    const target = phaseAt(form, p)
    if (!target) return
    const inside = countInside(target)
    if (inside.subphases + inside.milestones > 0) setPrompt({ type: 'delete-phase', path: p })
    else {
      change((f) => deletePhaseAt(f, p))
      goTo(p.slice(0, -1))
    }
  }

  const promptContent = prompt ? promptChoices() : null

  return (
    <Dialog.Root open onOpenChange={(open) => !open && requestClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-overlay" />
        <Dialog.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(event) => {
            // Escape on a subphase panel slides back to its parent (TW-4.3).
            if (path.length) {
              event.preventDefault()
              goTo(path.slice(0, -1))
            }
          }}
          onInteractOutside={(event) => {
            if (prompt) event.preventDefault()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            if (returnFocus?.isConnected) returnFocus.focus()
          }}
          className="fixed top-1/2 left-1/2 z-20 flex max-h-[90vh] w-176 max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-panel border-2 border-border-strong bg-surface-panel font-body text-text"
        >
          <form onSubmit={save} noValidate className="flex min-h-0 flex-col">
            <div className="flex items-start justify-between gap-4 px-8 pt-6 pb-4">
              <Dialog.Title className="text-section">{titleFor(request, form)}</Dialog.Title>
              <button type="button" onClick={requestClose} aria-label="Close" className="interactive rounded-chip px-2 text-section leading-none">
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <FieldContext.Provider value={fieldContext}>
              <div
                key={path.join('/') || 'main'}
                className={`min-h-0 overflow-y-auto px-8 pb-6 ${direction === 'right' ? 'slide-in-right' : 'slide-in-left'}`}
              >
                {current ? (
                  <SubphasePanel
                    phase={current}
                    index={index}
                    trail={trail}
                    parentSplit={parent ? parent.split : form.split}
                    timeZone={tz}
                    newId={randomId}
                    onChange={(update) => change((f) => updatePhaseAt(f, path, update))}
                    onBack={() => goTo(path.slice(0, -1))}
                    onJump={(depth) => goTo(path.slice(0, depth))}
                    onOpenChild={(id) => goTo([...path, id])}
                    onDelete={() => deletePhase(path)}
                  />
                ) : (
                  <MainPanel
                    form={form}
                    kindLocked={request.mode !== 'new'}
                    instanceOnly={request.mode === 'instance'}
                    boards={page.boards}
                    categories={categories}
                    goals={page.goals}
                    timeZone={tz}
                    newId={randomId}
                    onChange={change}
                    onOpenSubphase={(id) => goTo([id])}
                  />
                )}
              </div>
            </FieldContext.Provider>

            <div className="flex items-center justify-between gap-6 border-t-2 border-border-strong px-8 py-4">
              <p role="status" className="text-meta">
                {Object.keys(errors).length > 0 &&
                  `Fix ${Object.keys(errors).length} problem${Object.keys(errors).length === 1 ? '' : 's'} to save.`}
              </p>
              <div className="flex items-center gap-6">
                <TextLink size="label" onClick={requestClose}>
                  Cancel
                </TextLink>
                <button
                  type="submit"
                  className="interactive rounded-add border-2 border-border-strong bg-add px-6 py-1.5 text-label font-medium text-text-on-accent"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
          {promptContent && (
            <ConfirmDialog
              open
              title={promptContent.title}
              description={promptContent.description}
              choices={promptContent.choices}
              onCancel={() => setPrompt(null)}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
