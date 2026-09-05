import { CONTACT, FOOTER } from '../content'
import Section from './Section'
import ThemeToggle from './ThemeToggle'

export default function Contact() {
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

      <footer className="footer shell">
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
