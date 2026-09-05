import { useEffect, useState } from 'react'
import About from './components/About'
import Act1 from './components/Act1'
import Activities from './components/Activities'
import Contact from './components/Contact'
import Contest from './components/Contest'
import Corners from './components/Corners'
import Curriculum from './components/Curriculum'
import { ScrollTrigger, initSmoothScroll, scrollToId } from './lib/motion'

export default function App() {
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    const stop = initSmoothScroll()
    document.fonts?.ready.then(() => {
      // Fonts land after first paint and shift every trigger start point.
      ScrollTrigger.refresh()
      // A cold hash-load jumps before fonts settle, landing short of the target.
      const id = location.hash.slice(1)
      if (id) scrollToId(id)
    })
    return stop
  }, [])

  return (
    <>
      <Corners open={sheetOpen} onOpenChange={setSheetOpen} />
      <main inert={sheetOpen || undefined}>
        <Act1 />
        <About />
        <Activities />
        <Curriculum />
        <Contest />
        <Contact />
      </main>
    </>
  )
}
