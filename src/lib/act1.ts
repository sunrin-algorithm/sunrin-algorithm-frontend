/**
 * Act I world-space model: two fixed scrambles collapse into 12 leaf boxes,
 * merge in 2 stages (per-word, then whole-string) into a root box. Everything
 * below is in fixed "world" pixels; the camera (translate + scale) is what
 * fits a given stage into whatever viewport is actually open, so no box or
 * glyph geometry ever needs to know the viewport size.
 */

export const WORD_A = [...'SHARC']
export const WORD_B = [...'알고리즘연구부']
export const GLYPHS = [...WORD_A, ...WORD_B]

/** WORD_A[SCRAMBLE_A] spells "RSCHA". */
export const SCRAMBLE_A = [3, 0, 4, 1, 2]
/** WORD_B[SCRAMBLE_B] spells "고알즘리구부연". */
export const SCRAMBLE_B = [1, 0, 3, 2, 5, 6, 4]

export const SCRAMBLED_A = SCRAMBLE_A.map((i) => WORD_A[i]).join('')
export const SCRAMBLED_B = SCRAMBLE_B.map((i) => WORD_B[i]).join('')

/**
 * 12 leaf slots -> global glyph index (0..11). The first 5 slots are a
 * permutation of 0..4 (SHARC), the last 7 of 5..11 (알고리즘연구부) — the two
 * words never interleave, so the 2-stage merge below always lands on
 * "SHARC" then "알고리즘연구부".
 */
export function leafOrder(): number[] {
  return [...SCRAMBLE_A, ...SCRAMBLE_B.map((i) => i + 5)]
}

const SLOT_OF_GLYPH = ((order) => {
  const m = new Array<number>(12)
  order.forEach((g, slot) => (m[g] = slot))
  return m
})(leafOrder())

/** Glyph cell size and gaps, in world px. Constant across every stage. */
export const GW = 64
export const GH = 84
const GAP = 10
const WORD_GAP = 56
const LEVEL_GAP = 220

const LEAF_SPAN = 12 * GW + 11 * GAP
const MID_SPAN = 12 * GW + WORD_GAP
const ROOT_SPAN = MID_SPAN

export type Level = 0 | 1 | 2
export type Rect = { x: number; y: number; w: number; h: number }
export type Camera = { x: number; y: number; scale: number }

/** Total width spanned by a level's boxes, in world px. */
export function rowWidth(level: Level): number {
  return level === 0 ? LEAF_SPAN : level === 1 ? MID_SPAN : ROOT_SPAN
}

const levelY = (level: Level) => level * LEVEL_GAP

/** How much of the viewport width a level's row fills once the camera frames it. */
const FRAC: Record<Level, number> = { 0: 0.8, 1: 0.88, 2: 0.96 }

/**
 * The camera always centers a level's row: x stays put (every row is already
 * centered on world x=0), y and scale move — the "카메라가 앞으로 땡겨지고
 * 단계마다 중앙으로 이동" beat.
 */
export function cameraFor(level: Level, vw: number, vh: number): Camera {
  const scale = (FRAC[level] * vw) / rowWidth(level)
  return { x: vw / 2, y: vh / 2 - (levelY(level) + GH / 2) * scale, scale }
}

export function projectRect(r: Rect, cam: Camera): Rect {
  return { x: cam.x + r.x * cam.scale, y: cam.y + r.y * cam.scale, w: r.w * cam.scale, h: r.h * cam.scale }
}

export function leafBoxRect(slot: number): Rect {
  return { x: -LEAF_SPAN / 2 + slot * (GW + GAP), y: levelY(0), w: GW, h: GH }
}

export function midBoxRect(which: 0 | 1): Rect {
  const w0 = WORD_A.length * GW
  const w1 = WORD_B.length * GW
  const x0 = -MID_SPAN / 2
  return which === 0
    ? { x: x0, y: levelY(1), w: w0, h: GH }
    : { x: x0 + w0 + WORD_GAP, y: levelY(1), w: w1, h: GH }
}

export function rootBoxRect(): Rect {
  return { x: -ROOT_SPAN / 2, y: levelY(2), w: ROOT_SPAN, h: GH }
}

/** Bounding rect of just the leaf boxes' first row (used to seed the hull-shrink target). */
export function leafRowBounds(): Rect {
  const first = leafBoxRect(0)
  const last = leafBoxRect(11)
  return { x: first.x, y: first.y, w: last.x + last.w - first.x, h: GH }
}

const cellCenter = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })

export function leafGlyphCenter(g: number) {
  return cellCenter(leafBoxRect(SLOT_OF_GLYPH[g]))
}

export function midGlyphCenter(g: number) {
  const inA = g < WORD_A.length
  const box = midBoxRect(inA ? 0 : 1)
  const local = inA ? g : g - WORD_A.length
  return { x: box.x + GW * (local + 0.5), y: box.y + box.h / 2 }
}

export function rootGlyphCenter(g: number) {
  const r = rootBoxRect()
  const extra = g >= WORD_A.length ? WORD_GAP : 0
  return { x: r.x + GW * (g + 0.5) + extra, y: r.y + r.h / 2 }
}

export type WorldEdge = { x1: number; y1: number; x2: number; y2: number }

/** Leaf box -> its word's mid box. Static: only the drawn dash-offset animates. */
export function leafEdges(): WorldEdge[] {
  return leafOrder().map((g, slot) => {
    const a = leafBoxRect(slot)
    const b = midBoxRect(g < WORD_A.length ? 0 : 1)
    return { x1: a.x + a.w / 2, y1: a.y + a.h, x2: b.x + b.w / 2, y2: b.y }
  })
}

/** Mid box -> root box. */
export function midEdges(): WorldEdge[] {
  const root = rootBoxRect()
  return ([0, 1] as const).map((which) => {
    const a = midBoxRect(which)
    return { x1: a.x + a.w / 2, y1: a.y + a.h, x2: root.x + root.w / 2, y2: root.y }
  })
}
