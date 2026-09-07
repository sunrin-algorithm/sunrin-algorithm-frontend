import assert from 'node:assert/strict'
import test from 'node:test'
import { peakProgress } from './peak.ts'

test('peakProgress holds the furthest value through a rewind', () => {
  const p = peakProgress()
  assert.equal(p.push(0.4), 0.4)
  assert.equal(p.push(0.9), 0.9)
  assert.equal(p.push(0.1), 0.9)
  p.reset()
  assert.equal(p.push(0.1), 0.1)
})
