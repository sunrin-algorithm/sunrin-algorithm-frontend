import assert from 'node:assert/strict'
import test from 'node:test'
import { centerRect, lerpRect, sizedAt } from './handoff.ts'

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

test('sizedAt keeps the given size, centered on the target rect', () => {
  const size = { x: 0, y: 0, w: 10, h: 20 }
  const at = { x: 100, y: 200, w: 50, h: 60 }
  assert.deepEqual(sizedAt(size, at), { x: 120, y: 220, w: 10, h: 20 })
})
