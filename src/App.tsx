import { lazy, Suspense } from 'react'
import { PageStack } from './features/page-stack/PageStack'

const PrimitivesPreview = import.meta.env.DEV ? lazy(() => import('./dev/PrimitivesPreview')) : null
const GalleryPreview = import.meta.env.DEV ? lazy(() => import('./dev/GalleryPreview')) : null
const BoardsPreview = import.meta.env.DEV ? lazy(() => import('./dev/BoardsPreview')) : null

function App() {
  if (PrimitivesPreview && new URLSearchParams(window.location.search).has('primitives')) {
    return (
      <Suspense>
        <PrimitivesPreview />
      </Suspense>
    )
  }

  if (GalleryPreview && new URLSearchParams(window.location.search).has('gallery')) {
    return (
      <Suspense>
        <GalleryPreview />
      </Suspense>
    )
  }

  if (BoardsPreview && new URLSearchParams(window.location.search).has('boards')) {
    return (
      <Suspense>
        <BoardsPreview />
      </Suspense>
    )
  }

  return <PageStack />
}

export default App
