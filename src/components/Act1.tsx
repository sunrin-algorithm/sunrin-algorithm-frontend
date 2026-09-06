import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  GH,
  GLYPHS,
  GW,
  cameraFor,
  leafBoxRect,
  leafEdges,
  leafGlyphCenter,
  midBoxRect,
  midEdges,
  midGlyphCenter,
  rootBoxRect,
  rootGlyphCenter,
  scrambleChar,
} from '../lib/act1'
import type { Rect, WorldEdge } from '../lib/act1'
import { gsap, reduceMotion, setScrollLocked } from '../lib/motion'
import Wordmark from './Wordmark'

const rectStyle = (r: Rect): CSSProperties => ({ left: r.x, top: r.y, width: r.w, height: r.h })

const glyphStyle = (c: { x: number; y: number }): CSSProperties => ({
  left: c.x - GW / 2,
  top: c.y - GH / 2,
  width: GW,
  height: GH,
})

/** Same bezier shape Activities draws its DFS tree with. */
function bezier(e: WorldEdge) {
  const mid = (e.y1 + e.y2) / 2
  return `M ${e.x1} ${e.y1} C ${e.x1} ${mid}, ${e.x2} ${mid}, ${e.x2} ${e.y2}`
}

const LEAF_EDGES = leafEdges()
const MID_EDGES = midEdges()

type Props = {
  /** A cold hash-load is already scrolling somewhere; don't fight it with a lock. */
  skipLock?: boolean
}

/** Per-glyph delay fraction for the scramble-lock ripple (glyph 0 finishes first). */
const SCRAMBLE_STAGGER = 0.025

/**
 * Plays once per visit, no skip: 12 leaf boxes punch in with flickering
 * placeholder glyphs that lock left-to-right, then merge in 2 stages
 * (per-word, then whole-string) down to a root box that settles into the
 * resting title.
 */
export default function Act1({ skipLock }: Props) {
  const [reduced] = useState(reduceMotion)
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (reduced || !el) return

    const camera = el.querySelector<HTMLElement>('.act1-camera')
    const leafBoxes = [...el.querySelectorAll<HTMLElement>('.act1-leafbox')]
    const midBoxes = [...el.querySelectorAll<HTMLElement>('.act1-midbox')]
    const rootBox = el.querySelector<HTMLElement>('.act1-rootbox')
    const glyphs = [...el.querySelectorAll<HTMLElement>('.act1-glyph')]
    const leafEdgeEls = [...el.querySelectorAll<SVGPathElement>('.act1-edge-leaf')]
    const midEdgeEls = [...el.querySelectorAll<SVGPathElement>('.act1-edge-mid')]
    const progress = el.querySelector<HTMLElement>('.act1-progress')
    if (!camera || !rootBox || !progress) return
    if (glyphs.length !== 12 || leafBoxes.length !== 12 || midBoxes.length !== 2) return

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      clearTimeout(timeout)
      setScrollLocked(false)
      document.documentElement.classList.remove('act1-live')
    }
    // Safety valve: whatever goes wrong in the timeline above, scroll is never
    // permanently locked — there is no skip, so this is the only way out.
    const timeout = window.setTimeout(finish, 10_000)

    if (!skipLock) setScrollLocked(true)
    document.documentElement.classList.add('act1-live')

    const vw = window.innerWidth
    const vh = window.innerHeight
    const cam0 = cameraFor(0, vw, vh)
    const cam1 = cameraFor(1, vw, vh)
    const cam2 = cameraFor(2, vw, vh)

    gsap.set(camera, { x: cam0.x, y: cam0.y, scale: cam0.scale, transformOrigin: '0 0' })
    gsap.set([...leafBoxes, ...midBoxes, rootBox], { opacity: 0, scale: 0.6, transformOrigin: 'center' })
    gsap.set([...leafEdgeEls, ...midEdgeEls], { strokeDashoffset: 1 })
    glyphs.forEach((glyph, g) => {
      const c = leafGlyphCenter(g)
      gsap.set(glyph, { left: c.x - GW / 2, top: c.y - GH / 2, opacity: 0 })
      glyph.textContent = scrambleChar(GLYPHS[g], 0, g)
    })

    const tl = gsap.timeline()
    tl.eventCallback('onComplete', finish)
    tl.eventCallback('onUpdate', () => {
      progress.textContent = `ACT I ${String(Math.round(tl.progress() * 100)).padStart(3, '0')}`
    })

    // 0.0–0.5 — 12 leaf boxes punch in where the split will land.
    tl.to(leafBoxes, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.03, ease: 'back.out(2)' }, 0)
      .to(glyphs, { opacity: 1, duration: 0.4, stagger: 0.03 }, 0.1)
      // 0.15–1.25 — placeholder glyphs flicker, then lock to their letter
      // left to right, driven by a single scrub tween (no per-glyph timers).
      .to(
        { p: 0 },
        {
          p: 1,
          duration: 1.1,
          ease: 'none',
          onUpdate: function () {
            const p = (this.targets()[0] as { p: number }).p
            glyphs.forEach((glyph, g) => {
              const local = gsap.utils.clamp(0, 1, (p - g * SCRAMBLE_STAGGER) / (1 - 11 * SCRAMBLE_STAGGER))
              glyph.textContent = scrambleChar(GLYPHS[g], local, g)
            })
          },
        },
        0.15,
      )
      // 1.25–2.15 — stage 1: each word's leaves sort into their own mid box.
      .to(camera, { x: cam1.x, y: cam1.y, scale: cam1.scale, duration: 0.9, ease: 'power2.inOut' }, 1.25)
      .to(leafEdgeEls, { strokeDashoffset: 0, duration: 0.6, stagger: 0.02 }, 1.25)
      .to(midBoxes, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.15, ease: 'back.out(2)' }, 1.45)
      .to(
        glyphs,
        {
          left: (i) => midGlyphCenter(i).x - GW / 2,
          top: (i) => midGlyphCenter(i).y - GH / 2,
          duration: 0.6,
          stagger: 0.04,
          ease: 'power2.inOut',
        },
        1.35,
      )
      // 2.15–2.95 — stage 2: the two words concatenate into the root box.
      .to(camera, { x: cam2.x, y: cam2.y, scale: cam2.scale, duration: 0.8, ease: 'power2.inOut' }, 2.15)
      .to(midEdgeEls, { strokeDashoffset: 0, duration: 0.5, stagger: 0.05 }, 2.15)
      .to(rootBox, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 2.35)
      .to(
        glyphs,
        {
          left: (i) => rootGlyphCenter(i).x - GW / 2,
          top: (i) => rootGlyphCenter(i).y - GH / 2,
          duration: 0.7,
          stagger: 0.045,
          ease: 'power2.inOut',
        },
        2.15,
      )
      // 2.95–3.35 — boxes and edges dissolve, the merged title remains.
      .to([...leafBoxes, ...midBoxes, rootBox], { opacity: 0, duration: 0.4 }, 2.95)
      .to([...leafEdgeEls, ...midEdgeEls], { opacity: 0, duration: 0.3 }, 2.95)
      .to(progress, { opacity: 0, duration: 0.3 }, 2.95)

    return () => {
      clearTimeout(timeout)
      tl.kill()
      if (!finished) {
        finished = true
        setScrollLocked(false)
        document.documentElement.classList.remove('act1-live')
      }
    }
  }, [reduced, skipLock])

  if (reduced) {
    return (
      <header className="act1 act1-static" id="top">
        <h1 className="sr-only">SHARC — 선린인터넷고등학교 알고리즘연구부</h1>
        <div className="act1-static-title">
          <Wordmark className="act1-static-mark" />
          <span className="act1-static-ko">알고리즘연구부</span>
        </div>
      </header>
    )
  }

  return (
    <header className="act1" id="top" ref={root}>
      <h1 className="sr-only">SHARC — 선린인터넷고등학교 알고리즘연구부</h1>

      <div className="act1-camera">
        <svg className="act1-edges" aria-hidden="true">
          {LEAF_EDGES.map((e, i) => (
            <path
              key={`leaf-${i}`}
              className="tree-edge is-walked act1-edge-leaf"
              pathLength={1}
              style={{ strokeDasharray: 1 }}
              d={bezier(e)}
            />
          ))}
          {MID_EDGES.map((e, i) => (
            <path
              key={`mid-${i}`}
              className="tree-edge is-walked act1-edge-mid"
              pathLength={1}
              style={{ strokeDasharray: 1 }}
              d={bezier(e)}
            />
          ))}
        </svg>

        {Array.from({ length: 12 }, (_, slot) => (
          <span className="act1-box act1-leafbox" key={`leafbox-${slot}`} style={rectStyle(leafBoxRect(slot))} />
        ))}
        <span className="act1-box act1-midbox" style={rectStyle(midBoxRect(0))} />
        <span className="act1-box act1-midbox" style={rectStyle(midBoxRect(1))} />
        <span className="act1-box act1-rootbox" style={rectStyle(rootBoxRect())} />

        {GLYPHS.map((ch, g) => (
          <span className="act1-glyph" key={g} style={glyphStyle(leafGlyphCenter(g))}>
            {ch}
          </span>
        ))}
      </div>

      <p className="pixel act1-progress" aria-hidden="true">
        ACT I 000
      </p>
    </header>
  )
}
