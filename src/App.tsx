import { useEffect } from 'react'
import About from './components/About'
import Activities from './components/Activities'
import Contact from './components/Contact'
import Contest from './components/Contest'
import Corners from './components/Corners'
import Curriculum from './components/Curriculum'
import Hero from './components/Hero'
import { ScrollTrigger, initSmoothScroll } from './lib/motion'

export default function App() {
  useEffect(() => {
    const stop = initSmoothScroll()
    // Fonts land after first paint and shift every trigger start point.
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return stop
  }, [])

  return (
    <>
      <Corners />
      <main>
        <Hero />
        <About />
        <Activities />
        <Curriculum />
        <Contest />
        <Contact />
      </main>
    </>
  )
}
