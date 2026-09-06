import { useEffect, useRef } from 'react'
import { ABOUT } from '../content'
import { SETTLE_VH, ScrollTrigger, gsap, reduceMotion } from '../lib/motion'
import Section from './Section'

/** Where 소개's brief stop engages. Activities' Handoff A keys the chip's wipe
    to it rather than to the lead paragraph, which reads as a screen position
    rather than a document one once this pin has been applied.
    ponytail: module singleton -- the page only ever has one About. */
let aboutHold: ScrollTrigger | null = null
export const aboutHoldStart = () => aboutHold?.start ?? 0

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
  // 소개도 조금만 멈췄다 다시 떠내려감: the section comes to a stop just long
  // enough for the chip in its lead to light up and lift off, then lets go and
  // drifts away underneath the chip, which by then is parked on the stage.
  useEffect(() => {
    if (reduceMotion()) return
    const grid = document.querySelector<HTMLElement>('#about .section-grid')
    if (!grid) return

    const pin = ScrollTrigger.create({
      trigger: grid,
      start: 'center center',
      end: () => `+=${window.innerHeight * SETTLE_VH}`,
      pin: grid,
      anticipatePin: 1,
      // First pin down the page, so the highest priority: GSAP reverts every
      // spacer before measuring, and everything below needs this one settled.
      refreshPriority: 5,
    })
    aboutHold = pin

    return () => {
      aboutHold = null
      pin.kill()
    }
  }, [])

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
        <span className="line-i">
          {ABOUT.lead.pre}
          <span className="chip-seed">{ABOUT.lead.chip}</span>
          {ABOUT.lead.post}
        </span>
      </p>

      <div className="about-body">
        {ABOUT.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </Section>
  )
}
