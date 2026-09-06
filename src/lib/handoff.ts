/**
 * Shared plumbing for Act II's 3 clone-based scroll handoffs (chip -> tree
 * root, class card -> calendar, dp cells -> team graph). GSAP Flip is
 * deliberately not used: every handoff is a single rect-lerp between a known
 * source and target, which this covers in a few pure functions.
 */

export type Rect = { x: number; y: number; w: number; h: number }

export function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    w: a.w + (b.w - a.w) * t,
    h: a.h + (b.h - a.h) * t,
  }
}

export function centerRect(vw: number, vh: number, w: number, h: number): Rect {
  return { x: vw / 2 - w / 2, y: vh / 2 - h / 2, w, h }
}

/** `size`'s width/height, centered on `at`'s midpoint — a move with no resize. */
export function sizedAt(size: Rect, at: Rect): Rect {
  const cx = at.x + at.w / 2
  const cy = at.y + at.h / 2
  return { x: cx - size.w / 2, y: cy - size.h / 2, w: size.w, h: size.h }
}

export function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height }
}

/** Pins an absolutely-positioned element to a viewport-space rect. */
export function placeAt(el: HTMLElement, r: Rect) {
  el.style.left = `${r.x}px`
  el.style.top = `${r.y}px`
  el.style.width = `${r.w}px`
  el.style.height = `${r.h}px`
}

/**
 * Clones `src` into `stage` (the fixed, full-viewport, pointer-events:none
 * layer), positioned to exactly cover `src`'s current rect. Caller drives
 * the clone's rect/opacity from there and calls the returned `destroy` once
 * the real element takes over.
 */
export function cloneInto(stage: HTMLElement, src: HTMLElement) {
  const clone = src.cloneNode(true) as HTMLElement
  clone.style.position = 'absolute'
  clone.style.margin = '0'
  placeAt(clone, rectOf(src))
  stage.appendChild(clone)

  return {
    clone,
    destroy: () => clone.remove(),
  }
}
