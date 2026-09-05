import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GLYPHS,
  SPLIT_LEVELS,
  boundaryLevels,
  mergeTrace,
  scatterIndices,
} from './mergesort.ts'

test('GLYPHS has exactly the 12 indices every level partitions', () => {
  assert.equal(GLYPHS.length, 12)
})

test('each level tiles [0, 12) with no gaps or overlaps', () => {
  for (const level of SPLIT_LEVELS) {
    const sorted = [...level].sort((a, b) => a[0] - b[0])
    assert.equal(sorted[0][0], 0)
    assert.equal(sorted.at(-1)?.[1], 12)
    for (let i = 1; i < sorted.length; i++) {
      assert.equal(sorted[i][0], sorted[i - 1][1], `gap/overlap before index ${i}`)
    }
  }
})

test('each level nests inside the parent level', () => {
  for (let l = 1; l < SPLIT_LEVELS.length; l++) {
    for (const [lo, hi] of SPLIT_LEVELS[l]) {
      const fits = SPLIT_LEVELS[l - 1].some(([plo, phi]) => plo <= lo && hi <= phi)
      assert.ok(fits, `level ${l} interval [${lo},${hi}) has no parent in level ${l - 1}`)
    }
  }
})

test('boundaryLevels stays within [1, depth] and has one entry per gap', () => {
  for (const depth of [2, 3, 4] as const) {
    const levels = boundaryLevels(depth)
    assert.equal(levels.length, SPLIT_LEVELS[depth].length - 1)
    assert.ok(levels.every((l) => l >= 1 && l <= depth))
  }
})

test('scatterIndices is a permutation of 0..n-1, and never the identity', () => {
  for (const depth of [2, 3, 4] as const) {
    const order = scatterIndices(depth)
    const n = SPLIT_LEVELS[depth].length
    assert.deepEqual([...order].sort((a, b) => a - b), [...Array(n).keys()])
    assert.notDeepEqual(order, [...Array(n).keys()])
  }
})

test('depths 2, 3, and 4 all merge-sort back to natural box order', () => {
  for (const depth of [2, 3, 4] as const) {
    const n = SPLIT_LEVELS[depth].length
    const trace = mergeTrace(scatterIndices(depth))
    assert.deepEqual(trace.at(-1), [[...Array(n).keys()]])
  }
})
