import { useEffect, useRef, useState } from 'react'
import { CURRICULUM } from '../content'
import { PEEL_AT_VH, treeHoldEnd, treeHoldStart } from './Activities'
import { centerRect, cloneInto, lerpRect, placeAt, rectOf } from '../lib/handoff'
import { SETTLE_VH, ScrollTrigger, fitStart, reduceMotion, registerDoneAt } from '../lib/motion'
import DpGrid from './DpGrid'
import Section from './Section'

export default function Curriculum() {
  const table = useRef<HTMLDivElement>(null)
  const [fillProgress, setFillProgress] = useState(0)

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
    // The formula, the FILLED counter and the note under them all explain the
    // calendar, so they arrive with it rather than sitting under an empty space
    // waiting for it.
    const blurbs = () => el.querySelectorAll<HTMLElement>('.dp-legend, .curriculum-note')
    const fadeBlurbs = (o: string) => blurbs().forEach((b) => (b.style.opacity = o))
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
      fadeBlurbs('')
    }

    /** Beat lengths in viewport heights: travel, park, resize, crossfade, the
        grid filling itself in, and the extra the finished calendar lingers on
        top of the shared settle. Only the park is capped rather than left to
        soak up whatever's left — see `begin` below for where that goes instead. */
    const MOVE = 0.6
    const PARK = 0.4
    const GROW = 0.55
    const FADE = 0.2
    const FILL = 0.5
    const LINGER = 0.4
    const LOCK_VH = FADE + FILL + LINGER + SETTLE_VH

    // Grid, not just the table, so the section's index rides along with it,
    // and so the pin fits the whole grid on screen rather than just the table.
    const sectionGrid = el.closest<HTMLElement>('.section-grid') ?? el

    // Held long enough for the box to finish becoming the calendar, for the
    // grid to fill itself in while it stands there, and for the settle after.
    const lock = ScrollTrigger.create({
      trigger: sectionGrid,
      start: fitStart(sectionGrid),
      end: () => `+=${window.innerHeight * LOCK_VH}`,
      pin: sectionGrid,
      anticipatePin: 1,
      refreshPriority: 3,
      // The dp grid's own fill rides this pin's progress instead of a magic
      // scroll-percentage trigger of its own: it starts the frame the
      // crossfade finishes (at FADE/LOCK_VH) and runs for FILL/LOCK_VH more.
      onUpdate: (self) => {
        const t = (self.progress * LOCK_VH - FADE) / FILL
        setFillProgress(Math.min(Math.max(t, 0), 1))
      },
    })
    const unregisterDone = registerDoneAt(
      'curriculum',
      () => lock.start + window.innerHeight * (FADE + FILL),
    )

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

        if (!treeHoldStart()) {
          release()
          return
        }

        // The card cannot peel off until the last branch of the walk has drawn
        // and the finished tree has held still for its settle, and it must
        // start early enough that travel + park + grow still lands exactly on
        // the calendar's own pin. Whatever slack is left between those two
        // bounds is spent here, before the peel starts and while the tree
        // just sits pinned already fully drawn, rather than in the park —
        // that's what keeps the box's own stand-still capped at PARK.
        const peelEarliest = treeHoldStart() + vh * PEEL_AT_VH
        const wantBegin = lock.start - vh * (MOVE + PARK + GROW)
        const beginDoc = Math.min(Math.max(peelEarliest, wantBegin), treeHoldEnd() - vh * 0.2)
        const begin = at(beginDoc)
        if (p < begin) {
          release()
          return
        }
        const moveEnd = begin + (vh * MOVE) / span
        // The landing is the calendar's own pin: the box finishes becoming the
        // grid on the frame the grid stops moving.
        const land = Math.min(at(lock.start), 0.999)
        const parkEnd = Math.min(moveEnd + (vh * PARK) / span, land - 0.001)
        const grow = Math.max(parkEnd, moveEnd + 0.01)
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
        fadeBlurbs(String(gridFade))
      },
    })

    return () => {
      unregisterDone()
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
          <DpGrid
            rows={CURRICULUM.rows}
            cols={CURRICULUM.cols}
            cells={CURRICULUM.cells}
            progress={fillProgress}
          />
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
