import { useEffect, useRef, useState } from 'react'
import { CURRICULUM } from '../content'
import { centerRect, cloneInto, lerpRect, placeAt, rectOf } from '../lib/handoff'
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
  // in step with Contest.tsx's own trigger which flies those 3 cells on. The
  // start/end strings must stay identical to Contest.tsx's fly trigger.
  useEffect(() => {
    if (reduceMotion()) return
    const contest = document.getElementById('contest')
    if (!contest) return

    const trigger = ScrollTrigger.create({
      trigger: contest,
      start: 'top 190%',
      end: 'top 70%',
      scrub: 0.6,
      onUpdate: (self) => {
        const next = Math.round(self.progress * (TOTAL_CELLS - SURVIVORS))
        setDrain((prev) => (prev === next ? prev : next))
      },
    })

    return () => trigger.kill()
  }, [])

  // Handoff B: Activities' "정규 수업" card becomes this section's calendar.
  // Nothing is pinned — the tree, the copy and the rest of the page keep
  // scrolling normally the whole way through. Only the clone is held, and it is
  // held because its target is a fixed screen rect rather than a document one:
  // it eases (slow, then quickening) out to the dead centre of the screen,
  // stops there while everything else travels up past it, sheds its own text,
  // and only starts growing once the calendar itself reaches the viewport.
  useEffect(() => {
    const el = table.current
    if (!el || reduceMotion()) return

    const card = document.querySelector<HTMLElement>('.activity-item:first-child')
    const stage = document.getElementById('stage')
    const grid = () => el.querySelector<HTMLElement>('.dp')
    if (!card || !stage) return

    let clone: HTMLElement | null = null

    const release = () => {
      clone?.remove()
      clone = null
      card.style.visibility = ''
      const g = grid()
      if (g) {
        g.style.opacity = ''
        g.style.pointerEvents = ''
      }
    }

    /** Where the travel ends and the motionless hold begins. */
    const MOVE_END = 0.34

    const drive = ScrollTrigger.create({
      trigger: card,
      start: 'top 60%',
      endTrigger: el,
      end: 'top 45%',
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress
        const g = grid()
        if (!g || p <= 0 || p >= 1) {
          release()
          return
        }

        if (!clone) clone = cloneInto(stage, card).clone
        clone.classList.add('handoff-card')
        card.style.visibility = 'hidden'
        g.style.pointerEvents = 'none'

        const cardRect = rectOf(card)
        const gridRect = rectOf(g)
        // Its own size, dead centre of the screen — a fixed screen rect, so the
        // box parks instead of being carried along by the scroll behind it.
        const parked = centerRect(window.innerWidth, window.innerHeight, cardRect.w, cardRect.h)

        // The resize is keyed to the calendar's arrival, not to a fixed cut:
        // it begins at the scroll offset where the grid's top crosses the
        // bottom of the viewport, as a fraction of this trigger's own range.
        const span = self.end - self.start
        const gridY = gridRect.y + window.scrollY - window.innerHeight
        const raw = span > 0 ? (gridY - self.start) / span : 0.7
        const resize = Math.min(Math.max(raw, MOVE_END + 0.08), 0.88)

        let rect = parked
        let text = 1
        let gridFade = 0
        if (p < MOVE_END) {
          // ease-in: crawls off the mark, then accelerates into the centre.
          const t = p / MOVE_END
          rect = lerpRect(cardRect, parked, t * t)
        } else if (p < resize) {
          // Parked and motionless; the card's own text dissolves off it over
          // the tail of the hold, so an empty lit box is what grows.
          text = 1 - Math.min((p - MOVE_END) / (resize - MOVE_END) / 0.7, 1)
        } else if (p < 0.94) {
          rect = lerpRect(parked, gridRect, (p - resize) / (0.94 - resize))
          text = 0
        } else {
          rect = gridRect
          text = 0
          gridFade = (p - 0.94) / 0.06
        }

        placeAt(clone, rect)
        Array.from(clone.children).forEach((c) => {
          ;(c as HTMLElement).style.opacity = String(text)
        })
        const neon = Math.min(p / (MOVE_END * 0.4), 1)
        clone.style.boxShadow = `0 0 ${18 * neon}px ${6 * neon}px rgba(42,161,254,${0.55 * neon})`
        clone.style.opacity = String(1 - gridFade)
        g.style.opacity = String(gridFade)
      },
    })

    return () => {
      drive.kill()
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
