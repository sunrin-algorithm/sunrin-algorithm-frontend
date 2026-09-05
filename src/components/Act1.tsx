import { useEffect, useMemo, useRef, useState } from 'react'
import {
  GLYPHS,
  SPLIT_LEVELS,
  boundaryLevels,
  depthForWidth,
  mergeTrace,
  scatterIndices,
} from '../lib/mergesort'
import type { Depth } from '../lib/mergesort'
import { gsap, reduceMotion } from '../lib/motion'
import Wordmark from './Wordmark'

/** Split-boundary gap, opened one level at a time by the SPLIT beats. */
const GAP = 12

/**
 * The hero replacement: one 400vh (mobile: 260vh, see --act1-vh) pinned,
 * scrubbed timeline that punches in the wordmark, splits the combined title
 * into its word-boundary boxes, scatters them, then runs a real bottom-up
 * merge sort back to the resting title. Every beat below is keyed to the
 * scroll-progress percentages from the storyboard (p=.08 -> position 8, …).
 */
export default function Act1() {
  const [reduced] = useState(reduceMotion)
  const [depth, setDepth] = useState<Depth>(4)
  const root = useRef<HTMLDivElement>(null)

  const leaves = SPLIT_LEVELS[depth]
  const gapLevel = useMemo(() => boundaryLevels(depth), [depth])
  const trace = useMemo(() => mergeTrace(scatterIndices(depth)), [depth])

  useEffect(() => {
    if (reduced) return
    const onResize = () => setDepth(depthForWidth(window.innerWidth))
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [reduced])

  useEffect(() => {
    const el = root.current
    if (reduced || !el) return

    const pinEl = el.querySelector<HTMLElement>('.act1-pin')
    const cover = el.querySelector<HTMLElement>('.act1-cover')
    const titleGroup = el.querySelector<HTMLElement>('.act1-title-group')
    const mark = el.querySelector<HTMLElement>('.act1-mark')
    const ko = el.querySelector<HTMLElement>('.act1-ko')
    const frame = el.querySelector<HTMLElement>('.act1-frame')
    const boxesWrap = el.querySelector<HTMLElement>('.act1-boxes')
    const boxes = [...el.querySelectorAll<HTMLElement>('.act1-box')]
    const hint = el.querySelector<HTMLElement>('.act1-hint')
    if (!pinEl || !cover || !titleGroup || !mark || !ko || !frame || !boxesWrap || !hint) return

    // stage 0 is the scatter itself; stage k is k merge rounds in.
    const slotOf = (stage: number[][], box: number) => stage.flat().indexOf(box)
    const xPercentAt = (stage: number) => (box: number) => (slotOf(trace[stage], box) - box) * 100

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: () => `+=${el.offsetHeight - window.innerHeight}`,
        scrub: 0.6,
        pin: pinEl,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          document.documentElement.classList.toggle('act1-live', self.progress < 0.97)
        },
      },
    })
    document.documentElement.classList.add('act1-live')

    // COVER (p=.00) holds; MARK (p=.08) punches the wordmark in.
    tl.fromTo(hint, { opacity: 0 }, { opacity: 1, duration: 2 }, 2)
      .fromTo(
        mark,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 6, ease: 'back.out(1.7)' },
        8,
      )
      .to(hint, { opacity: 0, duration: 4 }, 16)
      // TITLE (p=.18): the Korean name joins the mark, cover lifts.
      .fromTo(ko, { opacity: 0, xPercent: -8 }, { opacity: 1, xPercent: 0, duration: 6 }, 18)
      .to(cover, { opacity: 0, duration: 6 }, 18)
      // FRAME (p=.26): the title hands off to the array of boxes.
      .fromTo(frame, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 4 }, 26)
      .to(titleGroup, { opacity: 0, duration: 5 }, 26)
      .fromTo(boxesWrap, { opacity: 0 }, { opacity: 1, duration: 4 }, 27)

    // SPLIT1..SPLIT4 (p=.32/.38/.44/.50): each level opens its own boundaries.
    for (let level = 1; level <= depth; level++) {
      const at = 32 + (level - 1) * 6
      gapLevel.forEach((lvl, i) => {
        if (lvl === level) tl.to(boxes[i], { marginRight: GAP, duration: 3 }, at)
      })
    }

    // SCATTER (p=.56): boxes swap to the shuffled order.
    tl.to(boxes, { xPercent: xPercentAt(0), duration: 6, stagger: 0.01 }, 56)

    // MERGE (p=.62/.70/.78/.86): one round per beat, spread evenly to p=.86.
    const rounds = trace.length - 1
    for (let r = 1; r <= rounds; r++) {
      const at = rounds > 1 ? 62 + ((r - 1) / (rounds - 1)) * 24 : 62
      tl.to(boxes, { xPercent: xPercentAt(r), duration: 6 }, at)
    }

    // SETTLE (p=1.00): boxes resolve back into the static title.
    tl.to(boxesWrap, { opacity: 0, duration: 6 }, 92).fromTo(
      titleGroup,
      { opacity: 0 },
      { opacity: 1, duration: 6 },
      92,
    )

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
      document.documentElement.classList.remove('act1-live')
    }
  }, [reduced, depth, gapLevel, trace])

  if (reduced) {
    return (
      <header className="act1 act1-static" id="top">
        <h1 className="sr-only">SHARC — 선린인터넷고등학교 알고리즘연구부</h1>
        <div className="act1-title-group">
          <Wordmark className="act1-mark" />
          <span className="act1-ko">알고리즘연구부</span>
        </div>
      </header>
    )
  }

  return (
    <header className="act1" id="top" ref={root}>
      <h1 className="sr-only">SHARC — 선린인터넷고등학교 알고리즘연구부</h1>
      <div className="act1-pin">
        <div className="act1-cover" />
        <div className="act1-title-group">
          <Wordmark className="act1-mark" />
          <span className="act1-ko">알고리즘연구부</span>
        </div>
        <div className="act1-frame" />
        <div className="act1-boxes">
          {leaves.map(([lo, hi]) => (
            <span className="act1-box" key={lo}>
              <span className="glyph">{GLYPHS.slice(lo, hi).join('')}</span>
            </span>
          ))}
        </div>
        <p className="pixel act1-hint">SCROLL ↓</p>
      </div>
    </header>
  )
}
