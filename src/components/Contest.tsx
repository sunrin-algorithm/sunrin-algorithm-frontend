import { useEffect, useRef } from 'react'
import { CONTEST } from '../content'
import { gsap, reduceMotion } from '../lib/motion'
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

function TeamViz() {
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const el = svg.current
    if (!el || reduceMotion()) return

    const timeline = gsap.timeline({
      scrollTrigger: { trigger: el, start: 'top 85%', end: 'center center', scrub: 0.4 },
    })
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

    return () => {
      timeline.scrollTrigger?.kill()
      timeline.kill()
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
    <Section
      id="contest"
      n="04"
      label="천코대"
      bleed={
        <figure className="team-figure">
          <TeamViz />
          <figcaption className="pixel-mono">{CONTEST.graphNote}</figcaption>
        </figure>
      }
    >
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
