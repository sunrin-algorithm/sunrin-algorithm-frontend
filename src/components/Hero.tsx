import { useEffect, useRef, useState } from 'react'
import { HERO, HERO_GLYPHS } from '../content'
import { gsap, reduceMotion } from '../lib/motion'
import TreeViz from './TreeViz'

const pad = (n: number) => String(n).padStart(2, '0')

export default function Hero() {
  const [visited, setVisited] = useState(0)
  const headline = useRef<HTMLSpanElement>(null)
  const total = HERO_GLYPHS.length

  useEffect(() => {
    if (!headline.current || reduceMotion()) return
    const tween = gsap.fromTo(
      headline.current,
      { yPercent: 108 },
      { yPercent: 0, duration: 1.4, ease: 'expo.out', delay: 0.25 },
    )
    return () => {
      tween.kill()
    }
  }, [])

  return (
    <header className="hero shell" id="top">
      <h1 className="sr-only">SHARC — 선린인터넷고등학교 알고리즘연구부</h1>

      <div className="hero-stage">
        <TreeViz glyphs={HERO_GLYPHS} onVisit={setVisited} />
      </div>

      <div className="hero-foot">
        <div>
          <p className="pixel muted">{HERO.eyebrow}</p>
          <p className="intro">{HERO.intro}</p>
        </div>

        <div className="hero-readout pixel-mono" aria-hidden="true">
          <span className="expr">preorder(root)</span>
          <span>
            <span className="val">{pad(visited)}</span> / {pad(total)} VISITED
          </span>
          <span className="out">
            OUT ▸ <span className="val">{HERO_GLYPHS.slice(0, visited).join('') || '—'}</span>
          </span>
          <span>SCROLL ↓</span>
        </div>
      </div>

      <p className="hero-headline" aria-hidden="true">
        <span ref={headline}>{HERO.headline}</span>
      </p>
    </header>
  )
}
