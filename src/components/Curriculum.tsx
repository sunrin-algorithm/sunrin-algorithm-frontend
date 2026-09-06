import { useEffect, useRef, useState } from 'react'
import { CURRICULUM } from '../content'
import { WALK_VH, treeHoldStart } from './Activities'
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
      start: 'top 110%',
      end: 'top -10%',
      scrub: 0.6,
      onUpdate: (self) => {
        const next = Math.round(self.progress * (TOTAL_CELLS - SURVIVORS))
        setDrain((prev) => (prev === next ? prev : next))
      },
    })

    return () => trigger.kill()
  }, [])

  // Handoff B: Activities' "정규 수업" card becomes this section's calendar.
  // The card peels off the tree while the tree is still pinned, eases (slow,
  // then quickening) out to the dead centre of the screen and stops there —
  // held by a fixed screen rect, not by a pin, so the tree, the copy and the
  // rest of the page keep travelling up past it. It sheds its own text on the
  // way, then grows into the calendar, which pins for a short beat of its own
  // so the box has something standing still to land on.
  useEffect(() => {
    const el = table.current
    if (!el || reduceMotion()) return

    const card = document.querySelector<HTMLElement>('.activity-item:first-child')
    const section = document.getElementById('activity')
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

    /** Beat lengths in viewport heights: travel, resize, crossfade. */
    const MOVE = 0.6
    const GROW = 0.55
    const FADE = 0.25

    // 달력 아주 조금만 고정: just long enough for the box to finish becoming it.
    const lock = ScrollTrigger.create({
      trigger: el,
      start: 'center center',
      end: () => `+=${window.innerHeight * 0.4}`,
      pin: true,
      anticipatePin: 1,
      refreshPriority: 1,
    })

    const drive = ScrollTrigger.create({
      // Anchored on the activity section itself, never on anything inside the
      // pinned tree -- a trigger inside a pin measures as a screen position.
      // Deliberately wide; every boundary below is live geometry.
      trigger: section ?? card,
      start: 'top top',
      end: () => `+=${window.innerHeight * 6}`,
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress
        const g = grid()
        const span = self.end - self.start
        if (!g || p <= 0 || span <= 0) {
          release()
          return
        }

        const vh = window.innerHeight
        /** A document scroll offset as a fraction of this trigger's range. */
        const at = (y: number) => (y - self.start) / span

        // The card cannot peel off until the last branch of the walk has drawn.
        const begin = at(treeHoldStart() + vh * WALK_VH)
        if (!treeHoldStart() || p < begin) {
          release()
          return
        }
        const moveEnd = begin + (vh * MOVE) / span
        // The landing is the calendar's own pin: the box finishes becoming the
        // grid on the frame the grid stops moving.
        const land = Math.min(at(lock.start), 0.999)
        const grow = Math.max(land - (vh * GROW) / span, moveEnd + 0.01)
        const gone = land + (vh * FADE) / span

        if (p >= gone) {
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
        const parked = centerRect(window.innerWidth, vh, cardRect.w, cardRect.h)

        let rect = parked
        let text = 1
        let gridFade = 0
        if (p < moveEnd) {
          // ease-in: crawls off the mark, then accelerates into the centre.
          const t = (p - begin) / (moveEnd - begin)
          rect = lerpRect(cardRect, parked, t * t)
        } else if (p < grow) {
          // Parked and motionless; the card's own text dissolves off it over
          // the tail of the hold, so an empty lit box is what grows.
          text = 1 - Math.min((p - moveEnd) / (grow - moveEnd) / 0.7, 1)
        } else if (p < land) {
          rect = lerpRect(parked, gridRect, (p - grow) / (land - grow))
          text = 0
        } else {
          rect = gridRect
          text = 0
          gridFade = (p - land) / (gone - land)
        }

        placeAt(clone, rect)
        Array.from(clone.children).forEach((c) => {
          ;(c as HTMLElement).style.opacity = String(text)
        })
        const neon = Math.min((p - begin) / ((moveEnd - begin) * 0.4), 1)
        clone.style.boxShadow = `0 0 ${18 * neon}px ${6 * neon}px rgba(42,161,254,${0.55 * neon})`
        clone.style.opacity = String(1 - gridFade)
        g.style.opacity = String(gridFade)
      },
    })

    return () => {
      drive.kill()
      lock.kill()
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
