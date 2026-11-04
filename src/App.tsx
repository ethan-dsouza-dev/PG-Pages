import { lazy, Suspense } from 'react'

const PrimitivesPreview = import.meta.env.DEV ? lazy(() => import('./dev/PrimitivesPreview')) : null

function App() {
  if (PrimitivesPreview && new URLSearchParams(window.location.search).has('primitives')) {
    return (
      <Suspense>
        <PrimitivesPreview />
      </Suspense>
    )
  }

  // The PG Page shell lands here in brief 04.
  return <main />
}

export default App
