import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { revealLines } from '../lib/motion'

type Props = {
  id: string
  n: string
  label: string
  children: ReactNode
}

/** Index column on the left, body on the right — the spine of every section. */
export default function Section({ id, n, label, children }: Props) {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!root.current) return
    return revealLines(root.current)
  }, [])

  return (
    <section className="section shell" id={id} ref={root} aria-labelledby={`${id}-label`}>
      <div className="section-grid">
        <div className="section-index pixel">
          <div className="sticky">
            <span className="num">[{n}]</span>
            <span id={`${id}-label`}>{label}</span>
          </div>
        </div>
        <div className="section-body">{children}</div>
      </div>
    </section>
  )
}
