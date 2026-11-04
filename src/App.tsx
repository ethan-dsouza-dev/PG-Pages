import { lazy, Suspense } from 'react'
import { PGPageView } from './features/pg-page/PGPageView'

const PrimitivesPreview = import.meta.env.DEV ? lazy(() => import('./dev/PrimitivesPreview')) : null

function App() {
  if (PrimitivesPreview && new URLSearchParams(window.location.search).has('primitives')) {
    return (
      <Suspense>
        <PrimitivesPreview />
      </Suspense>
    )
  }

  return <PGPageView />
}

export default App
