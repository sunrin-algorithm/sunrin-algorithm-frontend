import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

export const reduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * How long, in viewport heights, a section holds the screen its animation just
 * produced before letting go. Every pinned section spends this at the tail of
 * its pin, so the finished picture gets a beat to be looked at instead of being
 * yanked away on the frame it completes.
 */
export const SETTLE_VH = 0.45

let lenis: Lenis | null = null

/**
 * Act1 locks scroll before Lenis exists — its effect runs before App's
 * (children mount before parents). This flag lets a lock requested early
 * still apply the moment Lenis is actually created.
 */
let pendingLock = false

/** Lenis drives the scroll position; GSAP's ticker drives Lenis. */
export function initSmoothScroll(): () => void {
  if (reduceMotion()) return () => {}

  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 })
  if (pendingLock) lenis.stop()
  lenis.on('scroll', ScrollTrigger.update)

  const raf = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(raf)
    lenis?.destroy()
    lenis = null
  }
}

/** Anchor navigation that goes through Lenis when it is running. */
export function scrollToId(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  if (lenis) lenis.scrollTo(target, { offset: -8, duration: 1.15 })
  else target.scrollIntoView({ behavior: 'auto', block: 'start' })
}

/*
 * `overflow: hidden` alone doesn't hold: it stops scrollbars but not every
 * input path (trackpad rubber-banding, and plain `scrollTo` calls, still move
 * the page in some browsers). Block the inputs directly and snap back if
 * anything slips through regardless of cause.
 */
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])
const preventDefault = (e: Event) => e.preventDefault()
const blockScrollKeys = (e: KeyboardEvent) => {
  if (SCROLL_KEYS.has(e.key)) e.preventDefault()
}

let inputBlocked = false
let clampRaf = 0

// The 'scroll' event doesn't reliably fire for every path that can move
// scrollY (a bare `scrollTo` call moves it even under `overflow: hidden` in
// some engines), so the clamp polls every frame instead of listening for it.
const clampToTop = () => {
  if (window.scrollX || window.scrollY) window.scrollTo(0, 0)
  clampRaf = requestAnimationFrame(clampToTop)
}

export const setScrollLocked = (locked: boolean) => {
  pendingLock = locked
  document.body.style.overflow = locked ? 'hidden' : ''
  if (locked) lenis?.stop()
  else lenis?.start()

  if (locked === inputBlocked) return
  inputBlocked = locked
  const captureOpt = { capture: true }
  if (locked) {
    window.addEventListener('wheel', preventDefault, { passive: false, capture: true })
    window.addEventListener('touchmove', preventDefault, { passive: false, capture: true })
    window.addEventListener('keydown', blockScrollKeys, { passive: false, capture: true })
    clampRaf = requestAnimationFrame(clampToTop)
  } else {
    window.removeEventListener('wheel', preventDefault, captureOpt)
    window.removeEventListener('touchmove', preventDefault, captureOpt)
    window.removeEventListener('keydown', blockScrollKeys, captureOpt)
    cancelAnimationFrame(clampRaf)
  }
}

/** Mask-reveal every `.line > .line-i` inside `scope` when it scrolls in. */
export function revealLines(scope: Element, stagger = 0.075): () => void {
  const items = scope.querySelectorAll<HTMLElement>('.line > .line-i')
  if (!items.length || reduceMotion()) return () => {}

  const tween = gsap.fromTo(
    items,
    { yPercent: 112 },
    {
      yPercent: 0,
      duration: 0.95,
      ease: 'expo.out',
      stagger,
      scrollTrigger: { trigger: scope, start: 'top 84%', once: true },
    },
  )

  return () => {
    tween.scrollTrigger?.kill()
    tween.kill()
  }
}
