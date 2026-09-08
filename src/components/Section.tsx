import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { revealLines } from '../lib/motion'

type Props = {
  id: string
  /** Accessible name only — sections carry no visible label. */
  label: string
  children: ReactNode
  /** Full-bleed content that ignores the shell's max-width and gutter. */
  bleed?: ReactNode
}

export default function Section({ id, label, children, bleed }: Props) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!root.current) return
    return revealLines(root.current)
  }, [])

  return (
    <section className="section" id={id} ref={root} aria-label={label}>
      <div className="shell section-grid">
        <div className="section-body">{children}</div>
        {bleed && <div className="section-bleed">{bleed}</div>}
      </div>
    </section>
  )
}
