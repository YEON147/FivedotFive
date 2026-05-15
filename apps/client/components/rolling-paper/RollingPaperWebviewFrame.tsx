"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getRollingPaperDetail,
  type RollingPaperCommentRow,
  type RollingPaperDetailPayload,
} from "@/features/rolling-paper/api";
import { isMaskedOthersWishComment } from "@/features/wishlist/comment-display";
import { getAssetImageUrl } from "@/lib/asset-url";
import { fetchRollingPaperCommentsUpTo } from "@/lib/rolling-paper-fetch-comments-up-to";

const MAX_NOTES = 30;

/** 롤링 메인 보드와 동일한 `public/rollingpaper` 포스트잇 4종 — 순환 적용 */
const POSTIT_SKIN_PATHS = [
  "/rollingpaper/postit_01.png",
  "/rollingpaper/postit_02.png",
  "/rollingpaper/postit_03.png",
  "/rollingpaper/postit_04.png",
] as const;

const ROLLING_ASSET_VERSION =
  process.env.NEXT_PUBLIC_ROLLING_ASSET_VERSION?.trim() || "1";

function postitSkinUrl(path: string): string {
  const abs = rollingFrameAbsoluteSrc(path);
  if (!abs) return abs;
  const sep = abs.includes("?") ? "&" : "?";
  return `${abs}${sep}v=${encodeURIComponent(ROLLING_ASSET_VERSION)}`;
}

function rollingFrameAbsoluteSrc(src: string): string {
  const t = (src ?? "").trim();
  if (!t || /^data:/i.test(t)) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (typeof window === "undefined") return t;
  try {
    return new URL(t, window.location.href).href;
  } catch {
    return t;
  }
}

function isRollingForbidden(msg: string): boolean {
  return (
    msg.includes("403") ||
    msg.includes("권한") ||
    msg.includes("FORBIDDEN") ||
    msg.includes("롤링페이퍼에 대한 권한")
  );
}

type SlotStyle = {
  leftPct: number;
  topPct: number;
  rotateDeg: number;
  widthPct: number;
  z: number;
};

/** 액자 가로:세로 = 3:2 — 겹침 계산용 */
const FRAME_W_OVER_H = 3 / 2;
/** 폴라로이드 `w-[27%]`·`aspect 4/5`(세로=가로×5/4)와 맞춤 */
const POLAROID_WIDTH_PCT = 27;
const POLAROID_PAD_X = 2;
const POLAROID_PAD_Y = 3;

type Rect = { left: number; top: number; right: number; bottom: number };

function polaroidForbiddenRect(): Rect {
  const halfW = POLAROID_WIDTH_PCT / 2 + POLAROID_PAD_X;
  const halfH =
    ((POLAROID_WIDTH_PCT / 100) * (5 / 4) * 0.5) * FRAME_W_OVER_H * 100 + POLAROID_PAD_Y;
  return {
    left: 50 - halfW,
    top: 50 - halfH,
    right: 50 + halfW,
    bottom: 50 + halfH,
  };
}

/** 포스트잇 `aspect-[5/4]` 기준 세로 반칸( top% 단위 ) */
function postitVerticalHalfHeightPct(widthPct: number): number {
  return (widthPct / 100) * (2 / 5) * FRAME_W_OVER_H * 100;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function postitAabb(cx: number, cy: number, widthPct: number): Rect {
  const halfW = widthPct / 2;
  const halfH = postitVerticalHalfHeightPct(widthPct);
  return {
    left: cx - halfW,
    right: cx + halfW,
    top: cy - halfH,
    bottom: cy + halfH,
  };
}

function postitOverlapsPolaroid(cx: number, cy: number, widthPct: number, forbid: Rect): boolean {
  return rectsOverlap(postitAabb(cx, cy, widthPct), forbid);
}

/** 폴라로이드 제외 영역으로 중심을 바깥쪽으로 밀기 */
function nudgePostitOutsidePolaroid(
  leftPct: number,
  topPct: number,
  widthPct: number,
  forbid: Rect,
): { leftPct: number; topPct: number } {
  if (!postitOverlapsPolaroid(leftPct, topPct, widthPct, forbid)) {
    return { leftPct, topPct };
  }
  let x = leftPct;
  let y = topPct;
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
  const step = 1.1;
  for (let k = 0; k < 220; k += 1) {
    if (!postitOverlapsPolaroid(x, y, widthPct, forbid)) {
      return {
        leftPct: Math.min(94, Math.max(6, x)),
        topPct: Math.min(94, Math.max(6, y)),
      };
    }
    x += dx * step;
    y += dy * step;
  }
  const perpX = -dy;
  const perpY = dx;
  for (let k = 0; k < 80; k += 1) {
    x += perpX * step;
    y += perpY * step;
    if (!postitOverlapsPolaroid(x, y, widthPct, forbid)) {
      return {
        leftPct: Math.min(94, Math.max(6, x)),
        topPct: Math.min(94, Math.max(6, y)),
      };
    }
  }
  return {
    leftPct: Math.min(94, Math.max(6, x)),
    topPct: Math.min(94, Math.max(6, y)),
  };
}

/** 가운데 폴라로이드 박스 밖에만 오도록 타원 링 + 보정 */
function slotStylesForCount(n: number): SlotStyle[] {
  const count = Math.min(Math.max(0, n), MAX_NOTES);
  const out: SlotStyle[] = [];
  if (count === 0) return out;
  const forbid = polaroidForbiddenRect();
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.35) / count;
    const angle = -Math.PI / 2 + t * 2 * Math.PI;
    const baseR = count > 12 ? 36 : 30;
    const ring = baseR + (i % 4) * 4.2;
    let leftPct = 50 + ring * Math.cos(angle) * 1.08;
    let topPct = 50 + ring * Math.sin(angle) * 0.62;
    const rotateDeg = (((i * 17) % 11) - 5) * 1.05;
    const widthPct = 17 + (i % 3) * 1.1;
    const nudged = nudgePostitOutsidePolaroid(leftPct, topPct, widthPct, forbid);
    leftPct = nudged.leftPct;
    topPct = nudged.topPct;
    const z = 5 + (i % 8);
    out.push({ leftPct, topPct, rotateDeg, widthPct, z });
  }
  return out;
}

function noteBody(row: RollingPaperCommentRow): string {
  if (isMaskedOthersWishComment(row)) {
    return "메시지가 있어요";
  }
  const c = row.content?.trim() ?? "";
  return c || "···";
}

type RollingPaperWebviewFrameProps = {
  slug: string;
};

/**
 * 액자형 미리보기 — 가로형 액자, 가운데 폴라로이드(받는 사람 사진) + 주변 포스트잇(댓글 최대 30).
 * 기존 롤링 보드 페이지·PNG 저장 로직과 분리된 전용 화면입니다.
 */
export function RollingPaperWebviewFrame({ slug }: RollingPaperWebviewFrameProps) {
  const searchParams = useSearchParams();
  const rollingToken = searchParams.get("token")?.trim() || null;

  const [detail, setDetail] = useState<RollingPaperDetailPayload | null>(null);
  const [comments, setComments] = useState<RollingPaperCommentRow[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const s = slug.trim();
    if (!s) {
      setPhase("error");
      setErrorMessage("슬러그가 없습니다.");
      return;
    }
    setPhase("loading");
    setErrorMessage(null);
    try {
      const detailRes = await getRollingPaperDetail(s, rollingToken);
      setDetail(detailRes.data);
      const rows = await fetchRollingPaperCommentsUpTo(s, rollingToken, MAX_NOTES);
      setComments(rows);
      setPhase("ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message.trim() : "불러오지 못했습니다.";
      if (isRollingForbidden(msg)) {
        setErrorMessage("이 페이지를 열 권한이 없습니다. 공유 링크(?token=)를 확인해 주세요.");
      } else {
        setErrorMessage(msg || "불러오지 못했습니다.");
      }
      setDetail(null);
      setComments([]);
      setPhase("error");
    }
  }, [slug, rollingToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const recipientLabel = useMemo(() => {
    const n = detail?.recipientName?.trim();
    if (n) return n;
    return slug.trim() || "받는 분";
  }, [detail?.recipientName, slug]);

  const polaroidSrc = useMemo(() => {
    const k = detail?.imageKey?.trim();
    if (!k) return null;
    return getAssetImageUrl(k);
  }, [detail?.imageKey]);

  const slotStyles = useMemo(() => slotStylesForCount(comments.length), [comments.length]);

  if (phase === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#e8e4dc] px-4 text-[14px] text-slate-600">
        불러오는 중…
      </main>
    );
  }

  if (phase === "error" || !detail) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#e8e4dc] px-6 text-center">
        <p className="max-w-sm text-[14px] leading-relaxed text-slate-700">
          {errorMessage ?? "표시할 수 없습니다."}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-slate-400 bg-white px-4 py-2 text-[13px] font-medium text-slate-800 shadow-sm"
        >
          다시 시도
        </button>
      </main>
    );
  }

  return (
    <main className="box-border flex min-h-dvh min-w-0 items-center justify-center bg-[#e8e4dc] p-3 sm:p-5">
      {/*
        가로형 3:2 — 높이 한계(dvh)·가로 한계(vw) 중 맞는 쪽에 맞춰 스케일.
      */}
      <div
        className="relative box-border aspect-[3/2] w-[min(96vw,calc((100dvh-2.5rem)*3/2))] max-w-[100%] overflow-hidden rounded-xl border border-[rgba(62,56,48,0.22)] bg-[#fbf9f4] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65),0_10px_36px_rgba(45,40,35,0.09),0_1px_0_rgba(255,255,255,0.9)]"
      >
        {/* 주변 포스트잇 — 4종 PNG 순환 */}
        {comments.map((row, i) => {
          const slot = slotStyles[i];
          if (!slot) return null;
          const body = noteBody(row);
          const skinPath = POSTIT_SKIN_PATHS[i % POSTIT_SKIN_PATHS.length];
          const skinSrc = postitSkinUrl(skinPath);
          return (
            <div
              key={row.id}
              className="absolute min-h-0 max-w-full overflow-hidden"
              style={{
                left: `${slot.leftPct}%`,
                top: `${slot.topPct}%`,
                width: `${slot.widthPct}%`,
                transform: `translate(-50%, -50%) rotate(${slot.rotateDeg}deg)`,
                zIndex: slot.z,
                maxHeight: "34%",
              }}
            >
              <div className="relative aspect-[5/4] w-full max-w-full overflow-hidden drop-shadow-[0_3px_10px_rgba(40,35,30,0.1)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- 전용 미리보기, public PNG */}
                <img
                  src={skinSrc}
                  alt=""
                  className="pointer-events-none absolute inset-0 z-0 h-full w-full max-w-full select-none object-contain object-center"
                  draggable={false}
                  decoding="async"
                />
                <div className="relative z-10 flex h-full min-h-0 w-full min-w-0 max-w-full flex-col justify-center overflow-hidden px-[9%] py-[10%]">
                  <p className="line-clamp-6 min-h-0 min-w-0 max-w-full overflow-hidden text-pretty break-words text-[clamp(7px,1.75vw,10px)] leading-snug text-slate-800 [overflow-wrap:anywhere] [text-shadow:0_0_1px_rgba(255,255,255,0.88)] sm:line-clamp-7">
                    {body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* 가운데 폴라로이드 — 메모는 레이아웃상 겹치지 않음 */}
        <div
          className="absolute left-1/2 top-1/2 z-[30] flex w-[27%] -translate-x-1/2 -translate-y-1/2 flex-col rounded-sm bg-white p-1.5 pb-2.5 shadow-[0_6px_20px_rgba(45,40,35,0.1)] sm:w-[26%] sm:p-2 sm:pb-3"
          style={{ aspectRatio: "4 / 5" }}
        >
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-slate-100">
            {polaroidSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- 전용 미리보기, 절대 URL 안정 로드
              <img
                src={rollingFrameAbsoluteSrc(polaroidSrc)}
                alt=""
                className="h-full w-full object-cover"
                decoding="async"
              />
            ) : (
              <span className="px-2 text-center text-[11px] text-slate-500">사진 없음</span>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] font-semibold text-slate-800 sm:text-[12px]">
            {recipientLabel}
          </p>
        </div>

        {comments.length === 0 ? (
          <p className="absolute bottom-[8%] left-1/2 z-10 w-[88%] -translate-x-1/2 text-center text-[12px] text-slate-500">
            아직 붙은 메시지가 없어요.
          </p>
        ) : null}
      </div>
    </main>
  );
}
