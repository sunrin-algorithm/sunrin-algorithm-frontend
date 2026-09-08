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

export default function DpGrid({ rows, cols, cells, progress }: Props) {
  const total = rows.length * cols.length
  // Row-major sweep: the grid fills the way the year runs, top to bottom.
  const filled = reduceMotion()
    ? total
    : Math.max(0, Math.min(total, Math.round(progress * total)))

  return (
    <div className="dp-scroll">
      <div
        className="dp"
        role="table"
        aria-label="학기별 커리큘럼"
        style={{ ['--cols' as string]: cols.length }}
      >
        <div className="dp-corner" role="columnheader" />
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
            {cols.map((col, j) => (
              <div
                className="dp-cell"
                role="cell"
                key={col}
                data-filled={i * cols.length + j < filled ? 1 : 0}
                data-base={cells[i][j] ? 0 : 1}
              >
                <span className="chip">{cells[i][j] ?? ''}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
