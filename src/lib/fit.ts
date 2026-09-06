/**
 * Where a pinned block's top should land in the viewport so the whole block
 * fits on screen: centered when it's shorter than the viewport, pinned to the
 * fixed corner bar's clearance when it's taller — there's no fit to be had
 * then, so the top is the most of it a reader gets to see.
 */
export function fitTop(blockHeight: number, viewportHeight: number, bar: number): number {
  return Math.max((viewportHeight - blockHeight) / 2, bar)
}
