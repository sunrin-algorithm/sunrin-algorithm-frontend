/**
 * Array-backed complete binary tree: node `i` has children `2i+1` / `2i+2`.
 * Positions come from an in-order sweep, which is the classic tidy layout for
 * a binary tree and never lets two nodes share an x slot.
 */

export type TreeNode = {
  id: number
  depth: number
  parent: number | null
  /** 0..1 across the drawing area */
  x: number
  /** 0..1 down the drawing area */
  y: number
  glyph: string
  /** 1-based position in the pre-order (DFS) walk */
  visitOrder: number
}

export type Edge = {
  from: number
  to: number
  /** 1-based visit order of the child, i.e. when this edge gets walked */
  visitOrder: number
}

export const leftChild = (i: number) => 2 * i + 1
export const rightChild = (i: number) => 2 * i + 2
export const parentOf = (i: number) => (i === 0 ? null : Math.floor((i - 1) / 2))
export const depthOf = (i: number) => Math.floor(Math.log2(i + 1))

/** Level order — how the tree grows into view. */
export function bfsOrder(n: number): number[] {
  const out: number[] = []
  const queue = n > 0 ? [0] : []
  while (queue.length) {
    const i = queue.shift() as number
    out.push(i)
    for (const c of [leftChild(i), rightChild(i)]) if (c < n) queue.push(c)
  }
  return out
}

/** Pre-order DFS — how the traversal cursor walks the tree. */
export function dfsOrder(n: number): number[] {
  const out: number[] = []
  const stack = n > 0 ? [0] : []
  while (stack.length) {
    const i = stack.pop() as number
    out.push(i)
    if (rightChild(i) < n) stack.push(rightChild(i))
    if (leftChild(i) < n) stack.push(leftChild(i))
  }
  return out
}

/** In-order DFS — used only to assign horizontal slots. */
export function inOrder(n: number): number[] {
  const out: number[] = []
  const stack: number[] = []
  let cur: number | null = n > 0 ? 0 : null
  while (cur !== null || stack.length) {
    while (cur !== null && cur < n) {
      stack.push(cur)
      cur = leftChild(cur)
    }
    const i = stack.pop() as number
    out.push(i)
    cur = rightChild(i) < n ? rightChild(i) : null
  }
  return out
}

/**
 * Build the drawable tree. `glyphs[k]` lands on the node visited k-th by DFS,
 * so reading the walk in order spells the string back out.
 */
export function buildTree(glyphs: readonly string[]): { nodes: TreeNode[]; edges: Edge[] } {
  const n = glyphs.length
  const slots = inOrder(n)
  const xOf = new Map(slots.map((id, k) => [id, n === 1 ? 0.5 : (k + 0.5) / n]))
  const walk = dfsOrder(n)
  const orderOf = new Map(walk.map((id, k) => [id, k + 1]))
  const maxDepth = n > 0 ? depthOf(n - 1) : 0

  const nodes: TreeNode[] = Array.from({ length: n }, (_, id) => {
    const visitOrder = orderOf.get(id) as number
    return {
      id,
      depth: depthOf(id),
      parent: parentOf(id),
      x: xOf.get(id) as number,
      y: maxDepth === 0 ? 0.5 : depthOf(id) / maxDepth,
      glyph: glyphs[visitOrder - 1],
      visitOrder,
    }
  })

  const edges: Edge[] = nodes
    .filter((node) => node.parent !== null)
    .map((node) => ({
      from: node.parent as number,
      to: node.id,
      visitOrder: node.visitOrder,
    }))

  return { nodes, edges }
}
