import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ACTIVITIES, ACTIVITY_BRANCHES } from '../content'
import { ScrollTrigger, fitStart, reduceMotion, registerDoneAt } from '../lib/motion'
import { peakProgress } from '../lib/peak'
import { dfsOrder, parentOf, pathToRoot } from '../lib/tree'
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

/**
 * How much of the tree's approach to the centre of the screen the DFS walk
 * spends unfolding, as a fraction of it. Under 1 on purpose: the walk finishes
 * before the tree arrives, so what stops in the middle of the screen is a
 * complete tree rather than one still drawing itself.
 */
const WALK_IN = 0.68

/**
 * Scroll length of the hold that follows, in viewport heights. Short on
 * purpose: the merge that turns the four cards into 커리큘럼's calendar starts
 * on the frame this engages and keeps running after it lets go, on clones that
 * are already off the layout — so holding the grid any longer than it takes
 * the cards to come off their marks just reads as the page having stopped.
 */
const HOLD_VH = 0.6

/** Where the tree's pin engages and lets go. Curriculum starts the merge at
    the first and needs both to work out where the cards sit while pinned;
    measuring them there would mean a trigger inside a pinned element, which
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

  // The tree unfolds out of its root dot on the way in and is finished by the
  // time it reaches the middle of the screen, where the grid pins so the merge
  // that follows has something standing still to take apart.
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
      // Both remaining pins must refresh before anything below them measures,
      // earliest first, or GSAP sizes later triggers as if the spacers were
      // not there.
      refreshPriority: 4,
    })
    treeHold = pin

    // The walk rides the approach, not the pin: it has to be over by the time
    // the pin engages, so its end *is* the pin's start and the two can never
    // drift apart however the layout moves.
    const peak = peakProgress()
    const walk = ScrollTrigger.create({
      trigger: grid,
      start: 'top bottom',
      end: fitStart(grid),
      scrub: 0.3,
      refreshPriority: 4,
      // Latched: rewinding the walk halfway leaves a tree with some of its
      // edges missing, which reads as broken rather than as going backwards.
      // Leaving the section entirely is what arms it to play again.
      onUpdate: (self) =>
        setVisited(Math.round(peak.push(Math.min(self.progress / WALK_IN, 1)) * N)),
      onLeaveBack: () => {
        peak.reset()
        setVisited(0)
      },
    })

    // The tree is complete on the frame the pin takes over.
    const unregister = registerDoneAt('activity', () => pin.start)

    return () => {
      treeHold = null
      unregister()
      walk.kill()
      pin.kill()
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
