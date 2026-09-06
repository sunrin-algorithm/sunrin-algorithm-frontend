import { useMemo, useState } from 'react'
import { antiDiagonalOrder, cellKey, dependencies, filledCount } from '../lib/dp'
import { reduceMotion } from '../lib/motion'

type Props = {
  rows: string[]
  cols: string[]
  cells: (string | null)[][]
  /** 0..1, driven by Curriculum's own pin — the grid has no scroll logic of
      its own, since a trigger on an element inside a pin measures a screen
      position, not a document one, once the pin around it is applied. */
  progress: number
}

/** 2D prefix sum: how many topics you are carrying by the time you reach a cell. */
function prefixSums(cells: (string | null)[][]) {
  const dp: number[][] = cells.map((row) => row.map(() => 0))
  for (let i = 0; i < cells.length; i++) {
    for (let j = 0; j < cells[i].length; j++) {
      const w = cells[i][j] ? 1 : 0
      const up = i > 0 ? dp[i - 1][j] : 0
      const left = j > 0 ? dp[i][j - 1] : 0
      const diag = i > 0 && j > 0 ? dp[i - 1][j - 1] : 0
      dp[i][j] = w + up + left - diag
    }
  }
  return dp
}

/** Renders a dp term, or a plain 0 when the index falls off the table. */
const term = (dp: number[][], row: number, col: number) =>
  row < 0 || col < 0 ? '0' : `${dp[row][col]}`

export default function DpGrid({ rows, cols, cells, progress }: Props) {
  const dp = useMemo(() => prefixSums(cells), [cells])
  const order = useMemo(() => antiDiagonalOrder(rows.length, cols.length), [rows, cols])
  const rank = useMemo(
    () => new Map(order.map((c, k) => [cellKey(c.row, c.col), k])),
    [order],
  )

  const [hover, setHover] = useState<{ row: number; col: number } | null>(null)

  const filled = reduceMotion() ? order.length : filledCount(order.length, progress)
  const deps = hover ? dependencies(hover.row, hover.col) : []
  const depKeys = new Set(deps.map((d) => cellKey(d.row, d.col)))

  return (
    <div>
      <div className="dp-scroll">
        <div
          className="dp"
          role="table"
          aria-label="학기별 커리큘럼"
          style={{ ['--cols' as string]: cols.length }}
        >
          <div className="dp-corner pixel" role="columnheader">
            i \ j
          </div>
          {cols.map((col) => (
            <div className="dp-head pixel" role="columnheader" key={col}>
              {col}
            </div>
          ))}

          {rows.map((row, i) => (
            <div className="dp-row" style={{ display: 'contents' }} role="row" key={row}>
              <div className="dp-side pixel" role="rowheader">
                {row}
              </div>
              {cols.map((col, j) => {
                const r = rank.get(cellKey(i, j)) as number
                const isFilled = r < filled
                const lit = hover?.row === i && hover?.col === j
                const dep = depKeys.has(cellKey(i, j))
                return (
                  <div
                    className={`dp-cell${lit ? ' is-lit' : ''}${dep ? ' is-dep' : ''}`}
                    role="cell"
                    key={col}
                    data-filled={isFilled ? 1 : 0}
                    data-base={cells[i][j] ? 0 : 1}
                    onMouseEnter={() => setHover({ row: i, col: j })}
                    onMouseLeave={() => setHover(null)}
                  >
                    <span className="chip">{cells[i][j] ?? ''}</span>
                    <span className="val pixel-mono">Σ {dp[i][j]}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="dp-legend pixel-mono">
        {hover ? (
          <span>
            <b>
              dp[{hover.row}][{hover.col}]
            </b>{' '}
            = {term(dp, hover.row - 1, hover.col)} + {term(dp, hover.row, hover.col - 1)} −{' '}
            {term(dp, hover.row - 1, hover.col - 1)} + {cells[hover.row][hover.col] ? 1 : 0} ={' '}
            {dp[hover.row][hover.col]}
          </span>
        ) : (
          <span>
            dp[i][j] = dp[i−1][j] + dp[i][j−1] − dp[i−1][j−1] + w(i,j)
            <span className="hover-hint">
              {' '}
              — 칸에 커서를 올리면 이 칸이 어디에서 왔는지 표시됩니다
            </span>
          </span>
        )}
        <span>
          FILLED {String(filled).padStart(2, '0')} / {order.length}
        </span>
      </p>
    </div>
  )
}
