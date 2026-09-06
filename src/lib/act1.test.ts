import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GLYPHS,
  SCRAMBLED_A,
  SCRAMBLED_B,
  cameraFor,
  leafOrder,
  rowWidth,
} from './act1.ts'

test('GLYPHS is SHARC + 알고리즘연구부, 12 glyphs', () => {
  assert.equal(GLYPHS.length, 12)
  assert.equal(GLYPHS.join(''), 'SHARC알고리즘연구부')
})

test('the two scrambles spell the literal examples from the brief', () => {
  assert.equal(SCRAMBLED_A, 'RSCHA')
  assert.equal(SCRAMBLED_B, '고알즘리구부연')
})

test('leafOrder never interleaves the two words, and never lands on identity', () => {
  const order = leafOrder()
  assert.equal(order.length, 12)

  const a = order.slice(0, 5)
  const b = order.slice(5)
  assert.deepEqual([...a].sort((x, y) => x - y), [0, 1, 2, 3, 4])
  assert.deepEqual([...b].sort((x, y) => x - y), [5, 6, 7, 8, 9, 10, 11])
  assert.notDeepEqual(order, [...Array(12).keys()])
})

test('camera keeps every level within [0.6, 0.98] of viewport width, growing per level', () => {
  const viewports: [number, number][] = [
    [390, 780],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [1920, 1080],
  ]
  for (const [vw, vh] of viewports) {
    const scales = ([0, 1, 2] as const).map((level) => cameraFor(level, vw, vh).scale)
    for (const level of [0, 1, 2] as const) {
      const onScreen = rowWidth(level) * scales[level]
      assert.ok(onScreen <= vw * 0.98, `level ${level} overflows at ${vw}px`)
      assert.ok(onScreen >= vw * 0.6, `level ${level} too small at ${vw}px`)
    }
    assert.ok(scales[0] < scales[1] && scales[1] < scales[2], `camera should zoom in per level at ${vw}px`)
  }
})
