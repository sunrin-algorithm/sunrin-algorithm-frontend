import { useEffect, useRef } from 'react'
import { CONTEST } from '../content'
import { cloneInto, lerpRect, placeAt, rectOf } from '../lib/handoff'
import { SETTLE_VH, ScrollTrigger, gsap, reduceMotion } from '../lib/motion'
import Section from './Section'

/** Three members, every pair talking to each other: K3. */
const MEMBERS = [
  { x: 130, y: 34, label: '01' },
  { x: 34, y: 176, label: '02' },
  { x: 226, y: 176, label: '03' },
]
const PAIRS: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 2],
]

/** How much of the pin the graph spends assembling; the rest of it is settle. */
const LAND_VH = 0.35

/** Maps an svg-user-space point to screen px, honoring xMidYMid-meet letterboxing. */
function svgPointToScreen(svg: SVGSVGElement, x: number, y: number) {
  const rect = svg.getBoundingClientRect()
  const vb = svg.viewBox.baseVal
  const scale = Math.min(rect.width / vb.width, rect.height / vb.height)
  const offX = rect.left + (rect.width - vb.width * scale) / 2
  const offY = rect.top + (rect.height - vb.height * scale) / 2
  return { x: offX + (x - vb.x) * scale, y: offY + (y - vb.y) * scale, scale }
}

function TeamViz() {
  const svg = useRef<SVGSVGElement>(null)

  // The graph assembles with nothing moving under it: once the svg reaches the
  // centre of the screen the whole section grid pins there, the nodes pop in and
  // the edges draw across, Handoff C's dots land on them, and then the finished
  // K3 just stands there for a beat before the section is let go.
  useEffect(() => {
    const el = svg.current
    if (!el || reduceMotion()) return

    // Paused, driven by the pin's own progress: a second scrollTrigger anchored
    // on the svg would measure a screen position, not a document one, once the
    // pin around it has been applied.
    const timeline = gsap.timeline({ paused: true })
    // fromTo, not from: StrictMode remounts and from() would read the
    // already-zeroed opacity as its end value.
    timeline
      .fromTo(
        el.querySelectorAll('.team-node'),
        { opacity: 0, scale: 0.5, transformOrigin: 'center' },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.12 },
      )
      .fromTo(
        el.querySelectorAll('.team-edge'),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.65, ease: 'power2.out', stagger: 0.1 },
        '-=0.2',
      )

    const span = LAND_VH + SETTLE_VH
    const hold = ScrollTrigger.create({
      trigger: el,
      start: 'center center',
      end: () => `+=${window.innerHeight * span}`,
      // The grid, so the section's own [04] index is held alongside the graph.
      pin: el.closest('.section-grid') ?? el,
      anticipatePin: 1,
      // Pins refresh top-down, earliest first, or GSAP measures the later ones
      // as if the earlier spacers were not there.
      refreshPriority: 2,
      onUpdate: (self) => timeline.progress(Math.min((self.progress * span) / LAND_VH, 1)),
    })

    return () => {
      hold.kill()
      timeline.kill()
    }
  }, [])

  // Handoff C: the 3 dp cells Curriculum's drain leaves standing fly here and
  // land as this graph's 3 nodes, right as TeamViz's own entrance (above)
  // takes over.
  useEffect(() => {
    const el = svg.current
    if (!el || reduceMotion()) return

    const contest = document.getElementById('contest')
    const stage = document.getElementById('stage')
    if (!contest || !stage) return

    const cellFor = (r: number) => document.querySelector<HTMLElement>(`.dp-cell[data-rank="${r}"]`)
    const clones: (HTMLElement | null)[] = MEMBERS.map(() => null)

    const release = () => {
      clones.forEach((c, i) => {
        c?.remove()
        clones[i] = null
      })
    }

    const trigger = ScrollTrigger.create({
      trigger: contest,
      start: 'top 110%',
      end: 'top -30%',
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress
        if (p <= 0 || p >= 1) {
          release()
          return
        }

        MEMBERS.forEach((m, i) => {
          const cell = cellFor(i)
          if (!cell) return
          if (!clones[i]) clones[i] = cloneInto(stage, cell).clone
          const clone = clones[i] as HTMLElement
          clone.classList.add('handoff-dot')
          cell.style.visibility = 'hidden'

          const cellRect = rectOf(cell)
          const target = svgPointToScreen(el, m.x, m.y)
          const size = 40 * target.scale
          const dot = { x: target.x - size / 2, y: target.y - size / 2, w: size, h: size }
          placeAt(clone, lerpRect(cellRect, dot, p))
          clone.style.opacity = p > 0.85 ? String(1 - (p - 0.85) / 0.15) : '1'
        })
      },
    })

    return () => {
      trigger.kill()
      release()
    }
  }, [])

  return (
    <svg
      ref={svg}
      className="team-viz"
      viewBox="0 0 260 216"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {PAIRS.map(([a, b]) => (
        <line
          key={`${a}${b}`}
          className="team-edge"
          x1={MEMBERS[a].x}
          y1={MEMBERS[a].y}
          x2={MEMBERS[b].x}
          y2={MEMBERS[b].y}
          pathLength={1}
          strokeDasharray={1}
        />
      ))}
      {MEMBERS.map((m) => (
        <g className="team-node" key={m.label} transform={`translate(${m.x} ${m.y})`}>
          <circle r={26} />
          <text>{m.label}</text>
        </g>
      ))}
    </svg>
  )
}

export default function Contest() {
  return (
    <Section id="contest" n="04" label="천코대">
      <div className="contest-head">
        <h2 className="contest-title">
          <span className="line">
            <span className="line-i">
              <em>{CONTEST.titleHead}</em>
            </span>
          </span>
          <span className="line">
            <span className="line-i">{CONTEST.titleTail}</span>
          </span>
        </h2>

        <figure className="team-figure">
          <TeamViz />
          <figcaption className="pixel-mono">{CONTEST.graphNote}</figcaption>
        </figure>
      </div>

      <div className="contest-cols">
        <div className="contest-text">
          {CONTEST.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <ul className="contest-facts pixel">
          {CONTEST.facts.map(([k, v]) => (
            <li key={k}>
              <span>{k}</span>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
