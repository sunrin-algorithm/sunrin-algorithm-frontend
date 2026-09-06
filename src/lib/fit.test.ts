import assert from 'node:assert/strict'
import test from 'node:test'
import { fitTop } from './fit.ts'

test('centers a block shorter than the viewport', () => {
  assert.equal(fitTop(600, 900, 88), 150)
})

test('clamps to the bar when centering would land above it', () => {
  assert.equal(fitTop(800, 900, 88), 88)
})

test('pins under the bar when the block is taller than the viewport', () => {
  assert.equal(fitTop(1200, 900, 88), 88)
})
