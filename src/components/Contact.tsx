import { useEffect, useRef } from 'react'
import { CONTACT, FOOTER } from '../content'
import {
  SETTLE_VH,
  ScrollTrigger,
  fitStart,
  reduceMotion,
  registerDoneAt,
  revealLines,
} from '../lib/motion'
import Section from './Section'
import ThemeToggle from './ThemeToggle'

export default function Contact() {
  const footer = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!footer.current) return
    return revealLines(footer.current)
  }, [])

  // The lead and the links reveal on their way in and are long finished by the
  // time the section centres, so this pin is pure settle: the last screen of the
  // page holds still for a beat before the footer climbs over it.
  useEffect(() => {
    if (reduceMotion()) return
    const grid = document.querySelector<HTMLElement>('#contact .section-grid')
    if (!grid) return

    const hold = ScrollTrigger.create({
      trigger: grid,
      start: fitStart(grid),
      end: () => `+=${window.innerHeight * SETTLE_VH}`,
      pin: grid,
      anticipatePin: 1,
      // Last of the four pins, so the lowest priority: everything above it must
      // refresh first or it measures as if their spacers were not there.
      refreshPriority: 1,
    })
    const unregister = registerDoneAt('contact', () => hold.start)

    return () => {
      unregister()
      hold.kill()
    }
  }, [])

  return (
    <>
      <Section id="contact" n="05" label="연락">
        <p className="about-lead line">
          <span className="line-i">{CONTACT.lead}</span>
        </p>

        <div className="contact-links">
          {CONTACT.links.map((link) => (
            <a
              className="contact-link"
              key={link.href}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              <span className="addr">{link.addr}</span>
              <span className="go pixel">{link.kind} ↗</span>
            </a>
          ))}
        </div>
      </Section>

      <footer className="footer shell" ref={footer}>
        <p className="footer-mark line" aria-hidden="true">
          <span className="line-i">{FOOTER.mark}</span>
        </p>
        {/* masked so the logo inherits the theme's brand colour */}
        <div className="logo-full" role="img" aria-label="SHARC 알고리즘연구부 로고" />
        <div className="meta pixel">
          {FOOTER.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
          <ThemeToggle />
        </div>
      </footer>
    </>
  )
}
