import { useEffect, useRef } from 'react'
import { ABOUT } from '../content'
import { gsap, reduceMotion } from '../lib/motion'
import Section from './Section'

function Figure({ value, suffix }: { value: number; suffix: string }) {
  const el = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = el.current
    if (!node) return
    // Small numbers land directly — a 0→1 tick spends its whole run reading "0".
    if (reduceMotion() || value < 4) {
      node.textContent = String(value)
      return
    }

    // Years read better ticking up from a nearby number than from zero.
    const from = value > 100 ? value - 28 : 0
    const counter = { v: from }
    node.textContent = String(from)

    const tween = gsap.to(counter, {
      v: value,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        node.textContent = String(Math.round(counter.v))
      },
      scrollTrigger: { trigger: node, start: 'top 88%', once: true },
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [value])

  return (
    <span className="fig">
      <span ref={el}>{value}</span>
      {suffix && <span className="suffix">{suffix}</span>}
    </span>
  )
}

export default function About() {
  return (
    <Section
      id="about"
      n="01"
      label="소개"
      bleed={
        <dl className="stats">
          {ABOUT.stats.map((stat) => (
            <div className="stat" key={stat.cap}>
              <dt className="sr-only">{stat.cap}</dt>
              <dd>
                <Figure value={stat.value} suffix={stat.suffix} />
                <p className="cap pixel">{stat.cap}</p>
              </dd>
            </div>
          ))}
        </dl>
      }
    >
      <p className="about-lead line">
        <span className="line-i">{ABOUT.lead}</span>
      </p>

      <div className="about-body">
        {ABOUT.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </Section>
  )
}
