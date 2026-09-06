import { useEffect, useRef, useState } from 'react'
import { CURRICULUM } from '../content'
import { cloneInto, lerpRect, placeAt, rectOf } from '../lib/handoff'
import { ScrollTrigger, reduceMotion } from '../lib/motion'
import DpGrid from './DpGrid'
import Section from './Section'

/** Handoff C leaves this many cells standing — they fly on to become K3's 3 nodes. */
const SURVIVORS = 3
const TOTAL_CELLS = CURRICULUM.rows.length * CURRICULUM.cols.length

export default function Curriculum() {
  const table = useRef<HTMLDivElement>(null)
  const [drain, setDrain] = useState(0)

  // Handoff C: drains the grid down to 3 cells as Contest scrolls into view,
  // in step with Contest.tsx's own trigger which flies those 3 cells on.
  useEffect(() => {
    if (reduceMotion()) return
    const contest = document.getElementById('contest')
    if (!contest) return

    const trigger = ScrollTrigger.create({
      trigger: contest,
      start: 'top 160%',
      end: 'top 85%',
      scrub: 0.4,
      onUpdate: (self) => {
        const next = Math.round(self.progress * (TOTAL_CELLS - SURVIVORS))
        setDrain((prev) => (prev === next ? prev : next))
      },
    })

    return () => trigger.kill()
  }, [])

  // Handoff B: Activities' "정규 수업" card descends and rect-morphs into
  // this section's calendar. Same clone-and-crossfade shape as Handoff A.
  useEffect(() => {
    const el = table.current
    if (!el || reduceMotion()) return

    const card = document.querySelector<HTMLElement>('.activity-item:first-child')
    const stage = document.getElementById('stage')
    const grid = () => el.querySelector<HTMLElement>('.dp')
    let clone: HTMLElement | null = null

    const release = () => {
      clone?.remove()
      clone = null
      if (card) card.style.visibility = ''
      const g = grid()
      if (g) {
        g.style.opacity = ''
        g.style.pointerEvents = ''
      }
    }

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 95%',
      end: 'top 30%',
      scrub: 0.4,
      onUpdate: (self) => {
        const p = self.progress
        const g = grid()
        if (!card || !stage || !g || p <= 0 || p >= 1) {
          release()
          return
        }

        if (!clone) clone = cloneInto(stage, card).clone
        clone.classList.add('handoff-card')
        card.style.visibility = 'hidden'
        g.style.pointerEvents = 'none'

        const cardRect = rectOf(card)
        const gridRect = rectOf(g)
        let rect = cardRect
        let neon = 0
        let gridFade = 0
        if (p < 0.25) {
          neon = p / 0.25
        } else if (p < 0.8) {
          rect = lerpRect(cardRect, gridRect, (p - 0.25) / 0.55)
          neon = 1
        } else {
          rect = gridRect
          neon = 1
          gridFade = (p - 0.8) / 0.2
        }

        placeAt(clone, rect)
        clone.style.boxShadow = `0 0 ${18 * neon}px ${6 * neon}px rgba(42,161,254,${0.55 * neon})`
        clone.style.opacity = String(1 - gridFade)
        g.style.opacity = String(gridFade)
      },
    })

    return () => {
      trigger.kill()
      release()
    }
  }, [])

  return (
    <Section
      id="curriculum"
      n="03"
      label="커리큘럼"
      bleed={
        <div className="curriculum-table" ref={table}>
          <DpGrid rows={CURRICULUM.rows} cols={CURRICULUM.cols} cells={CURRICULUM.cells} drain={drain} />
          <p className="curriculum-note">{CURRICULUM.note}</p>
        </div>
      }
    >
      <p className="about-lead line">
        <span className="line-i">
          C++ 문법에서 시작해 자료구조를 쌓고, 그 위에서 알고리즘 이론과 기출 문제로 넘어갑니다.
        </span>
      </p>
    </Section>
  )
}
