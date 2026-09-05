import { useEffect, useRef } from 'react'
import { ACTIVITIES } from '../content'
import { gsap, reduceMotion } from '../lib/motion'
import { dfsOrder } from '../lib/tree'
import Section from './Section'

/**
 * The four cards are the leaves of a 7-node tree, so their badge numbers are
 * the real pre-order positions (03, 04, 06, 07) — the two interior nodes take
 * 02 and 05 on the way down.
 */
const WALK = dfsOrder(7)
const LEAF_ORDERS = [3, 4, 5, 6].map((id) => WALK.indexOf(id) + 1)

export default function Activities() {
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const el = list.current
    if (!el || reduceMotion()) return

    const items = el.querySelectorAll<HTMLElement>('.activity-item')
    const tween = gsap.fromTo(
      items,
      { opacity: 0, y: 26 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.14,
        scrollTrigger: { trigger: el, start: 'top 82%', once: true },
      },
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  return (
    <Section id="activity" n="02" label="활동">
      <p className="activity-root pixel">
        <span className="dot" />
        dfs(활동) — 아래로 내려가며 하나씩 방문합니다
      </p>

      <ul className="activity-list" ref={list}>
        {ACTIVITIES.map((item, i) => (
          <li className="activity-item" key={item.title}>
            <p className="head pixel-mono">
              <span className="visit">{String(LEAF_ORDERS[i]).padStart(2, '0')}</span>
              <span>DEPTH 2</span>
            </p>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
