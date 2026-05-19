/**
 * 웹뷰 포스트잇 — OBB + SAT 기반 충돌 (액자 % 좌표계와 y축 스케일 보정).
 * layout 모듈보다 먼저 두어 순환 import 없음.
 */

const FRAME_W_OVER_H = 3 / 2;
const SAT_EPS = 1e-5;

export type RollingWebviewCollisionRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type WebviewVec2 = { x: number; y: number };

/** 스케일 보정된 평면에서의 회전 직사각형 (중심 + 반축 + 라디안) */
export type WebviewOBB = {
  cx: number;
  cy: number;
  hx: number;
  hy: number;
  rad: number;
};

function postitVerticalHalfHeightPct(widthPct: number): number {
  return (widthPct / 100) * (2 / 5) * FRAME_W_OVER_H * 100;
}

/** (가로%, 세로%) → SAT용 등방 스케일 좌표 */
export function webviewPercentToSquare(cxPct: number, cyPct: number): WebviewVec2 {
  return { x: cxPct, y: cyPct * FRAME_W_OVER_H };
}

export function webviewSquareToPercent(p: WebviewVec2): { cxPct: number; cyPct: number } {
  return { cxPct: p.x, cyPct: p.y / FRAME_W_OVER_H };
}

function cornersOfOBB(obb: WebviewOBB): WebviewVec2[] {
  const { cx, cy, hx, hy, rad } = obb;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const locals: WebviewVec2[] = [
    { x: hx, y: hy },
    { x: hx, y: -hy },
    { x: -hx, y: -hy },
    { x: -hx, y: hy },
  ];
  return locals.map(({ x: lx, y: ly }) => ({
    x: cx + lx * c - ly * s,
    y: cy + lx * s + ly * c,
  }));
}

function norm(v: WebviewVec2): WebviewVec2 {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

function dot(a: WebviewVec2, b: WebviewVec2): number {
  return a.x * b.x + a.y * b.y;
}

function axisFromEdge(a: WebviewVec2, b: WebviewVec2): WebviewVec2 {
  return { x: -(b.y - a.y), y: b.x - a.x };
}

function project(corners: WebviewVec2[], axis: WebviewVec2): [number, number] {
  let mn = Infinity;
  let mx = -Infinity;
  for (const p of corners) {
    const t = dot(p, axis);
    if (t < mn) mn = t;
    if (t > mx) mx = t;
  }
  return [mn, mx];
}

/** 두 OBB가 겹치면 true (SAT: 분리축이 없으면 겹침) */
export function webviewSatObbOverlap(a: WebviewOBB, b: WebviewOBB): boolean {
  const ca = cornersOfOBB(a);
  const cb = cornersOfOBB(b);
  const axes: WebviewVec2[] = [];
  for (let i = 0; i < 4; i += 1) {
    axes.push(norm(axisFromEdge(ca[i]!, ca[(i + 1) % 4]!)));
    axes.push(norm(axisFromEdge(cb[i]!, cb[(i + 1) % 4]!)));
  }
  for (const ax of axes) {
    const axis = norm(ax);
    const [mina, maxa] = project(ca, axis);
    const [minb, maxb] = project(cb, axis);
    if (maxa < minb - SAT_EPS || maxb < mina - SAT_EPS) {
      return false;
    }
  }
  return true;
}

/** 포스트잇(중심 %, 가로%, 회전°) + 여유 패딩 — square OBB */
export function webviewPostitObbSquare(
  cxPct: number,
  cyPct: number,
  widthPct: number,
  rotateDeg: number,
  padHalf: number,
): WebviewOBB {
  const p = webviewPercentToSquare(cxPct, cyPct);
  const rad = (rotateDeg * Math.PI) / 180;
  const hx = widthPct / 2 + padHalf;
  const hy = postitVerticalHalfHeightPct(widthPct) * FRAME_W_OVER_H + padHalf;
  return { cx: p.x, cy: p.y, hx, hy, rad };
}

/** axis-aligned rect (%, %) → square OBB (rad=0) */
export function webviewAxisRectToObbSquare(
  r: RollingWebviewCollisionRect,
  padHalf: number,
): WebviewOBB {
  const cx = (r.left + r.right) / 2;
  const cy = ((r.top + r.bottom) / 2) * FRAME_W_OVER_H;
  const hx = (r.right - r.left) / 2 + padHalf;
  const hy = ((r.bottom - r.top) / 2) * FRAME_W_OVER_H + padHalf;
  return { cx, cy, hx, hy, rad: 0 };
}
