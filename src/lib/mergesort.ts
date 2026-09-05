export type Interval = readonly [number, number]

/** S H A R C 알 고 리 즘 연 구 부 — indices 0-11, in reading order. */
export const GLYPHS = [...'SHARC알고리즘연구부']

/**
 * Fixed word-boundary split tree, not computed midpoints — a real merge sort
 * on this string would never split "SH·A·R·C" or "알고·리즘·연구·부" out of
 * `mid = (lo + hi) >> 1`, but those are the seams that read as real words.
 */
export const SPLIT_LEVELS: Interval[][] = [
  [[0, 12]],
  [[0, 5], [5, 12]],
  [[0, 3], [3, 5], [5, 9], [9, 12]],
  [[0, 2], [2, 3], [3, 4], [4, 5], [5, 7], [7, 9], [9, 11], [11, 12]],
  [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
    [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12],
  ],
]

/** A fixed shuffle: every merge level below has to actually swap something. */
export const SCATTER = [7, 2, 11, 4, 0, 9, 1, 10, 5, 3, 8, 6]

export type Depth = 2 | 3 | 4

/** How many split levels a viewport this wide can show as separate boxes. */
export function depthForWidth(width: number): Depth {
  if (width < 640) return 2
  if (width < 1024) return 3
  return 4
}

/**
 * For each internal boundary between adjacent boxes at `depth`, the smallest
 * level whose split first cuts there — i.e. which SPLIT beat first opens
 * that gap. Boxes at a capped depth only ever see boundaries up to `depth`.
 */
export function boundaryLevels(depth: Depth): number[] {
  const leaves = SPLIT_LEVELS[depth]
  return leaves.slice(0, -1).map(([, cut]) =>
    SPLIT_LEVELS.findIndex((level) => level.some(([, hi]) => hi === cut)),
  )
}

/** `SCATTER`, expressed as a permutation of box positions 0..leaves.length-1. */
export function scatterIndices(depth: Depth): number[] {
  const leaves = SPLIT_LEVELS[depth]
  return leaves
    .map((_, i) => i)
    .sort((a, b) => SCATTER.indexOf(leaves[a][0]) - SCATTER.indexOf(leaves[b][0]))
}

/**
 * Bottom-up merge sort over box positions: pairs up adjacent runs and
 * interleaves each pair by value, one round per returned entry, until a
 * single fully-sorted run remains. Position values double as sort keys,
 * since natural (unscattered) box order is already sorted order.
 */
export function mergeTrace(order: number[]): number[][][] {
  const trace: number[][][] = [order.map((i) => [i])]
  while (trace.at(-1)!.length > 1) {
    const runs = trace.at(-1)!
    const next: number[][] = []
    for (let i = 0; i < runs.length; i += 2) {
      if (i + 1 >= runs.length) {
        next.push(runs[i])
        continue
      }
      const [a, b] = [runs[i], runs[i + 1]]
      const merged: number[] = []
      let ai = 0
      let bi = 0
      while (ai < a.length || bi < b.length) {
        merged.push(bi >= b.length || (ai < a.length && a[ai] < b[bi]) ? a[ai++] : b[bi++])
      }
      next.push(merged)
    }
    trace.push(next)
  }
  return trace
}
