import { useState } from 'react'
import { AddChip, Chip, Panel, PictureFrame, SectionHeading, TextLink } from '../ui'

const initialGoals = [
  { id: 'g1', label: 'Clean your room', completed: false },
  { id: 'g2', label: 'Read 20 pages', completed: true },
  { id: 'g3', label: 'Go for a run', completed: false },
  { id: 'g4', label: 'Call grandma', completed: false },
  { id: 'g5', label: 'Meal prep', completed: false },
]

/** Dev-only page (`/?primitives`) rendering every primitive in every state. */
export default function PrimitivesPreview() {
  const [goals, setGoals] = useState(initialGoals)
  const toggle = (id: string) =>
    setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)))

  return (
    <main className="mx-auto flex max-w-page flex-col gap-12 px-16 py-12">
      <h1 className="font-display text-title">
        <span className="block font-light">Primitives</span>
        <span className="block font-bold">Preview</span>
      </h1>

      <section className="flex flex-col gap-2">
        <SectionHeading>Text links</SectionHeading>
        <TextLink onClick={() => console.info('Reset Day clicked')}>Reset Day</TextLink>
        <TextLink href="#">Other PG Pages (href)</TextLink>
        <TextLink placeholder>Export to Sheets</TextLink>
        <TextLink size="label" onClick={() => {}}>
          Yesterday
        </TextLink>
        <TextLink size="meta" placeholder>
          visit other versions
        </TextLink>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Goals for the day</SectionHeading>
        <ul className="grid grid-cols-4 gap-x-4 gap-y-5">
          {goals.map((g) => (
            <li key={g.id}>
              <Chip label={g.label} completed={g.completed} onToggle={() => toggle(g.id)} />
            </li>
          ))}
          <li>
            <AddChip label="Add day goal" placeholder />
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Panel with compact add</SectionHeading>
        <Panel className="flex h-64 items-end justify-end gap-4 p-6">
          <span className="text-label">Add Timed Task</span>
          <AddChip label="Add timed task" size="compact" placeholder />
        </Panel>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading>Picture frames</SectionHeading>
        <p className="text-meta">
          Landscape, portrait, and square, with and without a caption. Full shape combinations on the wall:{' '}
          <TextLink href="?gallery">gallery preview</TextLink>
        </p>
        <div className="flex items-start gap-12 bg-surface-gallery-wall p-12 pt-16">
          <PictureFrame aspectRatio={5 / 4} className="w-80">
            <img src="/ads/placeholder_4.svg" alt="Abstract circles over a wavy horizon" width={1000} height={800} />
          </PictureFrame>
          <PictureFrame aspectRatio={4 / 5} caption="Join us at the museum" className="w-56">
            <img src="/ads/placeholder_6.svg" alt="A sun setting behind purple ridges" width={800} height={1000} />
          </PictureFrame>
          <PictureFrame aspectRatio={1} caption="Square, no image yet" className="w-60">
            <div />
          </PictureFrame>
        </div>
      </section>
    </main>
  )
}
