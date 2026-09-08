import { useEffect, useRef } from 'react'
import { CURRICULUM } from '../content'
import { treeHoldEnd, treeHoldStart } from './Activities'
import type { Rect } from '../lib/handoff'
import { centerRect, cloneInto, lerpRect, pinShift, placeAt, rectOf } from '../lib/handoff'
import { ScrollTrigger, fitStart, reduceMotion, registerDoneAt } from '../lib/motion'
import DpGrid from './DpGrid'
import Section from './Section'

/** The merge's three beats -- the tree dissolving off its four cards, the cards
    sliding flush into one long bar, the bar resizing into the calendar -- as
    fractions of the scroll between the tree's pin and the calendar's. Fractions
    rather than viewport heights so the choreography always fills exactly the
    room the layout gives it: any fixed budget either overruns that gap or
    leaves slack in it, and slack in the middle of a merge is a bar sitting
    still on screen, which is the stop this is meant to avoid. The resize takes
    whatever the other two leave. */
const TREE = 0.18
const MERGE = 0.42

/** The landing, in viewport heights of the calendar's own pin: the crossfade
    onto the real grid, then a beat of the finished calendar standing still. */
const FADE = 0.14
const HOLD = 0.36
const LOCK_VH = FADE + HOLD

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/** Column `i` of 4 inside `box` — the bar is four abutting slices, so the same
    split describes it whether it is card-shaped or calendar-shaped. Every slice
    but the last runs 1px long: abutting them exactly leaves a sub-pixel sliver
    of the page showing between each pair, which reads as a seam in what is
    supposed to be one solid rectangle. The overlap hides under the next slice,
    which paints after it. */
const slot = (box: Rect, i: number): Rect => ({
  x: box.x + (i * box.w) / 4,
  y: box.y,
  w: box.w / 4 + (i < 3 ? 1 : 0),
  h: box.h,
})

export default function Curriculum() {
  const table = useRef<HTMLDivElement>(null)

  // The merge: 활동's four cards become this section's calendar without either
  // section moving. The finished tree dissolves off them, they slide sideways
  // into a single long rectangle at the centre of the screen, that rectangle
  // resizes into the calendar's shape, and only then does the real section
  // fade up underneath.
  useEffect(() => {
    const el = table.current
    if (!el || reduceMotion()) return

    const stage = document.getElementById('stage')
    const section = document.getElementById('activity')
    const cards = [...document.querySelectorAll<HTMLElement>('#activity .activity-item')]
    // Grid, not just the table, so the pin fits the whole section on screen
    // rather than just the table.
    const sectionGrid = el.closest<HTMLElement>('.section-grid') ?? el
    if (!stage || !section || cards.length !== 4) return

    // The scroll box, not the grid inside it: on a container too narrow for the
    // table it is the box that is actually on screen, scrollbar and all, so it
    // is both what the bar should resize into and what has to stay hidden until
    // it does.
    const box = () => el.querySelector<HTMLElement>('.dp-scroll')
    /** Everything of 커리큘럼 that must not be on screen before the bar becomes
        it — the whole section, in other words. */
    const veil = () => [
      ...sectionGrid.querySelectorAll<HTMLElement>('.section-body'),
      ...el.querySelectorAll<HTMLElement>('.dp-scroll'),
    ]
    const setVeil = (o: string) => veil().forEach((n) => (n.style.opacity = o))
    // Everything the tree drew, which has to be gone before the cards move:
    // edges pointing at cards that are no longer there read as broken.
    const treeBits = () =>
      section.querySelectorAll<HTMLElement>('.activity-edges, .activity-node, .activity-stack')

    /**
     * 's rect as it sits while the activity grid is pinned — the merge's
     * one fixed reference, in viewport space.
     *
     * Read live and corrected rather than snapshotted when the clones are made.
     * A snapshot is only right if it happens to be taken while the grid is
     * pinned, which is true going down and false coming back up: re-entering
     * the merge from below, the real cards are hundreds of pixels above the
     * viewport, so the un-merge would lerp the boxes off the top of the page
     * and leave nothing on screen to hand back to the tree. Undoing the pin's
     * own translation instead makes the reference the same in both directions.
     */
    const pinnedRect = (node: HTMLElement): Rect => {
      const start = treeHoldStart()
      const c = rectOf(node)
      return {
        ...c,
        y: c.y + window.scrollY - pinShift(window.scrollY, start, treeHoldEnd()) - start,
      }
    }

    // --line is opaque now, so the clone's border reads fine floating over
    // #stage as-is; only the inner seams fade, down to 0 width. Fading the
    // colour's alpha instead left the inner border a different colour than
    // the always-opaque top/bottom border, and a browser miters mismatched
    // border colours into a visible diagonal split at the shared corner.
    const edgeColor = getComputedStyle(cards[0]).borderTopColor
    const edgeWidth = parseFloat(getComputedStyle(cards[0]).borderTopWidth) || 0
    let clones: HTMLElement[] = []

    const dropCards = () => {
      clones.forEach((c) => c.remove())
      clones = []
      cards.forEach((c) => (c.style.visibility = ''))
      const b = box()
      if (b) b.style.pointerEvents = ''
      setVeil('')
    }

    const release = () => {
      dropCards()
      treeBits().forEach((n) => (n.style.opacity = ''))
    }

    // Held just long enough for the crossfade and for the finished calendar
    // to stand still for a beat afterwards.
    const lock = ScrollTrigger.create({
      trigger: sectionGrid,
      start: fitStart(sectionGrid),
      end: () => `+=${window.innerHeight * LOCK_VH}`,
      pin: sectionGrid,
      anticipatePin: 1,
      refreshPriority: 3,
    })
    const unregisterDone = registerDoneAt(
      'curriculum',
      () => lock.start + window.innerHeight * LOCK_VH,
    )

    const drive = ScrollTrigger.create({
      // Anchored on the activity section itself, never on anything inside the
      // pinned tree -- a trigger inside a pin measures as a screen position.
      // Deliberately wide; every boundary below is live geometry.
      trigger: section,
      start: 'top top',
      end: () => `+=${window.innerHeight * 6}`,
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress
        const b = box()
        const span = self.end - self.start
        if (!b || p <= 0 || span <= 0 || !treeHoldStart()) return release()

        // Narrow layouts run the four cards down a rail instead of across a
        // row, so there is no row to close up into a bar. They just scroll and
        // the calendar arrives on its own.
        const r = cards.map(rectOf)
        if (Math.abs(r[0].y - r[3].y) > 4) return release()

        const vh = window.innerHeight
        const vw = window.innerWidth
        /** A document scroll offset as a fraction of this trigger's range. */
        const at = (y: number) => (y - self.start) / span

        // The merge runs the whole way from the frame the tree stops walking to
        // the frame the calendar stops moving, with nothing held in between.
        const begin = at(treeHoldStart())
        const land = Math.min(at(lock.start), 0.999)
        const run = land - begin
        const gone = land + (vh * FADE) / span
        if (run <= 0 || p < begin || p >= gone) return release()

        const treeGone = begin + run * TREE
        treeBits().forEach(
          (n) => (n.style.opacity = String(1 - clamp01((p - begin) / (treeGone - begin)))),
        )

        // The resize starts the instant the bar closes up: no pause between.
        const grow = begin + run * (TREE + MERGE)

        let gridFade = 0
        if (p < treeGone) {
          dropCards()
        } else {
          if (!clones.length) {
            clones = cards.map((c) => {
              const cl = cloneInto(stage, c).clone
              cl.classList.add('handoff-card')
              return cl
            })
          }
          // Same y/h for all 4: the cards share one grid row and are meant to
          // be identical there, but getBoundingClientRect gives each its own
          // sub-pixel rounding -- lerping from 4 slightly different heights
          // toward the same bar opened a triangular gap at the top/bottom
          // border that closed only right as the merge finished.
          const rawSrc = cards.map(pinnedRect)
          const src = rawSrc.map((r) => ({ ...r, y: rawSrc[0].y, h: rawSrc[0].h }))
          const bar = centerRect(
            vw,
            vh,
            src.reduce((sum, c) => sum + c.w, 0),
            src[0].h,
          )
          const boxRect = rectOf(b)
          cards.forEach((c) => (c.style.visibility = 'hidden'))
          b.style.pointerEvents = 'none'

          let boxes: Rect[]
          let text = 0
          let seam = 1
          if (p < grow) {
            // ease-out: they come off their marks at speed and settle together.
            const t = (p - treeGone) / (grow - treeGone)
            const e = 1 - (1 - t) * (1 - t)
            boxes = src.map((c, i) => lerpRect(c, slot(bar, i), e))
            text = 1 - clamp01(t / 0.7)
            seam = clamp01(t / 0.85)
          } else if (p < land) {
            boxes = src.map((_, i) =>
              lerpRect(slot(bar, i), slot(boxRect, i), (p - grow) / (land - grow)),
            )
          } else {
            boxes = src.map((_, i) => slot(boxRect, i))
            gridFade = (p - land) / (gone - land)
          }

          clones.forEach((cl, i) => {
            placeAt(cl, boxes[i])
            Array.from(cl.children).forEach((c) => {
              ;(c as HTMLElement).style.opacity = String(text)
            })
            cl.style.borderColor = edgeColor
            // Four boxes have to read as one long rectangle once they touch, so
            // the borders where they meet shrink away as the gaps close.
            if (i > 0) cl.style.borderLeftWidth = `${edgeWidth * (1 - seam)}px`
            if (i < 3) cl.style.borderRightWidth = `${edgeWidth * (1 - seam)}px`
            cl.style.opacity = String(1 - gridFade)
          })
          setVeil(String(gridFade))
        }
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
      label="커리큘럼"
      bleed={
        <div className="curriculum-table" ref={table}>
          <DpGrid rows={CURRICULUM.rows} cols={CURRICULUM.cols} cells={CURRICULUM.cells} />
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
