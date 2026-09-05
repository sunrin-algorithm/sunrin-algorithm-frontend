import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { NAV } from '../content'
import { scrollToId, setScrollLocked } from '../lib/motion'
import { useActiveSection } from '../lib/active'
import ThemeToggle from './ThemeToggle'
import Wordmark from './Wordmark'

const SECTION_IDS = NAV.map((s) => s.id)

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function Corners({ open, onOpenChange }: Props) {
  const active = useActiveSection(SECTION_IDS)
  const closeRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setScrollLocked(open)
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      triggerRef.current?.focus()
    }
  }, [open, onOpenChange])

  const jump = (e: MouseEvent, id: string) => {
    e.preventDefault()
    onOpenChange(false)
    scrollToId(id)
    // Lenis owns the scroll position, so the URL has to be updated by hand.
    history.replaceState(null, '', id === 'top' ? location.pathname : `#${id}`)
  }

  return (
    <>
      <div className="corners" inert={open || undefined}>
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
            ref={triggerRef}
            className="index-trigger"
            aria-expanded={open}
            onClick={() => onOpenChange(true)}
          >
            INDEX
          </button>
        </div>
      </div>

      {open && (
        <div className="index-sheet" role="dialog" aria-modal="true" aria-label="섹션 인덱스">
          <ThemeToggle className="sheet-theme" />
          <button type="button" ref={closeRef} className="close" onClick={() => onOpenChange(false)}>
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
