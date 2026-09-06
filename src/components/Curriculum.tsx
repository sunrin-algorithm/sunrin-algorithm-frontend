import { useEffect, useRef, useState } from 'react'
import { CURRICULUM } from '../content'
import { cloneInto, lerpRect, placeAt, rectOf, sizedAt } from '../lib/handoff'
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

  // Handoff B: Activities' "정규 수업" card descends into this section's
  // calendar. Same pin-then-release shape as Handoff A — the whole activity
  // tree is pinned for a short "지정" beat (a glow on the card in place),
  // then released: the tree scrolls on while the card decouples into a clone
  // that first only moves (own size, riding to the grid's center) and only
  // afterwards resizes onto the grid — never both at once.
  useEffect(() => {
    const el = table.current
    if (!el || reduceMotion()) return

    const tree = document.querySelector<HTMLElement>('.activity-tree')
    const card = document.querySelector<HTMLElement>('.activity-item:first-child')
    const stage = document.getElementById('stage')
    const grid = () => el.querySelector<HTMLElement>('.dp')
    if (!tree || !card || !stage) return

    let clone: HTMLElement | null = null

    const release = () => {
      clone?.remove()
      clone = null
      card.style.boxShadow = ''
      card.style.visibility = ''
      const g = grid()
      if (g) {
        g.style.opacity = ''
        g.style.pointerEvents = ''
      }
    }

    const PIN_FRAC = 0.85
    const pinPx = () => window.innerHeight * PIN_FRAC

    const pin = ScrollTrigger.create({
      trigger: tree,
      start: 'center center',
      end: () => `+=${pinPx()}`,
      pin: true,
      refreshPriority: 1,
    })

    const drive = ScrollTrigger.create({
      trigger: tree,
      start: 'center center',
      endTrigger: el,
      end: 'top 45%',
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress
        const span = self.end - self.start
        const pinFrac = span > 0 ? Math.min(pinPx() / span, 0.5) : 0
        const g = grid()

        if (!g || p <= 0 || p >= 1) {
          release()
          return
        }

        if (p < pinFrac) {
          // Still pinned: the card glows in place, no clone yet.
          clone?.remove()
          clone = null
          card.style.visibility = ''
          g.style.opacity = ''
          g.style.pointerEvents = ''
          const local = pinFrac > 0 ? p / pinFrac : 1
          card.style.boxShadow = `0 0 ${18 * local}px ${6 * local}px rgba(42,161,254,${0.55 * local})`
          return
        }

        if (!clone) clone = cloneInto(stage, card).clone
        clone.classList.add('handoff-card')
        card.style.visibility = 'hidden'
        g.style.pointerEvents = 'none'

        const cardRect = rectOf(card)
        const gridRect = rectOf(g)
        const atGrid = sizedAt(cardRect, gridRect)

        let rect = cardRect
        let gridFade = 0
        if (p < 0.62) {
          // Descend only: own size, riding to the grid's center.
          const t = (p - pinFrac) / (0.62 - pinFrac)
          rect = sizedAt(cardRect, lerpRect(cardRect, gridRect, t))
        } else if (p < 0.88) {
          // Resize only: center held, size grows onto the grid.
          const t = (p - 0.62) / (0.88 - 0.62)
          rect = lerpRect(atGrid, gridRect, t)
        } else {
          rect = gridRect
          gridFade = (p - 0.88) / 0.12
        }

        placeAt(clone, rect)
        clone.style.boxShadow = '0 0 18px 6px rgba(42,161,254,0.55)'
        clone.style.opacity = String(1 - gridFade)
        g.style.opacity = String(gridFade)
      },
    })

    return () => {
      pin.kill()
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
