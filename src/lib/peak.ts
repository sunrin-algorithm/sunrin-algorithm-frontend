/**
 * A high-water mark for a 0..1 scroll progress.
 *
 * Scrolling back up through a finished animation replays it in reverse, which
 * leaves a half-erased picture on screen — a tree with three of its six edges
 * still drawn reads as broken, not as rewinding. Latching the furthest value
 * keeps whatever was drawn drawn; the owner calls `reset` from `onLeaveBack`,
 * so the animation only ever replays after the section has been left entirely.
 */
export function peakProgress() {
  let peak = 0
  return {
    /** Records `v` and returns the furthest value seen so far. */
    push: (v: number) => (peak = Math.max(peak, v)),
    reset: () => {
      peak = 0
    },
  }
}
