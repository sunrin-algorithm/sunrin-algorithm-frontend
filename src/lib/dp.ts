/**
 * Bottom-up DP table order. Cells on the same anti-diagonal (i + j) depend on
 * nothing but earlier diagonals, so filling diagonal by diagonal is both the
 * real evaluation order and the wave the curriculum grid animates on.
 */

export type Cell = { row: number; col: number }

/** Every cell, ordered by anti-diagonal then row. */
export function antiDiagonalOrder(rows: number, cols: number): Cell[] {
  const out: Cell[] = []
  for (let d = 0; d <= rows + cols - 2; d++) {
    for (let row = 0; row < rows; row++) {
      const col = d - row
      if (col >= 0 && col < cols) out.push({ row, col })
    }
  }
  return out
}

/** The three predecessors of the LCS/knapsack recurrence, clipped to the grid. */
export function dependencies(row: number, col: number): Cell[] {
  return [
    { row: row - 1, col: col - 1 },
    { row: row - 1, col },
    { row, col: col - 1 },
  ].filter((c) => c.row >= 0 && c.col >= 0)
}

/** How many cells of `order` are filled at scroll progress `p` (0..1). */
export function filledCount(total: number, p: number): number {
  return Math.max(0, Math.min(total, Math.round(p * total)))
}

/** Stable key for a cell, so lookups don't need nested maps. */
export const cellKey = (row: number, col: number) => `${row}:${col}`
