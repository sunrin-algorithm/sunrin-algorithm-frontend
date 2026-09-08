type Props = {
  rows: string[]
  cols: string[]
  cells: (string | null)[][]
}

export default function DpGrid({ rows, cols, cells }: Props) {
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
              <div className="dp-cell" role="cell" key={col} data-base={cells[i][j] ? 0 : 1}>
                <span className="chip">{cells[i][j] ?? ''}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
