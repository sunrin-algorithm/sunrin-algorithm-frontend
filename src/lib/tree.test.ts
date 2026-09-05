import assert from 'node:assert/strict'
import test from 'node:test'
import { bfsOrder, buildTree, dfsOrder, inOrder, pathToRoot } from './tree.ts'

test('bfs walks level by level', () => {
  assert.deepEqual(bfsOrder(12), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  assert.deepEqual(bfsOrder(0), [])
})

test('dfs pre-order descends left first', () => {
  assert.deepEqual(dfsOrder(7), [0, 1, 3, 4, 2, 5, 6])
  assert.deepEqual(dfsOrder(12), [0, 1, 3, 7, 8, 4, 9, 10, 2, 5, 11, 6])
})

test('in-order visits every node exactly once, sorted left to right', () => {
  const order = inOrder(12)
  assert.equal(order.length, 12)
  assert.deepEqual([...order].sort((a, b) => a - b), [...Array(12).keys()])
  assert.deepEqual(inOrder(3), [1, 0, 2])
})

test('glyphs land so that the dfs walk spells the source string', () => {
  const glyphs = [...'알고리즘연구부SHARC']
  const { nodes, edges } = buildTree(glyphs)

  assert.equal(nodes.length, 12)
  assert.equal(edges.length, 11)

  const spelled = dfsOrder(12)
    .map((id) => nodes[id].glyph)
    .join('')
  assert.equal(spelled, '알고리즘연구부SHARC')

  // layout invariants: root on top, no two nodes stacked, depths consistent
  assert.equal(nodes[0].y, 0)
  assert.equal(nodes[0].parent, null)
  assert.equal(new Set(nodes.map((n) => n.x)).size, 12)
  assert.ok(nodes.every((n) => n.x > 0 && n.x < 1))
  assert.equal(nodes[7].depth, 3)
  assert.equal(nodes[7].parent, 3)

  // each edge is walked exactly when its child is visited
  assert.ok(edges.every((e) => e.visitOrder === nodes[e.to].visitOrder))
})

test('path to root reads the call stack from the root down', () => {
  assert.deepEqual(pathToRoot(0), [0])
  assert.deepEqual(pathToRoot(6), [0, 2, 6])
  assert.deepEqual(pathToRoot(10), [0, 1, 4, 10])
})
