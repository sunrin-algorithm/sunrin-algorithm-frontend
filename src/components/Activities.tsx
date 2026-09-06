import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ACTIVITIES, ACTIVITY_BRANCHES } from '../content'
import { centerRect, cloneInto, lerpRect, placeAt, rectOf } from '../lib/handoff'
import { ScrollTrigger, reduceMotion } from '../lib/motion'
import { dfsOrder, parentOf, pathToRoot } from '../lib/tree'
import Section from './Section'

/** Handoff A ("연구 활동" chip -> tree root) runs before the DFS walk starts. */
const HANDOFF_END = 0.7

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
   * layout CSS picked: wide screens fan out downwards, narrow ones run the
   * traversal down a rail on the left.
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
      // Both rows share one column midline, so root/branch1/branch2 all sit on
      // it too — their edges degenerate to straight verticals that run down
      // the empty column-gap, never crossing a card.
      r.forEach((c, i) => {
        pt[3 + i] = { x: c.left - w.left + c.width / 2, y: c.top - w.top }
      })
      const centerX = (pt[3].x + pt[4].x) / 2
      const rowGapY = (r[0].bottom + r[2].top) / 2 - w.top
      pt[1] = { x: centerX, y: head * 0.58 }
      pt[2] = { x: centerX, y: rowGapY }
      pt[0] = { x: centerX, y: head * 0.1 }
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

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    if (reduceMotion()) {
      setVisited(N)
      return
    }

    const chip = document.querySelector<HTMLElement>('.chip-seed')
    const stage = document.getElementById('stage')
    const rootNode = () => el.querySelector<HTMLElement>('[data-node="0"]')
    let clone: HTMLElement | null = null

    const releaseHandoff = () => {
      clone?.remove()
      clone = null
      if (chip) chip.style.visibility = ''
      const root = rootNode()
      if (root) root.style.visibility = ''
    }

    // The walk plays out as the section scrolls past, not on a timer. The
    // range is widened (was 'top 78%'/'center center') to leave room ahead of
    // the walk for the chip -> root handoff.
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      end: 'top 12%',
      scrub: 0.4,
      onUpdate: (self) => {
        const p = self.progress
        setVisited(p < HANDOFF_END ? 0 : Math.round(((p - HANDOFF_END) / (1 - HANDOFF_END)) * N))

        if (!DRAW || !chip || !stage) return
        const root = rootNode()
        if (!root || p <= 0 || p >= 1) {
          releaseHandoff()
          return
        }

        if (!clone) clone = cloneInto(stage, chip).clone
        clone.classList.add('handoff-chip')
        chip.style.visibility = 'hidden'
        root.style.visibility = 'hidden'

        const vw = window.innerWidth
        const vh = window.innerHeight
        // Measured every frame (not cached at trigger-enter) so the fly-in
        // tracks the chip's real scroll position and the landing tracks the
        // root node's — both are still moving while the page scrolls.
        const chipRect = rectOf(chip)
        const big = centerRect(vw, vh, chipRect.w, chipRect.h)
        const dot = centerRect(vw, vh, 11, 11)
        const rootRect = rectOf(root)

        let rect = big
        let neon = 1
        let textFade = 1
        if (p < 0.25) {
          rect = lerpRect(chipRect, big, p / 0.25)
          neon = p / 0.25
          textFade = 0
        } else if (p < 0.45) {
          textFade = (p - 0.25) / 0.2
        } else if (p < HANDOFF_END) {
          rect = lerpRect(big, dot, (p - 0.45) / (HANDOFF_END - 0.45))
        } else if (p < 0.92) {
          rect = dot
        } else {
          rect = lerpRect(dot, rootRect, (p - 0.92) / 0.08)
        }

        placeAt(clone, rect)
        clone.style.color = `rgba(255,255,255,${1 - textFade})`
        clone.style.boxShadow = `0 0 ${18 * neon}px ${6 * neon}px rgba(42,161,254,${0.55 * neon})`
        clone.style.opacity = p < 0.92 ? '1' : String(1 - (p - 0.92) / 0.08)
      },
    })

    return () => {
      trigger.kill()
      releaseHandoff()
    }
  }, [])

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
