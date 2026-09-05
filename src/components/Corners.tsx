import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { NAV } from '../content'
import { scrollToId, setScrollLocked } from '../lib/motion'
import ThemeToggle from './ThemeToggle'
import Wordmark from './Wordmark'

const SECTION_IDS = NAV.map((s) => s.id)

/** Which section owns the middle band of the viewport right now. */
function useScrollSpy(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )

    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [ids])

  return active
}

export default function Corners() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const active = useScrollSpy(SECTION_IDS)

  useEffect(() => {
    setScrollLocked(sheetOpen)
    if (!sheetOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheetOpen])

  const jump = (e: MouseEvent, id: string) => {
    e.preventDefault()
    setSheetOpen(false)
    scrollToId(id)
  }

  return (
    <>
      <div className="corners">
        <a
          className="brand-corner"
          href="#top"
          aria-label="SHARC 맨 위로"
          onClick={(e) => jump(e, 'top')}
        >
          <span className="mark" aria-hidden="true" />
          <Wordmark className="wordmark" />
        </a>

        <div className="nav-right">
          <nav className="nav-links pixel" aria-label="섹션">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={active === item.id ? 'true' : undefined}
                onClick={(e) => jump(e, item.id)}
              >
                <span className="n">{item.n}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <ThemeToggle />
          <button
            type="button"
            className="index-trigger"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
          >
            INDEX
          </button>
        </div>
      </div>

      {sheetOpen && (
        <div className="index-sheet" role="dialog" aria-modal="true" aria-label="섹션 인덱스">
          <ThemeToggle className="sheet-theme" />
          <button type="button" className="close" onClick={() => setSheetOpen(false)}>
            CLOSE
          </button>
          {NAV.map((item) => (
            <a key={item.id} href={`#${item.id}`} onClick={(e) => jump(e, item.id)}>
              <span className="n">{item.n}</span>
              {item.label}
            </a>
          ))}
        </div>
      )}
    </>
  )
}
