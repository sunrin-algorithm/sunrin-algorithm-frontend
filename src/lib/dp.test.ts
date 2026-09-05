import assert from 'node:assert/strict'
import test from 'node:test'
import { antiDiagonalOrder, cellKey, dependencies, filledCount } from './dp.ts'

test('anti-diagonal order covers the grid, never before its dependencies', () => {
  const rows = 3
  const cols = 5
  const order = antiDiagonalOrder(rows, cols)

  assert.equal(order.length, rows * cols)
  assert.equal(new Set(order.map((c) => cellKey(c.row, c.col))).size, rows * cols)

  const seen = new Set<string>()
  for (const cell of order) {
    for (const dep of dependencies(cell.row, cell.col)) {
      assert.ok(
        seen.has(cellKey(dep.row, dep.col)),
        `${cellKey(cell.row, cell.col)} filled before ${cellKey(dep.row, dep.col)}`,
      )
    }
    seen.add(cellKey(cell.row, cell.col))
  }

  assert.deepEqual(order[0], { row: 0, col: 0 })
  assert.deepEqual(order.at(-1), { row: rows - 1, col: cols - 1 })
})

test('dependencies clip at the grid edge', () => {
  assert.deepEqual(dependencies(0, 0), [])
  assert.deepEqual(dependencies(0, 2), [{ row: 0, col: 1 }])
  assert.deepEqual(dependencies(2, 0), [{ row: 1, col: 0 }])
  assert.equal(dependencies(1, 1).length, 3)
})

test('filledCount clamps to the table', () => {
  assert.equal(filledCount(15, -0.4), 0)
  assert.equal(filledCount(15, 0), 0)
  assert.equal(filledCount(15, 0.5), 8)
  assert.equal(filledCount(15, 1), 15)
  assert.equal(filledCount(15, 3), 15)
})
