import { useEffect, useMemo, useRef, useState } from 'react'
import { bfsOrder, buildTree } from '../lib/tree'
import { reduceMotion } from '../lib/motion'

type Props = {
  glyphs: string[]
  /** Called with the number of nodes the DFS cursor has visited so far. */
  onVisit?: (visited: number) => void
}

const W = 1000
const H = 470
const PAD_X = 48
const PAD_TOP = 34
const PAD_BOTTOM = 52
const R = 21

const BIRTH_DELAY = 320
const BIRTH_STEP = 62
const WALK_LEAD = 620
const WALK_STEP = 265
const LOOP_HOLD = 2700

export default function TreeViz({ glyphs, onVisit }: Props) {
  const { nodes, edges } = useMemo(() => buildTree(glyphs), [glyphs])
  const n = nodes.length

  const bfsRank = useMemo(() => {
    const rank = new Map<number, number>()
    bfsOrder(n).forEach((id, k) => rank.set(id, k))
    return rank
  }, [n])

  const [born, setBorn] = useState(0)
  const [walk, setWalk] = useState(0)

  const visitRef = useRef(onVisit)
  visitRef.current = onVisit

  useEffect(() => {
    if (reduceMotion()) {
      setBorn(n)
      setWalk(n)
      visitRef.current?.(n)
      return
    }

    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))

    const step = (k: number) => {
      setWalk(k)
      visitRef.current?.(k)
    }

    const runWalk = (from: number) => {
      step(0)
      for (let k = 1; k <= n; k++) at(from + k * WALK_STEP, () => step(k))
      at(from + n * WALK_STEP + LOOP_HOLD, () => runWalk(0))
    }

    for (let k = 1; k <= n; k++) at(BIRTH_DELAY + k * BIRTH_STEP, () => setBorn(k))
    at(BIRTH_DELAY + n * BIRTH_STEP + WALK_LEAD, () => runWalk(0))

    return () => timers.forEach(clearTimeout)
  }, [n])

  const px = (x: number) => PAD_X + x * (W - PAD_X * 2)
  const py = (y: number) => PAD_TOP + y * (H - PAD_TOP - PAD_BOTTOM)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {edges.map((edge) => {
        const a = nodes[edge.from]
        const b = nodes[edge.to]
        const x1 = px(a.x)
        const y1 = py(a.y)
        const x2 = px(b.x)
        const y2 = py(b.y)
        const mid = (y1 + y2) / 2
        const grown = (bfsRank.get(edge.to) as number) < born
        return (
          <path
            key={`${edge.from}-${edge.to}`}
            className={`tree-edge${walk >= edge.visitOrder ? ' is-walked' : ''}`}
            d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: grown ? 0 : 1,
              transition: 'stroke-dashoffset 0.55s cubic-bezier(0.2, 0.7, 0.2, 1), stroke 0.2s',
            }}
          />
        )
      })}

      {nodes.map((node) => {
        const grown = (bfsRank.get(node.id) as number) < born
        const visited = walk >= node.visitOrder
        const active = walk === node.visitOrder
        return (
          <g key={node.id} transform={`translate(${px(node.x)} ${py(node.y)})`}>
            {/* inner group scales about (0,0), which is the node centre */}
            <g
              className={`tree-node${visited ? ' is-visited' : ''}${active ? ' is-active' : ''}`}
              style={{
                opacity: grown ? 1 : 0,
                transform: `scale(${grown ? 1 : 0.55})`,
                transition: 'opacity 0.4s ease, transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
            >
              <circle r={R} />
              <text className="glyph" fontSize={18}>
                {node.glyph}
              </text>
              <text className="order" y={R + 16} fontSize={10}>
                {String(node.visitOrder).padStart(2, '0')}
              </text>
            </g>
          </g>
        )
      })}
    </svg>
  )
}
