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
  // Same pin-then-release shape as Handoff A: the tree is pinned for a short
  // "지정" beat (the card glows in place), then the card decouples into a
  // clone that settles onto the viewport's vertical midline and *holds* there
  // while the page keeps scrolling behind it — that hold is what makes the
  // box read as the centre of the screen. Its horizontal centre never moves,
  // so nothing pans sideways; only once the box is parked does it shed its
  // text and grow into the grid.
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
        const g = grid()
        if (!g || p <= 0 || p >= 1) {
          release()
          return
        }

        const span = self.end - self.start
        const pinEnd = span > 0 ? Math.min(pinPx() / span, 0.5) : 0

        if (p < pinEnd) {
          // Still pinned: the card is designated in place, no clone yet.
          clone?.remove()
          clone = null
          card.style.visibility = ''
          g.style.opacity = ''
          g.style.pointerEvents = ''
          const t = pinEnd > 0 ? p / pinEnd : 1
          card.style.boxShadow = `0 0 ${18 * t}px ${6 * t}px rgba(42,161,254,${0.55 * t})`
          return
        }

        // Every window is cut from whatever is left after the pin, so none of
        // them can collapse to zero width however long the pin turns out.
        const rest = 1 - pinEnd
        const dropEnd = pinEnd + rest * 0.42
        const holdEnd = pinEnd + rest * 0.62
        const growEnd = pinEnd + rest * 0.86

        if (!clone) clone = cloneInto(stage, card).clone
        clone.classList.add('handoff-card')
        card.style.visibility = 'hidden'
        g.style.pointerEvents = 'none'

        const cardRect = rectOf(card)
        const gridRect = rectOf(g)
        // Vertically centred, horizontally exactly where the card already is:
        // a fixed screen rect, so the clone parks instead of being dragged
        // along by the scroll the way a document-space target would.
        const hold = {
          x: cardRect.x,
          y: window.innerHeight / 2 - cardRect.h / 2,
          w: cardRect.w,
          h: cardRect.h,
        }

        let rect = hold
        let text = 1
        let gridFade = 0
        if (p < dropEnd) {
          rect = lerpRect(cardRect, hold, (p - pinEnd) / (dropEnd - pinEnd))
        } else if (p < holdEnd) {
          // Parked dead centre; the card's own text dissolves off it.
          text = 1 - (p - dropEnd) / (holdEnd - dropEnd)
        } else if (p < growEnd) {
          rect = lerpRect(hold, gridRect, (p - holdEnd) / (growEnd - holdEnd))
          text = 0
        } else {
          rect = gridRect
          text = 0
          gridFade = (p - growEnd) / (1 - growEnd)
        }

        placeAt(clone, rect)
        Array.from(clone.children).forEach((c) => {
          ;(c as HTMLElement).style.opacity = String(text)
        })
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
