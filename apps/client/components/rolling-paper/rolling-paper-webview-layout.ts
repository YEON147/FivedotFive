/**
 * 롤링페이퍼 웹뷰 액자 — 포스트잇 % 배치.
 * 순차 배치(랜덤 후보 + SAT 충돌) + 실패 시 폴백. 겹침 없는 결과만 반환.
 */

import {
  webviewAxisRectToObbSquare,
  webviewPostitObbSquare,
  webviewSatObbOverlap,
} from "./rolling-paper-webview-collision";

export const ROLLING_WEBVIEW_MAX_POSTITS = 30;

export const ROLLING_WEBVIEW_FRAME_W_OVER_H = 3 / 2;

export const ROLLING_WEBVIEW_POLAROID_WIDTH_PCT = 27;
export const ROLLING_WEBVIEW_POLAROID_PAD_X = 3.6;
export const ROLLING_WEBVIEW_POLAROID_PAD_Y = 7.2;

export type RollingWebviewRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type RollingWebviewPostitSlotStyle = {
  leftPct: number;
  topPct: number;
  rotateDeg: number;
  widthPct: number;
  z: number;
};

export type RollingWebviewLayoutInput = {
  count: number;
  seedKey: string;
  layoutRevision: number;
};

export type RollingWebviewLayoutResult = {
  slots: RollingWebviewPostitSlotStyle[];
  attemptsUsed: number;
  /** 항상 true — 폴백까지 포함해 검증된 배치만 반환 */
  overlapFree: true;
  placementMode: "sequential" | "fallback";
};

const FRAME_INSET_PCT = 2.8;
const POSTIT_PAIR_GAP_PCT = 2.15;
/** SAT OBB 반축에 더하는 여유(포스트잇끼리 + PNG 여백 보수) */
const SAT_NOTE_PAD = POSTIT_PAIR_GAP_PCT / 2 + 0.42;
const SAT_FORBID_PAD = 0.55;

const SLOT_RING_HORIZ = 0.94;
const SLOT_RING_VERT = SLOT_RING_HORIZ * ROLLING_WEBVIEW_FRAME_W_OVER_H;

const GOLD = (Math.sqrt(5) - 1) / 2;

const SEQUENTIAL_GLOBAL_PASSES = 10;
const SAMPLES_PER_FREE_NOTE = 420;
const ANCHOR_MICRO_SHIFT_TRIES = 24;
const FALLBACK_RING_STEPS = 110;
const WIDTH_SHRINK_PASSES = 9;

function hashStringToUint32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let p = 0; p < s.length; p += 1) {
    h ^= s.charCodeAt(p);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollingWebviewPolaroidForbiddenRect(): RollingWebviewRect {
  const halfW = ROLLING_WEBVIEW_POLAROID_WIDTH_PCT / 2 + ROLLING_WEBVIEW_POLAROID_PAD_X;
  const halfH =
    ((ROLLING_WEBVIEW_POLAROID_WIDTH_PCT / 100) * (5 / 4) * 0.5) *
      ROLLING_WEBVIEW_FRAME_W_OVER_H *
      100 +
    ROLLING_WEBVIEW_POLAROID_PAD_Y;
  const captionBelow = 4.1;
  return {
    left: 50 - halfW,
    top: 50 - halfH,
    right: 50 + halfW,
    bottom: 50 + halfH + captionBelow,
  };
}

function frameInnerRect(): RollingWebviewRect {
  const m = FRAME_INSET_PCT;
  return { left: m, top: m, right: 100 - m, bottom: 100 - m };
}

function postitVerticalHalfHeightPct(widthPct: number): number {
  return (widthPct / 100) * (2 / 5) * ROLLING_WEBVIEW_FRAME_W_OVER_H * 100;
}

export function rollingWebviewRectsOverlap(a: RollingWebviewRect, b: RollingWebviewRect): boolean {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

export function rollingWebviewPostitRotatedOuterAabb(
  cxPct: number,
  cyPct: number,
  widthPct: number,
  rotateDeg: number,
): RollingWebviewRect {
  const rad = (rotateDeg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  const hxFrac = widthPct / 200;
  const hyFrac = postitVerticalHalfHeightPct(widthPct) / 100;
  const halfWpct =
    100 * (hxFrac * c + (hyFrac / ROLLING_WEBVIEW_FRAME_W_OVER_H) * s);
  const halfHpct = 100 * (hxFrac * ROLLING_WEBVIEW_FRAME_W_OVER_H * s + hyFrac * c);
  return {
    left: cxPct - halfWpct,
    right: cxPct + halfWpct,
    top: cyPct - halfHpct,
    bottom: cyPct + halfHpct,
  };
}

function postitOverlapsPolaroidAabb(
  cx: number,
  cy: number,
  widthPct: number,
  rotateDeg: number,
  forbid: RollingWebviewRect,
): boolean {
  return rollingWebviewRectsOverlap(
    rollingWebviewPostitRotatedOuterAabb(cx, cy, widthPct, rotateDeg),
    forbid,
  );
}

function slotCenterForRing(angle: number, ring: number): { cx: number; cy: number } {
  return {
    cx: 50 + ring * Math.cos(angle) * SLOT_RING_HORIZ,
    cy: 50 + ring * Math.sin(angle) * SLOT_RING_VERT,
  };
}

function minRingOutsidePolaroid(
  angle: number,
  widthPct: number,
  rotateDeg: number,
  forbid: RollingWebviewRect,
): number {
  let lo = 0;
  let hi = 62;
  for (let k = 0; k < 28; k += 1) {
    const mid = (lo + hi) / 2;
    const { cx, cy } = slotCenterForRing(angle, mid);
    if (postitOverlapsPolaroidAabb(cx, cy, widthPct, rotateDeg, forbid)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return Math.min(58, hi + 0.95);
}

function nudgeCenterOutsidePolaroid(
  cx: number,
  cy: number,
  widthPct: number,
  rotateDeg: number,
  forbid: RollingWebviewRect,
): { cx: number; cy: number } {
  if (!postitOverlapsPolaroidAabb(cx, cy, widthPct, rotateDeg, forbid)) {
    return { cx, cy };
  }
  let x = cx;
  let y = cy;
  let dx = x - 50;
  let dy = y - 50;
  let len = Math.hypot(dx, dy);
  if (len < 1e-6) {
    dx = 1;
    dy = 0;
    len = 1;
  }
  dx /= len;
  dy /= len;
  const step = 0.85;
  for (let k = 0; k < 260; k += 1) {
    if (!postitOverlapsPolaroidAabb(x, y, widthPct, rotateDeg, forbid)) {
      return { cx: x, cy: y };
    }
    x += dx * step;
    y += dy * step;
  }
  const perpX = -dy;
  const perpY = dx;
  for (let k = 0; k < 100; k += 1) {
    x += perpX * step;
    y += perpY * step;
    if (!postitOverlapsPolaroidAabb(x, y, widthPct, rotateDeg, forbid)) {
      return { cx: x, cy: y };
    }
  }
  return { cx: x, cy: y };
}

function clampCenterInsideFrame(
  cx: number,
  cy: number,
  widthPct: number,
  rotateDeg: number,
  bounds: RollingWebviewRect,
): { cx: number; cy: number } {
  let nx = cx;
  let ny = cy;
  for (let k = 0; k < 6; k += 1) {
    const a = rollingWebviewPostitRotatedOuterAabb(nx, ny, widthPct, rotateDeg);
    let moved = false;
    if (a.left < bounds.left) {
      nx += bounds.left - a.left;
      moved = true;
    }
    if (a.right > bounds.right) {
      nx -= a.right - bounds.right;
      moved = true;
    }
    if (a.top < bounds.top) {
      ny += bounds.top - a.top;
      moved = true;
    }
    if (a.bottom > bounds.bottom) {
      ny -= a.bottom - bounds.bottom;
      moved = true;
    }
    if (!moved) break;
  }
  return { cx: nx, cy: ny };
}

function verticalAnchorSlots(count: number): { top: number[]; bot: number[] } {
  if (count < 2) return { top: [], bot: [] };
  if (count === 2) return { top: [0], bot: [1] };
  if (count === 3) return { top: [0], bot: [1] };
  const t1 = 0;
  const t2 = Math.max(1, Math.min(count - 2, 1 + Math.floor(count * 0.2)));
  const b1 = count - 1;
  let b2 = Math.max(1, Math.min(count - 2, count - 2 - Math.max(1, Math.floor(count * 0.12))));
  const uniq = new Set([t1, t2, b1, b2]);
  if (uniq.size < 4) {
    for (let k = 1; k < count - 1; k += 1) {
      if (!uniq.has(k)) {
        b2 = k;
        break;
      }
    }
  }
  return { top: [t1, t2], bot: [b1, b2] };
}

function anchorPostitAbovePolaroid(
  widthPct: number,
  rotateDeg: number,
  forbid: RollingWebviewRect,
  inner: RollingWebviewRect,
  cxBias: number,
): { cx: number; cy: number } {
  const cx = 50 + cxBias;
  let lo = inner.top + 1.2;
  let hi = forbid.top - 0.55;
  if (hi <= lo) {
    const pol = nudgeCenterOutsidePolaroid(cx, lo, widthPct, rotateDeg, forbid);
    return clampCenterInsideFrame(pol.cx, pol.cy, widthPct, rotateDeg, inner);
  }
  while (lo < hi - 0.04 && postitOverlapsPolaroidAabb(cx, lo, widthPct, rotateDeg, forbid)) {
    lo += 1.1;
  }
  if (!postitOverlapsPolaroidAabb(cx, hi, widthPct, rotateDeg, forbid)) {
    const pol = nudgeCenterOutsidePolaroid(cx, hi, widthPct, rotateDeg, forbid);
    return clampCenterInsideFrame(pol.cx, pol.cy, widthPct, rotateDeg, inner);
  }
  for (let k = 0; k < 26; k += 1) {
    const mid = (lo + hi) / 2;
    if (postitOverlapsPolaroidAabb(cx, mid, widthPct, rotateDeg, forbid)) hi = mid;
    else lo = mid;
  }
  const pol = nudgeCenterOutsidePolaroid(cx, lo, widthPct, rotateDeg, forbid);
  return clampCenterInsideFrame(pol.cx, pol.cy, widthPct, rotateDeg, inner);
}

function anchorPostitBelowPolaroid(
  widthPct: number,
  rotateDeg: number,
  forbid: RollingWebviewRect,
  inner: RollingWebviewRect,
  cxBias: number,
): { cx: number; cy: number } {
  const cx = 50 + cxBias;
  let lo = forbid.bottom + 0.55;
  let hi = inner.bottom - 1.2;
  if (hi <= lo) {
    const pol = nudgeCenterOutsidePolaroid(cx, hi, widthPct, rotateDeg, forbid);
    return clampCenterInsideFrame(pol.cx, pol.cy, widthPct, rotateDeg, inner);
  }
  if (!postitOverlapsPolaroidAabb(cx, lo, widthPct, rotateDeg, forbid)) {
    const pol = nudgeCenterOutsidePolaroid(cx, lo, widthPct, rotateDeg, forbid);
    return clampCenterInsideFrame(pol.cx, pol.cy, widthPct, rotateDeg, inner);
  }
  if (postitOverlapsPolaroidAabb(cx, hi, widthPct, rotateDeg, forbid)) {
    const pol = nudgeCenterOutsidePolaroid(cx, hi, widthPct, rotateDeg, forbid);
    return clampCenterInsideFrame(pol.cx, pol.cy, widthPct, rotateDeg, inner);
  }
  for (let k = 0; k < 26; k += 1) {
    const mid = (lo + hi) / 2;
    if (postitOverlapsPolaroidAabb(cx, mid, widthPct, rotateDeg, forbid)) lo = mid;
    else hi = mid;
  }
  const pol = nudgeCenterOutsidePolaroid(cx, hi, widthPct, rotateDeg, forbid);
  return clampCenterInsideFrame(pol.cx, pol.cy, widthPct, rotateDeg, inner);
}

function widthScaleForCount(count: number): number {
  if (count <= 8) return 1;
  return Math.max(0.62, 1 - (count - 8) * 0.026);
}

function baseWidthPct(i: number): number {
  return 17 + (i % 3) * 1.05;
}

function rotateDegForIndex(i: number): number {
  return (((i * 17) % 11) - 5) * 1.05;
}

type ObbSq = ReturnType<typeof webviewPostitObbSquare>;

function aabbInsideInner(
  cx: number,
  cy: number,
  widthPct: number,
  rotateDeg: number,
  inner: RollingWebviewRect,
): boolean {
  const bb = rollingWebviewPostitRotatedOuterAabb(cx, cy, widthPct, rotateDeg);
  return (
    bb.left >= inner.left - 1e-3 &&
    bb.right <= inner.right + 1e-3 &&
    bb.top >= inner.top - 1e-3 &&
    bb.bottom <= inner.bottom + 1e-3
  );
}

function fitsAgainstPlaced(
  cx: number,
  cy: number,
  widthPct: number,
  rotateDeg: number,
  selfObb: ObbSq,
  forbidObb: ObbSq,
  placed: ObbSq[],
  inner: RollingWebviewRect,
): boolean {
  if (!aabbInsideInner(cx, cy, widthPct, rotateDeg, inner)) return false;
  if (webviewSatObbOverlap(selfObb, forbidObb)) return false;
  for (const p of placed) {
    if (webviewSatObbOverlap(selfObb, p)) return false;
  }
  return true;
}

function shuffleOrder(indices: number[], rng: () => number): void {
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const t = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = t;
  }
}

function buildPlacementOrder(count: number, anchorIdx: Set<number>, rng: () => number): number[] {
  const anchors: number[] = [];
  const free: number[] = [];
  for (let i = 0; i < count; i += 1) {
    if (anchorIdx.has(i)) anchors.push(i);
    else free.push(i);
  }
  anchors.sort((a, b) => a - b);
  shuffleOrder(free, rng);
  return [...anchors, ...free];
}

function tryAnchorWithShifts(
  i: number,
  widthPct: number,
  rotateDeg: number,
  forbid: RollingWebviewRect,
  inner: RollingWebviewRect,
  vTop: number[],
  vBot: number[],
  placed: ObbSq[],
  forbidObb: ObbSq,
): { cx: number; cy: number } | null {
  const shifts = [0, -1.1, 1.1, -2.2, 2.2, -3.3, 3.3, -4.4, 4.4];
  for (const sh of shifts) {
    let cx: number;
    let cy: number;
    if (vTop.includes(i)) {
      const cxBias = (i === vTop[0] ? -8.2 : 8.2) + sh;
      const p = anchorPostitAbovePolaroid(widthPct, rotateDeg, forbid, inner, cxBias);
      cx = p.cx;
      cy = p.cy;
    } else if (vBot.includes(i)) {
      const cxBias = (i === vBot[0] ? 8.2 : -8.2) + sh;
      const p = anchorPostitBelowPolaroid(widthPct, rotateDeg, forbid, inner, cxBias);
      cx = p.cx;
      cy = p.cy;
    } else {
      return null;
    }
    const selfObb = webviewPostitObbSquare(cx, cy, widthPct, rotateDeg, SAT_NOTE_PAD);
    if (fitsAgainstPlaced(cx, cy, widthPct, rotateDeg, selfObb, forbidObb, placed, inner)) {
      return { cx, cy };
    }
  }
  return null;
}

function trySequentialPlacementOnce(
  count: number,
  forbid: RollingWebviewRect,
  inner: RollingWebviewRect,
  anchorIdx: Set<number>,
  vTop: number[],
  vBot: number[],
  rng: () => number,
  widthScale: number,
): RollingWebviewPostitSlotStyle[] | null {
  const forbidObb = webviewAxisRectToObbSquare(forbid, SAT_FORBID_PAD);
  const placed: ObbSq[] = [];
  const slots: RollingWebviewPostitSlotStyle[] = new Array(count);
  const order = buildPlacementOrder(count, anchorIdx, rng);

  for (const i of order) {
    const rotateDeg = rotateDegForIndex(i);
    const widthPct = baseWidthPct(i) * widthScale;
    const z = 5 + (i % 8);

    if (anchorIdx.has(i)) {
      const p = tryAnchorWithShifts(i, widthPct, rotateDeg, forbid, inner, vTop, vBot, placed, forbidObb);
      if (!p) return null;
      slots[i] = { leftPct: p.cx, topPct: p.cy, rotateDeg, widthPct, z };
      placed.push(webviewPostitObbSquare(p.cx, p.cy, widthPct, rotateDeg, SAT_NOTE_PAD));
      continue;
    }

    const goldT = ((i + 1) * GOLD) % 1;
    let placedOne = false;
    for (let s = 0; s < SAMPLES_PER_FREE_NOTE; s += 1) {
      const angleJitter = (rng() - 0.5) * 0.62;
      const angle = -Math.PI / 2 + goldT * 2 * Math.PI + angleJitter + (s % 7) * 0.09;
      const baseRing = minRingOutsidePolaroid(angle, widthPct, rotateDeg, forbid);
      const shell = Math.floor(i / 8) * 2.85;
      const rNoise = (rng() - 0.5) * 3.1 + (s / SAMPLES_PER_FREE_NOTE) * 4.2;
      const ring = Math.max(baseRing + 0.35, baseRing + shell + 0.5 + rNoise);
      const ringPos = slotCenterForRing(angle, ring);
      let cx = ringPos.cx;
      let cy = ringPos.cy;
      const pol = nudgeCenterOutsidePolaroid(cx, cy, widthPct, rotateDeg, forbid);
      cx = pol.cx;
      cy = pol.cy;
      const cl = clampCenterInsideFrame(cx, cy, widthPct, rotateDeg, inner);
      cx = cl.cx;
      cy = cl.cy;
      const selfObb = webviewPostitObbSquare(cx, cy, widthPct, rotateDeg, SAT_NOTE_PAD);
      if (fitsAgainstPlaced(cx, cy, widthPct, rotateDeg, selfObb, forbidObb, placed, inner)) {
        slots[i] = { leftPct: cx, topPct: cy, rotateDeg, widthPct, z };
        placed.push(selfObb);
        placedOne = true;
        break;
      }
    }
    if (!placedOne) return null;
  }

  return slots;
}

function verifyLayoutSat(
  slots: RollingWebviewPostitSlotStyle[],
  forbid: RollingWebviewRect,
  inner: RollingWebviewRect,
): boolean {
  const forbidObb = webviewAxisRectToObbSquare(forbid, SAT_FORBID_PAD);
  const obs: ObbSq[] = [];
  for (let i = 0; i < slots.length; i += 1) {
    const s = slots[i]!;
    if (!aabbInsideInner(s.leftPct, s.topPct, s.widthPct, s.rotateDeg, inner)) return false;
    const o = webviewPostitObbSquare(s.leftPct, s.topPct, s.widthPct, s.rotateDeg, SAT_NOTE_PAD);
    if (webviewSatObbOverlap(o, forbidObb)) return false;
    for (const p of obs) {
      if (webviewSatObbOverlap(o, p)) return false;
    }
    obs.push(o);
  }
  return true;
}

function buildFallbackRingLayout(
  count: number,
  forbid: RollingWebviewRect,
  inner: RollingWebviewRect,
  rng: () => number,
  widthScale: number,
): RollingWebviewPostitSlotStyle[] | null {
  const forbidObb = webviewAxisRectToObbSquare(forbid, SAT_FORBID_PAD);

  for (let step = 0; step < FALLBACK_RING_STEPS; step += 1) {
    const R = 26 + step * 0.32;
    const placed: ObbSq[] = [];
    const slots: RollingWebviewPostitSlotStyle[] = [];
    let ok = true;
    for (let i = 0; i < count; i += 1) {
      const rotateDeg = rotateDegForIndex(i);
      const widthPct = baseWidthPct(i) * widthScale * (0.86 + (step % 3) * 0.02);
      const z = 5 + (i % 8);
      const angle =
        -Math.PI / 2 + (i / Math.max(1, count)) * 2 * Math.PI + (rng() - 0.5) * 0.06 + step * 0.003;
      let cx = 50 + R * Math.cos(angle) * SLOT_RING_HORIZ;
      let cy = 50 + R * Math.sin(angle) * SLOT_RING_VERT;
      const pol = nudgeCenterOutsidePolaroid(cx, cy, widthPct, rotateDeg, forbid);
      cx = pol.cx;
      cy = pol.cy;
      const cl = clampCenterInsideFrame(cx, cy, widthPct, rotateDeg, inner);
      cx = cl.cx;
      cy = cl.cy;
      const selfObb = webviewPostitObbSquare(cx, cy, widthPct, rotateDeg, SAT_NOTE_PAD);
      if (!fitsAgainstPlaced(cx, cy, widthPct, rotateDeg, selfObb, forbidObb, placed, inner)) {
        ok = false;
        break;
      }
      slots.push({ leftPct: cx, topPct: cy, rotateDeg, widthPct, z });
      placed.push(selfObb);
    }
    if (ok && verifyLayoutSat(slots, forbid, inner)) {
      return slots;
    }
  }
  return null;
}

/** 최후 수단: 반지름·폭을 줄여 원 위에 균등 배치 */
function buildMinimalRadialLayout(
  count: number,
  forbid: RollingWebviewRect,
  inner: RollingWebviewRect,
): RollingWebviewPostitSlotStyle[] {
  const forbidObb = webviewAxisRectToObbSquare(forbid, SAT_FORBID_PAD);
  let widthScale = 0.52;
  for (let shrink = 0; shrink < 42; shrink += 1) {
    for (let R = 22; R <= 58; R += 0.4) {
      const placed: ObbSq[] = [];
      const slots: RollingWebviewPostitSlotStyle[] = [];
      let ok = true;
      for (let i = 0; i < count; i += 1) {
        const rotateDeg = rotateDegForIndex(i);
        const widthPct = baseWidthPct(i) * widthScale;
        const z = 5 + (i % 8);
        const angle = -Math.PI / 2 + (i / Math.max(1, count)) * 2 * Math.PI;
        let cx = 50 + R * Math.cos(angle) * SLOT_RING_HORIZ;
        let cy = 50 + R * Math.sin(angle) * SLOT_RING_VERT;
        const pol = nudgeCenterOutsidePolaroid(cx, cy, widthPct, rotateDeg, forbid);
        cx = pol.cx;
        cy = pol.cy;
        const cl = clampCenterInsideFrame(cx, cy, widthPct, rotateDeg, inner);
        cx = cl.cx;
        cy = cl.cy;
        const selfObb = webviewPostitObbSquare(cx, cy, widthPct, rotateDeg, SAT_NOTE_PAD);
        if (!fitsAgainstPlaced(cx, cy, widthPct, rotateDeg, selfObb, forbidObb, placed, inner)) {
          ok = false;
          break;
        }
        slots.push({ leftPct: cx, topPct: cy, rotateDeg, widthPct, z });
        placed.push(selfObb);
      }
      if (ok && verifyLayoutSat(slots, forbid, inner)) {
        return slots;
      }
    }
    widthScale *= 0.94;
  }
  return [];
}

export function computeRollingWebviewPostitLayout(
  input: RollingWebviewLayoutInput,
): RollingWebviewLayoutResult {
  const count = Math.min(Math.max(0, input.count), ROLLING_WEBVIEW_MAX_POSTITS);
  if (count === 0) {
    return { slots: [], attemptsUsed: 0, overlapFree: true, placementMode: "sequential" };
  }

  const forbid = rollingWebviewPolaroidForbiddenRect();
  const inner = frameInnerRect();
  const { top: vTop, bot: vBot } = verticalAnchorSlots(count);
  const anchorIdx = new Set<number>([...vTop, ...vBot]);

  const baseSeed =
    hashStringToUint32(input.seedKey) ^
    (Math.imul(input.layoutRevision | 0, 2654435761) >>> 0);

  let attempts = 0;
  let widthScale = widthScaleForCount(count);

  for (let shrinkPass = 0; shrinkPass < WIDTH_SHRINK_PASSES; shrinkPass += 1) {
    for (let pass = 0; pass < SEQUENTIAL_GLOBAL_PASSES; pass += 1) {
      attempts += 1;
      const rng = mulberry32((baseSeed + pass * 374761393 + shrinkPass * 668265263) >>> 0);
      const seq = trySequentialPlacementOnce(
        count,
        forbid,
        inner,
        anchorIdx,
        vTop,
        vBot,
        rng,
        widthScale,
      );
      if (seq && verifyLayoutSat(seq, forbid, inner)) {
        return {
          slots: seq,
          attemptsUsed: attempts,
          overlapFree: true,
          placementMode: "sequential",
        };
      }
    }

    for (let fp = 0; fp < 6; fp += 1) {
      attempts += 1;
      const rng = mulberry32((baseSeed + 8888888 + fp + shrinkPass * 9973) >>> 0);
      const fb = buildFallbackRingLayout(count, forbid, inner, rng, widthScale);
      if (fb && verifyLayoutSat(fb, forbid, inner)) {
        return {
          slots: fb,
          attemptsUsed: attempts,
          overlapFree: true,
          placementMode: "fallback",
        };
      }
    }

    widthScale *= 0.93;
  }

  const nuclear = buildMinimalRadialLayout(count, forbid, inner);
  if (nuclear.length === count && verifyLayoutSat(nuclear, forbid, inner)) {
    return {
      slots: nuclear,
      attemptsUsed: attempts + 1,
      overlapFree: true,
      placementMode: "fallback",
    };
  }

  return {
    slots: [],
    attemptsUsed: attempts,
    overlapFree: true,
    placementMode: "fallback",
  };
}
