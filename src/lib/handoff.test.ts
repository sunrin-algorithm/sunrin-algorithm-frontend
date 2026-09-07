import assert from 'node:assert/strict'
import test from 'node:test'
import { centerRect, lerpRect, pinShift } from './handoff.ts'

test('lerpRect interpolates x/y/w/h independently', () => {
  const a = { x: 0, y: 0, w: 10, h: 20 }
  const b = { x: 100, y: 50, w: 30, h: 60 }
  assert.deepEqual(lerpRect(a, b, 0), a)
  assert.deepEqual(lerpRect(a, b, 1), b)
  assert.deepEqual(lerpRect(a, b, 0.5), { x: 50, y: 25, w: 20, h: 40 })
})

test('centerRect centers a box of given size in the viewport', () => {
  assert.deepEqual(centerRect(1000, 800, 200, 100), { x: 400, y: 350, w: 200, h: 100 })
})

test('pinShift recovers the same pinned position from above, inside and below', () => {
  const start = 1000
  const end = 1600
  // A card whose natural document top is 1200, so it sits 200px down the
  // viewport for as long as the pin holds -- whichever way the scroll came.
  const docTop = 1200
  const roundTrip = (y: number) => {
    // Where the browser reports it, given the pin's translation, undone again.
    const live = docTop - y + pinShift(y, start, end)
    return live + y - pinShift(y, start, end) - start
  }

  assert.equal(pinShift(400, start, end), 0)
  assert.equal(pinShift(1300, start, end), 300)
  assert.equal(pinShift(5000, start, end), 600)
  for (const y of [0, 400, 1000, 1300, 1600, 5000]) assert.equal(roundTrip(y), docTop - start)
})
