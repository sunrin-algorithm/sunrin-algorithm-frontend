import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ACTIVITIES, ACTIVITY_BRANCHES } from '../content'
import { centerRect, cloneInto, lerpRect, placeAt, rectOf } from '../lib/handoff'
import { SETTLE_VH, ScrollTrigger, fitStart, reduceMotion, registerDoneAt } from '../lib/motion'
import { dfsOrder, parentOf, pathToRoot } from '../lib/tree'
import { aboutHoldStart } from './About'
import Section from './Section'

/**
 * Seven nodes: a root, two branches, and the four cards as leaves — card `i` is
 * node `3 + i`. So the badges are real pre-order positions (03, 04, 06, 07) and
 * the branches take 02 and 05 on the way down.
 */
const N = 7
const WALK = dfsOrder(N)
const ORDER = new Map(WALK.map((id, k) => [id, k + 1]))
const EDGES = [1, 2, 3, 4, 5, 6].map((id) => ({ from: parentOf(id) as number, to: id }))

/** Only the fixed 7-node shape can be drawn; any other count falls back to a plain grid. */
const DRAW = ACTIVITIES.length === 4

/** Scroll length of the DFS walk, in viewport heights. */
const WALK_VH = 0.9

/** Length of the beat where Curriculum's card peels off the finished tree. */
const PEEL_VH = 0.6

/** How far into the tree's hold Curriculum's card may start peeling off: after
    the walk has drawn every branch, and after the finished tree has held still
    for its settle. Curriculum reads this. */
export const PEEL_AT_VH = WALK_VH + SETTLE_VH

/** Total length of the tree's hold — walk, settle, peel. Pinned for all of it. */
const HOLD_VH = PEEL_AT_VH + PEEL_VH

/** Where the tree's pin engages, and where it lets go. Handoff A lands its
    point on the start and Curriculum keys Handoff B's clamp off the end; both
    would otherwise have to measure a trigger inside a pinned element, which
    reads as a screen position, not a document one.
    ponytail: module singleton -- the page only ever has one Activities. */
let treeHold: ScrollTrigger | null = null
export const treeHoldStart = () => treeHold?.start ?? 0
export const treeHoldEnd = () => treeHold?.end ?? 0

const labelOf = (id: number) =>
  id === 0 ? '활동' : id < 3 ? ACTIVITY_BRANCHES[id - 1] : ACTIVITIES[id - 3].title

const orderOf = (id: number) => ORDER.get(id) as number
const pad = (n: number) => String(n).padStart(2, '0')

type Pt = { x: number; y: number }
type Layout = { rail: boolean; pt: Pt[] }

export default function Activities() {
  const wrap = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const [layout, setLayout] = useState<Layout | null>(null)
  const [visited, setVisited] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  /**
   * The edges are measured off the real card rects, so the drawing follows
   * whatever the grid did. The reserved gutter is also what tells us which
   * layout CSS picked: wide screens fan out downwards over a single row of 4
   * leaves, narrow ones run the traversal down a rail on the left.
   */
  const measure = useCallback(() => {
    const w = wrap.current?.getBoundingClientRect()
    const l = list.current?.getBoundingClientRect()
    const cards = [...(list.current?.querySelectorAll<HTMLElement>('.activity-item') ?? [])]
    if (!w || !l || cards.length !== 4) return

    const head = l.top - w.top
    const gut = l.left - w.left
    const rail = gut > 4
    const r = cards.map((c) => c.getBoundingClientRect())
    const pt: Pt[] = new Array(N)

    if (rail) {
      // Each branch sits in the gap above its first card, indented by depth.
      const badge = cards.map((c) => c.querySelector('.head') as HTMLElement)
      cards.forEach((_, i) => {
        const b = badge[i].getBoundingClientRect()
        pt[3 + i] = { x: gut, y: b.top + b.height / 2 - w.top }
      })
      pt[0] = { x: gut * 0.26, y: head * 0.26 }
      pt[1] = { x: gut * 0.56, y: head * 0.74 }
      pt[2] = { x: gut * 0.56, y: r[2].top - w.top - (r[2].top - r[1].bottom) * 0.5 }
    } else {
      // One row of 4 leaves: branch1 gathers cards 0-1, branch2 gathers 2-3,
      // root sits above the midpoint of both branches.
      r.forEach((c, i) => {
        pt[3 + i] = { x: c.left - w.left + c.width / 2, y: c.top - w.top }
      })
      pt[1] = { x: (pt[3].x + pt[4].x) / 2, y: head * 0.62 }
      pt[2] = { x: (pt[5].x + pt[6].x) / 2, y: head * 0.62 }
      pt[0] = { x: (pt[1].x + pt[2].x) / 2, y: head * 0.18 }
    }

    setLayout((prev) =>
      prev && prev.rail === rail && prev.pt.every((p, i) => p.x === pt[i].x && p.y === pt[i].y)
        ? prev
        : { rail, pt },
    )
  }, [])

  useLayoutEffect(() => {
    if (!DRAW || !wrap.current) return
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap.current)
    // Korean webfonts land after first paint and move every card.
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [measure])

  // The tree holds still while it unfolds: once its root reaches the centre of
  // the screen the whole thing pins there, the walk runs, Curriculum's card
  // peels off it, and only then does it let go and scroll away. The pin spacer
  // is also what buys the scroll length for all of that.
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    if (reduceMotion()) {
      setVisited(N)
      return
    }
    // The whole section grid, not just the tree: the section's own [02] index
    // is a sibling of the body, so pinning the body alone would leave the
    // number to scroll off on its own. Pinning the grid at a fit-clamped start
    // (rather than centering the root node inside it) is also what keeps every
    // card on screen once the grid is taller than the viewport.
    const grid = el.closest<HTMLElement>('.section-grid') ?? el

    const pin = ScrollTrigger.create({
      trigger: grid,
      start: fitStart(grid),
      end: () => `+=${window.innerHeight * HOLD_VH}`,
      pin: grid,
      anticipatePin: 1,
      // Both pins must refresh before anything below them measures, earliest
      // first, or GSAP sizes later triggers as if the spacers were not there.
      refreshPriority: 4,
      // The walk rides the pin's own progress instead of a second trigger: a
      // separate one would have to measure something inside the pin, which
      // reads as a screen position rather than a document one.
      onUpdate: (self) =>
        setVisited(Math.round(Math.min((self.progress * HOLD_VH) / WALK_VH, 1) * N)),
    })
    treeHold = pin
    const unregister = registerDoneAt('activity', () => pin.start + window.innerHeight * WALK_VH)

    return () => {
      treeHold = null
      unregister()
      pin.kill()
    }
  }, [layout])

  // Handoff A: the "연구 활동" chip inside About's lead paragraph.
  //   1. 소개 comes to its brief stop and a highlight wipe crosses the live
  //      chip in place, still in its sentence, with nothing moving under it;
  //   2. it decouples into a clone, blows up, and flies to the centre of the
  //      screen, where it parks while 소개 lets go and travels up past it;
  //   3. it shrinks back down to a point, timed to land exactly as the tree's
  //      root reaches that same centre and the tree pins there.
  useEffect(() => {
    if (!DRAW || reduceMotion()) return
    const lead = document.querySelector<HTMLElement>('.about-lead')
    const chip = document.querySelector<HTMLElement>('.chip-seed')
    const stage = document.getElementById('stage')
    const tree = wrap.current
    const root = tree?.querySelector<HTMLElement>('[data-node="0"]')
    if (!lead || !chip || !stage || !tree || !root) return

    // Read once: the clone is reparented into #stage, where it would otherwise
    // inherit the stage font rather than the lead paragraph's.
    const baseFont = parseFloat(getComputedStyle(chip).fontSize)

    let clone: HTMLElement | null = null

    const release = () => {
      clone?.remove()
      clone = null
      chip.style.background = ''
      chip.style.color = ''
      chip.style.visibility = ''
      root.style.visibility = ''
    }

    // Lengths of the beats, in viewport heights. The shrink is what's left
    // over: whatever distance sits between 소개 and the tree, past the wipe,
    // fly and the (capped) park, is spent shrinking rather than standing still.
    const WIPE = 0.4
    const FLY = 0.5
    const PARK = 0.2

    const drive = ScrollTrigger.create({
      // The section, never the paragraph inside it: 소개's own pin is applied
      // first, and anything inside a pin measures as a screen position.
      // Deliberately long. Every boundary below is a live document offset
      // converted into a fraction of this range, so the end only has to be
      // comfortably past the point where the tree takes over.
      trigger: document.getElementById('about') ?? lead,
      start: 'top top',
      end: () => `+=${window.innerHeight * 4}`,
      scrub: 0.8,
      onUpdate: (self) => {
        const p = self.progress
        const span = self.end - self.start
        if (p <= 0 || span <= 0) {
          release()
          return
        }

        const vw = window.innerWidth
        const vh = window.innerHeight
        /** A document scroll offset as a fraction of this trigger's range. */
        const at = (y: number) => (y - self.start) / span

        // Nothing lights up until 소개 has stopped: the wipe wants a sentence
        // that is standing still.
        const begin = at(aboutHoldStart())
        if (!aboutHoldStart() || p < begin) {
          release()
          return
        }
        const wipeEnd = begin + (vh * WIPE) / span

        if (p < wipeEnd) {
          // Still inline: a highlight wipe crosses the chip where it stands,
          // drifting up with its own paragraph.
          clone?.remove()
          clone = null
          root.style.visibility = ''
          chip.style.visibility = ''
          const local = (p - begin) / (wipeEnd - begin)
          const pct = (local * 100).toFixed(1)
          chip.style.background = `linear-gradient(to right, var(--point) ${pct}%, transparent ${pct}%)`
          chip.style.color = local >= 0.98 ? '#fff' : ''
          return
        }

        // The shrink has to end on the frame the tree's pin engages, so the
        // point and the root node are never both in flight.
        const landing = treeHold?.start || self.start + vh * 2
        const finish = Math.min(at(landing), 0.999)
        const flyEnd = Math.min(wipeEnd + (vh * FLY) / span, finish)
        const parkEnd = Math.min(flyEnd + (vh * PARK) / span, finish - 0.001)
        const shrink = Math.max(parkEnd, flyEnd + 0.01)

        if (p >= finish) {
          release()
          return
        }

        const rootRect = rectOf(root)
        if (!clone) {
          clone = cloneInto(stage, chip).clone
          // cloneNode copies the wipe's inline gradient, which never quite
          // reaches 100% before this frame -- the box it's becoming is solid.
          clone.style.background = ''
        }
        clone.classList.add('handoff-chip')
        chip.style.visibility = 'hidden'
        root.style.visibility = 'hidden'

        const chipRect = rectOf(chip)
        // Blown up and parked dead centre of the screen. A fixed screen rect,
        // so it parks instead of being dragged along by the scroll behind it.
        // At reading size a lone box mid-viewport reads as a stray tooltip, so
        // it grows -- bounded so it can never outgrow a narrow screen.
        const scale = Math.min(2.6, (vw * 0.74) / chipRect.w)
        const parked = centerRect(vw, vh, chipRect.w * scale, chipRect.h * scale)

        let rect = parked
        let neon = 1
        let textFade = 0
        let fade = 0
        if (p < flyEnd) {
          const t = (p - wipeEnd) / (flyEnd - wipeEnd)
          rect = lerpRect(chipRect, parked, t)
          neon = Math.min(t / 0.4, 1)
        } else if (p >= shrink) {
          // Down to the root node's own 11px, tracked live: on wide screens
          // that lands on the very centre point the box is parked at, on the
          // narrow rail layout it lands wherever the rail put the root.
          const t = (p - shrink) / (finish - shrink)
          rect = lerpRect(parked, rootRect, t)
          textFade = Math.min(t / 0.6, 1)
          fade = Math.max((t - 0.88) / 0.12, 0)
        }

        placeAt(clone, rect)
        // The type tracks the box exactly, so the padding (set in em) does too.
        clone.style.fontSize = `${baseFont * (rect.w / chipRect.w)}px`
        clone.style.color = `rgba(255,255,255,${1 - textFade})`
        clone.style.boxShadow = `0 0 ${18 * neon}px ${6 * neon}px rgba(42,161,254,${0.55 * neon})`
        clone.style.opacity = String(1 - fade)
      },
    })

    return () => {
      drive.kill()
      release()
    }
  }, [layout])

  const done = visited >= N
  // Mid-walk the cursor is the DFS itself; once it rests, hovering drives it.
  const cursor = hover ?? (done || visited === 0 ? null : WALK[visited - 1])
  const stack = cursor === null ? null : pathToRoot(cursor)
  const lit = new Set(stack ?? [])

  return (
    <Section id="activity" n="02" label="활동">
      <p className="activity-stack pixel">
        <span className={`dot${visited > 0 ? ' is-on' : ''}`} />
        {stack ? (
          <>
            <span className="key">stack</span>
            {stack.map((id) => (
              <span key={id} className="frame">
                {labelOf(id)}
              </span>
            ))}
          </>
        ) : (
          <>
            <span className="key">visited</span>
            <span>
              {pad(visited)} / {pad(N)}
            </span>
            <span className="hover-hint">— 카드에 커서를 올리면 뿌리까지 경로가 보입니다</span>
          </>
        )}
      </p>

      <div className={DRAW ? 'activity-tree' : undefined} ref={wrap}>
        {DRAW && layout && (
          <>
            <svg className="activity-edges" aria-hidden="true">
              {EDGES.map((e) => {
                const a = layout.pt[e.from]
                const b = layout.pt[e.to]
                const mid = (a.y + b.y) / 2
                const walked = visited >= orderOf(e.to)
                return (
                  <path
                    key={e.to}
                    className={`tree-edge${walked ? ' is-walked' : ''}${
                      lit.has(e.to) ? ' is-path' : ''
                    }`}
                    d={`M ${a.x} ${a.y} C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y}`}
                    pathLength={1}
                    style={{ strokeDasharray: 1, strokeDashoffset: walked ? 0 : 1 }}
                  />
                )
              })}
            </svg>

            {[0, 1, 2].map((id) => (
              <span
                key={id}
                data-node={id}
                aria-hidden="true"
                // The left branch labels leftwards, so no tag ever sits on an edge.
                className={`activity-node${id === 1 ? ' side-l' : ''}${
                  visited >= orderOf(id) ? ' is-visited' : ''
                }${lit.has(id) ? ' is-path' : ''}`}
                style={{ left: layout.pt[id].x, top: layout.pt[id].y }}
              >
                <span className="tag">
                  <i className="pixel-mono">{pad(orderOf(id))}</i> {labelOf(id)}
                </span>
              </span>
            ))}
          </>
        )}

        <ul className="activity-list" ref={list}>
          {ACTIVITIES.map((item, i) => {
            const id = 3 + i
            return (
              <li
                className={`activity-item${!DRAW || visited >= orderOf(id) ? ' is-visited' : ''}${
                  hover === id ? ' is-path' : ''
                }`}
                key={item.title}
                onMouseEnter={() => setHover(id)}
                onMouseLeave={() => setHover(null)}
              >
                <p className="head pixel-mono">
                  <span className="visit">{pad(orderOf(id))}</span>
                  <span>LEAF</span>
                </p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}
