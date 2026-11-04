import { mockItemBuilders, MOCK_BOARD_ITEMS, MOCK_BOARDS, MOCK_CATEGORIES } from '../data/mock/boards'
import type { Board, BoardGroup, BoardItem, BoardTheme, Category, CategoryId } from '../domain/types'

/*
 * Fixtures for the `?boards` dev preview (brief 09a): the real boards, a
 * theme × lane-count matrix, and the edge cases the mockups don't show.
 */

const { plain, weeklyFs, f101, repeatItems } = mockItemBuilders

export const PREVIEW_CATEGORIES: Record<CategoryId, Category> = {
  ...MOCK_CATEGORIES,
  health: { id: 'health', name: 'Health', theme: 'self-care' },
  // Leisure's data in the Self-Care theme: proves a theme swap needs no component change.
  'leisure-as-self-care': { id: 'leisure-as-self-care', name: 'Leisure', theme: 'self-care' },
}

const items: BoardItem[] = []
const add = (...list: BoardItem[]) => {
  items.push(...list)
  return list.map((i) => i.id)
}

/** The fixed matrix group content: every item kind and status, in every area. */
function matrixItems(p: string, cat: CategoryId, layout: 'compact' | 'expanded'): string[] {
  const social = [cat, 'social']
  const health = [cat, 'health']
  return [
    ...add(
      weeklyFs(`${p}-weekly`, [cat]),
      plain(`${p}-clean`, 'Clean your room', [cat]),
      f101(`${p}-f101`, [cat]),
      { ...plain(`${p}-done`, 'Laundry', [cat]), status: 'done' },
      plain(`${p}-off`, 'Winter boots', [cat], 'inactive'),
      ...repeatItems(`${p}-more`, layout === 'compact' ? 4 : 1, [cat]),
    ),
    ...add(
      { ...plain(`${p}-plumber`, 'Call Plumber', social), status: 'done' },
      plain(`${p}-design`, 'Meet Design Group', social, 'inactive'),
      // In both overlap categories: lands in whichever lane comes first (OQ-17).
      f101(`${p}-both`, [cat, 'social', 'health']),
      plain(`${p}-party`, 'Birthday party', social),
    ),
    ...add(plain(`${p}-gym`, 'Gym session', health), plain(`${p}-dentist`, 'Dentist', health), plain(`${p}-walk`, 'Evening walk', health)),
  ]
}

const LANE_SETS: CategoryId[][] = [[], ['social'], ['social', 'health']]
const THEMES: { theme: BoardTheme; cat: CategoryId }[] = [
  { theme: 'productivity', cat: 'productivity' },
  { theme: 'self-care', cat: 'self-care' },
  { theme: 'leisure', cat: 'leisure' },
]

export type PreviewBoard = { label: string; board: Board }

export const MATRIX_BOARDS: PreviewBoard[] = THEMES.flatMap(({ theme, cat }) =>
  LANE_SETS.map((lanes) => {
    const p = `m-${theme}-${lanes.length}`
    const label = `${theme} · ${lanes.length} lane${lanes.length === 1 ? '' : 's'} · compact + expanded`
    return {
      label,
      board: {
        id: p,
        categoryId: cat,
        overlapCategoryIds: lanes,
        groups: [
          { id: `${p}-compact`, title: 'Compact group', layout: 'compact', itemIds: matrixItems(`${p}-c`, cat, 'compact') },
          { id: `${p}-expanded`, title: 'Expanded group', layout: 'expanded', itemIds: matrixItems(`${p}-e`, cat, 'expanded') },
        ],
      },
    }
  }),
)

const group = (id: string, title: string, itemIds: string[], extra: Partial<BoardGroup> = {}): BoardGroup => ({
  id,
  title,
  layout: 'compact',
  itemIds,
  ...extra,
})

const LONG = 'An unusually long item title that keeps going past sixty chars'

export const EDGE_BOARDS: PreviewBoard[] = [
  {
    label: 'self-care · 1 lane · compact under the cap (no See all)',
    board: {
      id: 'e-under-cap',
      categoryId: 'self-care',
      overlapCategoryIds: ['social'],
      groups: [
        group('e-under-cap-g', 'Under the cap', [
          ...add(plain('e-uc-1', 'Clean your room', ['self-care']), plain('e-uc-2', 'Water plants', ['self-care'])),
          ...add(plain('e-uc-3', 'Call Plumber', ['self-care', 'social'])),
        ]),
      ],
    },
  },
  {
    label: 'leisure · 1 lane · only lane items',
    board: {
      id: 'e-lane-only',
      categoryId: 'leisure',
      overlapCategoryIds: ['social'],
      groups: [
        group('e-lane-only-g', 'Only Social', add(...repeatItems('e-lo', 4, ['leisure', 'social'], 'todo', 'Board games night'))),
      ],
    },
  },
  {
    label: 'productivity · 1 lane · long titles',
    board: {
      id: 'e-long',
      categoryId: 'productivity',
      overlapCategoryIds: ['social'],
      groups: [
        group('e-long-g', 'A group title long enough that it has to wrap within column one', [
          ...add(plain('e-long-1', LONG, ['productivity']), plain('e-long-2', 'Short one', ['productivity'])),
          ...add(plain('e-long-3', LONG, ['productivity', 'social'])),
        ]),
      ],
    },
  },
  {
    label: 'productivity · 1 lane · deep nesting (two levels)',
    board: {
      id: 'e-deep',
      categoryId: 'productivity',
      overlapCategoryIds: ['social'],
      groups: [
        group('e-deep-g', 'Parent', add(plain('e-deep-1', 'Parent item', ['productivity']), plain('e-deep-2', 'Parent social', ['productivity', 'social'])), {
          children: [
            group('e-deep-c', 'Child', add(plain('e-deep-3', 'Child item', ['productivity']), plain('e-deep-4', 'Child social', ['productivity', 'social'])), {
              children: [group('e-deep-gc', 'Grandchild', add(plain('e-deep-5', 'Grandchild item', ['productivity'])))],
            }),
          ],
        }),
      ],
    },
  },
  {
    label: 'self-care · 1 lane · phase chips in the lane',
    board: {
      id: 'e-phase-lane',
      categoryId: 'self-care',
      overlapCategoryIds: ['social'],
      groups: [
        group('e-phase-lane-g', 'Phases everywhere', [
          ...add(weeklyFs('e-pl-1', ['self-care'])),
          ...add(weeklyFs('e-pl-2', ['self-care', 'social']), f101('e-pl-3', ['self-care', 'social'])),
        ]),
      ],
    },
  },
]

/** The Leisure board's real data with its category switched to the Self-Care theme. */
const leisure = MOCK_BOARDS.find((b) => b.id === 'board-leisure')!
const leisureItems = new Set(leisure.groups.flatMap((g) => g.itemIds))
export const THEME_SWAP_BOARD: PreviewBoard = {
  label: 'leisure data · self-care theme (theme swap, no component change)',
  board: { ...leisure, id: 'e-theme-swap', categoryId: 'leisure-as-self-care' },
}
for (const id of leisureItems) {
  const item = MOCK_BOARD_ITEMS[id]
  items.push({ ...item, id: `swap-${id}`, categoryIds: item.categoryIds.map((c) => (c === 'leisure' ? 'leisure-as-self-care' : c)) })
}
THEME_SWAP_BOARD.board.groups = leisure.groups.map((g) => ({ ...g, itemIds: g.itemIds.map((id) => `swap-${id}`) }))

export const PREVIEW_ITEMS: Record<string, BoardItem> = {
  ...MOCK_BOARD_ITEMS,
  ...Object.fromEntries(items.map((i) => [i.id, i])),
}
