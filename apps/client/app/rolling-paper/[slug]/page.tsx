"use client";

import {
  CaretLeftIcon,
  CaretRightIcon,
  TextAlignJustify,
} from "@phosphor-icons/react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import {
  BoardShareDialog,
  BoardShareFabButton,
  type RollingPaperOwnerShareTabId,
} from "@/components/common/ShareBoardLink";
import { PublicWishlistVisitorMenu } from "@/components/wishlist/PublicWishlistVisitorMenu";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "@/components/wishlist/WishlistSlots";
import {
  createRollingPaperComment,
  DEFAULT_ROLLING_COMMENT_STICKER_KEY,
  getRollingPaperComments,
  getRollingPaperDetail,
  postRollingPaperShareCommentLink,
  postRollingPaperShareViewLink,
  updateRollingPaperComment,
  verifyRollingPaperGuestCommentPassword,
  type RollingPaperCommentRow,
  type RollingPaperDetailPayload,
} from "@/features/rolling-paper/api";
import {
  mapRollingCommentsToLocalSlots,
  rollingPaperBoardSheetCount,
  rollingPaperLastPageFullFromPayload,
} from "@/features/rolling-paper/board-pagination";
import {
  canEditRollingPaperGuestComment,
  rememberRollingPaperGuestComment,
} from "@/features/rolling-paper/guest-comment-session";
import { loginUrlForPath } from "@/features/login/post-login-destination";
import { getMyProfile } from "@/features/user/api";
import {
  ACCESS_TOKEN_STORAGE_KEY,
  clearAccessToken,
  getAccessToken,
} from "@/lib/api/token-store";
import {
  PAGE_HEADER_LEADING_CLUSTER,
  PAGE_HEADER_MENU_BUTTON,
  PAGE_HEADER_ROW_COMPACT,
} from "@/lib/constants/page-header";
import { clearWishlistPageSessionCache } from "@/features/wishlist/wishlist-session-cache";
import { RollingPaperBubbleLayer } from "@/components/rolling-paper/RollingPaperBubbleLayer";
import { CommentRevealCountdown } from "@/components/wishlist/CommentRevealCountdown";
import { isMaskedOthersWishComment } from "@/features/wishlist/comment-display";
import { getKstStartOfLocalDateMs } from "@/features/wishlist/comment-reveal-at";

/**
 * 보드 한 장(면)당 포스트잇 개수 — UI 슬롯·전역 `slotIndex` 묶음·GET `/comments` 의 `size` 와 동일.
 * (위시 보드 슬롯 수와 별개 — 공통 상수로 두지 않음.)
 */
const ROLLING_POSTIT_SLOT_COUNT = 4;

const GUEST_NICKNAME_MAX_LEN = 8;

/** 메인 콜라주 미리보기에서 줄 수 제한을 걸기 시작하는 글자 수 */
const BOARD_PREVIEW_LINE_CLAMP_MIN_CHARS = 100;

function isRollingPaperForbiddenMessage(msg: string): boolean {
  return (
    msg.includes("403") ||
    msg.includes("권한") ||
    msg.includes("FORBIDDEN") ||
    msg.includes("롤링페이퍼에 대한 권한")
  );
}

const ROLLING_PAPER_BOARD_WRAP =
  "relative flex h-full min-h-0 max-h-full w-full max-w-[min(420px,calc(100vw-1.5rem))] flex-1 flex-col overflow-visible bg-transparent";

const ROLLING_PAPER_BOARD_FRAME =
  "relative isolate overflow-visible rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 wishlist-board-frame--decorate mx-auto w-full max-w-[372px] max-h-[min(680px,100%)] shrink-0 ring-violet-200/55";

const ROLLING_PAPER_BOARD_INNER =
  "relative h-full w-full min-h-0 min-w-0 overflow-visible bg-transparent";

const COLLAGE_BG = "bg-[#f4f2ec]";

/**
 * `public/rollingpaper/*.png` 교체·삭제 후에도 예전 그림이 보이면 대개 캐시 때문입니다.
 * `.env.local`에 `NEXT_PUBLIC_ROLLING_ASSET_VERSION=2` 처럼 숫자만 올리면 URL이 바뀌어 브라우저·`/_next/image` 캐시를 함께 비웁니다.
 */
const ROLLING_ASSET_VERSION =
  process.env.NEXT_PUBLIC_ROLLING_ASSET_VERSION?.trim() || "1";

function rollingPaperImageSrc(basePath: string): string {
  const sep = basePath.includes("?") ? "&" : "?";
  return `${basePath}${sep}v=${ROLLING_ASSET_VERSION}`;
}

/** 개발 중 `/_next/image` 디스크 캐시로 옛 PNG가 남는 경우 완화 */
const rollingPaperImageDevProps =
  process.env.NODE_ENV === "development"
    ? ({ unoptimized: true } as const)
    : ({} as const);

type CollagePiece =
  | {
      kind: "polaroid";
      src: string;
      className: string;
      aspect: [number, number];
      alt: string;
    }
  | {
      kind: "postit";
      slotIndex: number;
      src: string;
      className: string;
      aspect: [number, number];
      alt: string;
    };

const COLLAGE_PIECES: CollagePiece[] = [
  {
    kind: "polaroid",
    src: "/rollingpaper/rollingpaper-01.png",
    className: "left-[5%] top-[12%] z-10 w-[48%] -rotate-[2deg]",
    aspect: [376, 489],
    alt: "폴라로이드 포토 프레임",
  },
  {
    kind: "postit",
    slotIndex: 0,
    src: "/rollingpaper/postit_01.png",
    className: "right-1 top-[24%] z-[20] w-[44%] rotate-[4deg]",
    aspect: [435, 466],
    alt: "포스트잇1",
  },
  {
    kind: "postit",
    slotIndex: 1,
    src: "/rollingpaper/postit_02.png",
    className: "left-[4%] top-[41%] z-[22] w-[62%] -rotate-[6deg]",
    aspect: [642, 571],
    alt: "포스트잇2",
  },
  {
    kind: "postit",
    slotIndex: 2,
    src: "/rollingpaper/postit_03.png",
    className: "right-[1.5%] bottom-[14%] z-[24] w-[46%] rotate-[5deg]",
    aspect: [458, 542],
    alt: "포스트잇3",
  },
  {
    kind: "postit",
    slotIndex: 3,
    src: "/rollingpaper/postit_04.png",
    className: "left-[7%] bottom-[6%] z-[32] w-[44%] -rotate-[10deg]",
    aspect: [399, 436],
    alt: "포스트잇4",
  },
];

function postitAssetForSlot(slotIndex: number): {
  src: string;
  aspect: [number, number];
  alt: string;
} {
  const piece = COLLAGE_PIECES.find(
    (p): p is Extract<CollagePiece, { kind: "postit" }> =>
      p.kind === "postit" && p.slotIndex === slotIndex,
  );
  if (piece) {
    return { src: piece.src, aspect: piece.aspect, alt: piece.alt };
  }
  return {
    src: "/rollingpaper/postit_01.png",
    aspect: [435, 466],
    alt: "포스트잇",
  };
}

function postitModalTextFramePaddingClass(slotIndex: number): string {
  const pxPostit2 = "px-4 sm:px-5";
  const pxOther = "px-3 sm:px-3.5";
  const tail = "pb-1 sm:pb-1.5";
  /** 포스트잇 1·3·4 — 상단 여유 + 하단 잘림 방지용 pb */
  const modal134 = `${pxOther} pt-3.5 sm:pt-5 pb-2.5 sm:pb-3`;
  if (slotIndex === 1) {
    return `pt-2 sm:pt-2.5 ${pxPostit2} ${tail}`;
  }
  if (slotIndex === 2) {
    return `${pxOther} pt-5 sm:pt-6 pb-2.5 sm:pb-3`;
  }
  if (slotIndex === 0 || slotIndex === 3) {
    return modal134;
  }
  return "";
}

/** 포스트잇2(슬롯1)만 가로폭이 넓어 텍스트 박스 inset 살짝 확대 — 읽기·수정 동일 */
function modalPostitFrameInsetClass(slotIndex: number): string {
  if (slotIndex === 1) {
    /** 살짝 위로: 상단 inset↓, 하단은 여유 유지 */
    return "inset-[5%_7%_13%_7%]";
  }
  /**
   * 포스트잇1·4(슬롯0·3): 메인에서 세로 가운데 + `overflow-hidden`일 때 하단이 특히 잘려 보이는 경우가 많아
   * 하단 inset만 추가로 줄여 텍스트 박스를 PNG 안쪽으로 더 내림.
   */
  if (slotIndex === 0 || slotIndex === 3) {
    return "inset-[10%_9%_6%_9%]";
  }
  if (slotIndex === 2) {
    return "inset-[12.5%_9%_10%_9%]";
  }
  return "inset-[10%_9%_14%_9%]";
}

function postitBoardTextFramePaddingClass(slotIndex: number): string {
  const pxPostit2 = "px-4 sm:px-4";
  const pxBoard134 = "px-1 sm:px-1.5";
  if (slotIndex === 1) {
    return `pt-2 sm:pt-2.5 ${pxPostit2}`;
  }
  if (slotIndex === 2) {
    return `pt-6 sm:pt-7 pb-2.5 sm:pb-3 ${pxBoard134}`;
  }
  if (slotIndex === 0 || slotIndex === 3) {
    return `pt-4 sm:pt-5 pb-2.5 sm:pb-3 ${pxBoard134}`;
  }
  return "";
}

/** 포스트잇 PNG + 텍스트 영역 슬롯 — 보기/작성 공통 */
function RollingPaperPostitShell({
  slotIndex,
  children,
  /** 모달 읽기·작성·수정: 읽기와 동일 프레임 — 짧을 땐 중앙, 길 땐 프레임 안 세로 스크롤 */
  fullTextScroll = false,
}: {
  slotIndex: number;
  children: ReactNode;
  fullTextScroll?: boolean;
}) {
  const asset = postitAssetForSlot(slotIndex);
  const [aw, ah] = asset.aspect;

  const inset = modalPostitFrameInsetClass(slotIndex);
  const framePad = fullTextScroll
    ? postitModalTextFramePaddingClass(slotIndex)
    : postitBoardTextFramePaddingClass(slotIndex);
  const frameClass = fullTextScroll
    ? `absolute ${inset} z-[5] flex min-h-0 flex-col overflow-y-auto overscroll-contain ${framePad}`
    : `absolute ${inset} z-[5] flex items-center justify-center overflow-hidden ${framePad}`;

  return (
    <div className="mx-auto w-full max-w-[min(300px,85vw)]">
      <div
        className="relative w-full drop-shadow-[0_12px_28px_rgba(0,0,0,0.14)]"
        style={{ aspectRatio: `${aw} / ${ah}` }}
      >
        <Image
          src={rollingPaperImageSrc(asset.src)}
          alt={asset.alt}
          fill
          className="pointer-events-none object-contain"
          sizes="300px"
          priority
          {...rollingPaperImageDevProps}
        />
        <div className={frameClass}>{children}</div>
      </div>
    </div>
  );
}

/**
 * 모달 포스트잇 본문 영역 — 슬롯 0~3만 사용하며 항상 세로 가운데 정렬.
 */
function RollingPaperModalTextSlot({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full w-full min-w-0 flex-col items-center justify-center">
      <div className="flex w-full min-w-0 max-w-full flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

const CONTENT_MAX = 200;

/** `globals.css` / `public/fonts/MemomentKkukkukk.otf` — 꾹꾹체 */
const ROLLING_POSTIT_FONT_CLASS =
  "font-['MemomentKkukkukk',sans-serif] font-normal";

const ROLLING_POSTIT_DROP_SHADOW =
  "drop-shadow-[0_1px_0_rgba(255,255,255,0.85)]";

/** 글자 수 구간 인덱스 0…5 — 보드·모달 `TEXT_SIZE` 배열과 동일 순서 */
function rollingPostitLengthTier(charCount: number): number {
  const n = Math.max(0, charCount);
  if (n <= 10) return 0;
  if (n <= 30) return 1;
  if (n <= 50) return 2;
  if (n <= 100) return 3;
  if (n <= 150) return 4;
  return 5;
}

/** 메인 콜라주 미리보기 — 10↓ / 11–30 / 31–50 / 51–100 / 101–150 / 151–200 */
const ROLLING_POSTIT_BOARD_PREVIEW_TEXT_SIZE: readonly string[] = [
  "text-[16px] sm:text-[17px]",
  "text-[15px] sm:text-[16px]",
  "text-[14px] sm:text-[15px]",
  "text-[13px] sm:text-[14px]",
  "text-[12px] sm:text-[13px]",
  "text-[11px] sm:text-[12px]",
];

function rollingPostitBoardPreviewTextSizeClass(charCount: number): string {
  return ROLLING_POSTIT_BOARD_PREVIEW_TEXT_SIZE[
    rollingPostitLengthTier(charCount)
  ];
}

/**
 * 메인 콜라주 본문 — 슬롯마다 가로폭·줄바꿈이 달라 글자 수만으로는 세로 여유를 알 수 없음.
 * 프레임 놀이 실제 블록 놀이보다 작을 때만 위쪽 정렬로 하단 잘림을 피하고, 그 외에는 가운데 정렬 유지.
 */
function RollingPaperBoardPostitPreviewText({
  slotIndex,
  text,
}: {
  slotIndex: number;
  text: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [alignStart, setAlignStart] = useState(false);

  const recompute = useCallback(() => {
    const outer = outerRef.current;
    const block = blockRef.current;
    if (!outer || !block) return;
    if (typeof window === "undefined") return;
    const cs = window.getComputedStyle(outer);
    const pt = Number.parseFloat(cs.paddingTop) || 0;
    const pb = Number.parseFloat(cs.paddingBottom) || 0;
    const avail = outer.clientHeight - pt - pb;
    if (avail <= 0) return;
    setAlignStart(block.scrollHeight > avail + 0.5);
  }, []);

  useLayoutEffect(() => {
    recompute();
  }, [text, slotIndex, recompute]);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const block = blockRef.current;
    if (!outer) return;
    const ro = new ResizeObserver(() => {
      recompute();
    });
    ro.observe(outer);
    if (block) ro.observe(block);
    return () => ro.disconnect();
  }, [recompute, text]);

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const fonts = document.fonts;
    if (!fonts?.ready) return;
    let cancelled = false;
    void fonts.ready.then(() => {
      if (!cancelled) recompute();
    });
    return () => {
      cancelled = true;
    };
  }, [recompute, text]);

  const leadingPad =
    alignStart ? "pb-1 leading-[1.28]" : "pb-0.5 leading-[1.35]";

  /** 메인 콜라주 — 긴 글만 미리보기 줄 수 제한(모달·전체 텍스트와 무관) */
  const clampLongPreview = text.length >= BOARD_PREVIEW_LINE_CLAMP_MIN_CHARS;
  /**
   * `line-clamp`만 쓰면 한글·drop-shadow 때문에 9번째 줄이 살짝 비칠 수 있어,
   * 줄간격을 고정하고 `max-height`로 8줄 높이를 한 번 더 자른다.
   */
  const boardLongClampBox =
    clampLongPreview
      ? "line-clamp-8 overflow-hidden leading-[1.35] pb-0 max-h-[calc(1.35em*8-2px)] [overflow-wrap:anywhere]"
      : "";
  /**
   * `line-clamp` + `whitespace-pre-wrap`은 WebKit에서 깨지기 쉬워 클램프 시에는 normal만 사용.
   */
  const boardWhitespaceClass = clampLongPreview
    ? "whitespace-normal break-words"
    : "whitespace-pre-wrap break-words";
  /** 필터는 레이어 밖으로 번져 overflow 클립을 깨뜨릴 수 있음 */
  const boardTextShadowClass = clampLongPreview ? "" : ROLLING_POSTIT_DROP_SHADOW;

  return (
    <div
      ref={outerRef}
      className={`pointer-events-none absolute ${modalPostitFrameInsetClass(slotIndex)} z-[5] flex min-h-0 flex-col items-center overflow-hidden ${postitBoardTextFramePaddingClass(slotIndex)} ${
        alignStart ? "justify-start" : "justify-center"
      }`}
    >
      <div
        ref={blockRef}
        className={`min-h-0 w-full shrink-0 ${clampLongPreview ? "overflow-hidden [contain:paint]" : ""}`}
      >
        <p
          className={`${boardLongClampBox} min-h-0 min-w-0 w-full ${boardWhitespaceClass} text-center text-slate-800 ${boardTextShadowClass} ${ROLLING_POSTIT_FONT_CLASS} ${rollingPostitBoardPreviewTextSizeClass(text.length)} ${clampLongPreview ? "" : leadingPad}`}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

/** 모달 읽기·작성 — `CONTENT_MAX`와 동일 구간 */
const ROLLING_POSTIT_MODAL_TEXT_SIZE: readonly string[] = [
  "text-[clamp(17px,4.5vw,21px)] sm:text-[19px]",
  "text-[clamp(16px,4.3vw,20px)] sm:text-[18px]",
  "text-[clamp(15px,4.2vw,19px)] sm:text-[17px]",
  "text-[clamp(14px,3.9vw,18px)] sm:text-[16px]",
  "text-[clamp(13px,3.6vw,17px)] sm:text-[15px]",
  "text-[clamp(12px,3.3vw,16px)] sm:text-[14px]",
];

function rollingPostitModalTextSizeClass(charCount: number): string {
  return ROLLING_POSTIT_MODAL_TEXT_SIZE[rollingPostitLengthTier(charCount)];
}

/** textarea 공통 — 글자 크기는 `rollingPostitModalTextSizeClass`로 합성 */
const ROLLING_POSTIT_TEXTAREA_BASE = [
  "box-border min-h-0 min-w-0 w-full max-w-full resize-none overflow-y-auto bg-transparent text-center leading-[1.35] text-slate-800 placeholder:text-slate-400 outline-none [field-sizing:content]",
  ROLLING_POSTIT_FONT_CLASS,
].join(" ");

const ROLLING_POSTIT_MODAL_BODY_TEXT_CLASS =
  `pointer-events-none min-w-0 w-full whitespace-pre-wrap break-words text-center leading-[1.35] text-slate-800 ${ROLLING_POSTIT_DROP_SHADOW}`;

const ROLLING_OVERLAY_GUEST_CARD_CLASS =
  "flex w-full shrink-0 flex-col gap-2 rounded-[14px] bg-[#ebe8df]/95 px-3 py-3 shadow-inner ring-1 ring-white/35 backdrop-blur-[2px]";

const ROLLING_OVERLAY_INPUT_CLASS =
  "w-full rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2 text-[14px] outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-300";

const ROLLING_OVERLAY_INPUT_TEXT_CLASS = `${ROLLING_OVERLAY_INPUT_CLASS} text-slate-900`;

const ROLLING_OVERLAY_PRIMARY_BTN_CLASS =
  "rounded-full bg-[#7B61FF] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#6b52e0]";

const ROLLING_OVERLAY_PRIMARY_BTN_DISABLED_CLASS = `${ROLLING_OVERLAY_PRIMARY_BTN_CLASS} disabled:opacity-50`;

const ROLLING_OVERLAY_GHOST_BTN_CLASS =
  "rounded-full px-4 py-2 text-[13px] font-medium text-white/95 hover:bg-white/10";

/** 상세 오버레이 — 읽기 전용 본문 (슬롯별 프레임 안 가운데 정렬) */
function RollingPaperPostitModalFrame({
  slotIndex,
  text,
}: {
  slotIndex: number;
  text: string;
}) {
  return (
    <RollingPaperPostitShell slotIndex={slotIndex} fullTextScroll>
      <RollingPaperModalTextSlot>
        <p
          className={`${ROLLING_POSTIT_MODAL_BODY_TEXT_CLASS} ${ROLLING_POSTIT_FONT_CLASS} ${rollingPostitModalTextSizeClass(text.length)}`}
        >
          {text}
        </p>
      </RollingPaperModalTextSlot>
    </RollingPaperPostitShell>
  );
}

function RollingPaperPostitModalTextarea({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.CSS?.supports?.("field-sizing", "content")) return;
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const sh = el.scrollHeight;
    const cap = el.parentElement?.clientHeight;
    const h = cap && cap > 0 ? Math.min(sh, cap) : sh;
    el.style.height = `${h}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      maxLength={CONTENT_MAX}
      rows={1}
      className={`${ROLLING_POSTIT_TEXTAREA_BASE} ${rollingPostitModalTextSizeClass(value.length)}`}
      placeholder={placeholder}
      aria-required
      autoFocus={autoFocus}
    />
  );
}

function displayNameFromSlug(slug: string): string {
  const raw = slug?.trim() || "";
  if (!raw) return "회원";
  try {
    return decodeURIComponent(raw).replace(/-/g, " ");
  } catch {
    return raw.replace(/-/g, " ");
  }
}

/** 브라우저 기준 전체 URL — `token`이 있으면 `?token=` 부착 */
function rollingPaperAbsoluteShareUrl(slug: string, token: string | null): string {
  const s = slug?.trim();
  if (!s) return "";
  const origin = window.location.origin;
  const path = `/rolling-paper/${encodeURIComponent(s)}`;
  const t = token?.trim();
  if (t) return `${origin}${path}?token=${encodeURIComponent(t)}`;
  return `${origin}${path}`;
}

function rollingPaperSharePathWithToken(slug: string, token: string | null): string {
  const s = slug?.trim();
  if (!s) return "";
  const path = `/rolling-paper/${encodeURIComponent(s)}`;
  const t = token?.trim();
  if (t) return `${path}?token=${encodeURIComponent(t)}`;
  return path;
}

/**
 * `app/wishlist/[slug]/page.tsx` 의 `PublicBoardProfileHeader` 와 동일 헤더 규격
 * (`PAGE_HEADER_ROW_COMPACT` · 우측 햄버거).
 */
function RollingPaperProfileHeader({
  recipientName,
  isSidebarOpen,
  onMenuClick,
}: {
  recipientName: string;
  isSidebarOpen: boolean;
  onMenuClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const displayName = recipientName.trim() || "회원";

  return (
    <header className={PAGE_HEADER_ROW_COMPACT}>
      <div className={`${PAGE_HEADER_LEADING_CLUSTER} items-start`}>
        <h1 className="min-w-0 flex-1 text-left text-wish-title leading-tight text-slate-900">
          <span className="block">
            <span className="inline-flex items-baseline gap-0.5">
              <span className="font-bold leading-[0.8] text-[#7B61FF]">{displayName}</span>
              <span className="text-[18px] font-light leading-none text-slate-900">님을 위한</span>
            </span>
          </span>
          <span className="mt-1 block text-[18px] font-light leading-snug text-slate-900">
            롤링페이퍼
          </span>
        </h1>
      </div>
      <button
        type="button"
        onClick={onMenuClick}
        className={PAGE_HEADER_MENU_BUTTON}
        aria-label="메뉴 열기"
        aria-expanded={isSidebarOpen}
      >
        <TextAlignJustify size={23} weight="bold" />
      </button>
    </header>
  );
}

export default function RollingPaperSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: slugParam } = use(params);
  const slug = slugParam?.trim() ?? "";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rollingToken = searchParams.get("token")?.trim() || null;

  const loginHrefWithReturn = useMemo(() => {
    const qs = searchParams.toString();
    return loginUrlForPath(`${pathname}${qs ? `?${qs}` : ""}`);
  }, [pathname, searchParams]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visitorMenuLoggedIn, setVisitorMenuLoggedIn] = useState(false);

  const [detail, setDetail] = useState<RollingPaperDetailPayload | null>(null);
  const [detailForbidden, setDetailForbidden] = useState(false);
  const [slotComments, setSlotComments] = useState<
    Partial<Record<number, RollingPaperCommentRow>>
  >({});
  /** 보드(면) 단위 페이지 — GET comments `page` 와 동일 (0부터) */
  const [visibleBoardPage, setVisibleBoardPage] = useState(0);
  const [commentsPaging, setCommentsPaging] = useState<{
    totalPages: number;
    lastPageFull: boolean;
    totalCount: number;
  }>({ totalPages: 0, lastPageFull: false, totalCount: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  /** 작성 오버레이: 포스트잇만 → 탭 후 입력 */
  const [createOverlayStep, setCreateOverlayStep] = useState<
    "postit" | "compose"
  >("postit");
  /** 빈 슬롯: 작성 / 채워진 슬롯: 내용만 보기 */
  const [modalMode, setModalMode] = useState<"create" | "view">("create");
  /** 보기 모달: 읽기 ↔ 본인 수정 */
  const [viewModalStep, setViewModalStep] = useState<"read" | "edit">("read");
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [guestNickname, setGuestNickname] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  /** 비회원 수정 — `POST .../verify`로 받은 토큰(저장 시 PATCH 1회 소모) */
  const [guestEditVerifyToken, setGuestEditVerifyToken] = useState<
    string | null
  >(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [loggedInState, setLoggedInState] = useState(() =>
    Boolean(getAccessToken()?.trim()),
  );

  const [portalReady, setPortalReady] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTab, setShareTab] = useState<RollingPaperOwnerShareTabId>("comment");
  const [ownerCommentShareUrl, setOwnerCommentShareUrl] = useState<string | null>(null);
  const [ownerCommentShareFailed, setOwnerCommentShareFailed] = useState(false);
  const [ownerViewShareUrl, setOwnerViewShareUrl] = useState<string | null>(null);
  const [ownerViewExpiresAt, setOwnerViewExpiresAt] = useState<string | null>(null);
  const [ownerViewShareError, setOwnerViewShareError] = useState<string | null>(null);
  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!isShareModalOpen) {
      setShareTab("comment");
      setOwnerViewShareUrl(null);
      setOwnerViewExpiresAt(null);
      setOwnerViewShareError(null);
    }
  }, [isShareModalOpen]);

  useEffect(() => {
    if (!isShareModalOpen || !slug.trim()) return;
    if (!detail?.isOwner) {
      setOwnerCommentShareUrl(null);
      setOwnerCommentShareFailed(false);
      return;
    }
    let cancelled = false;
    setOwnerCommentShareFailed(false);
    setOwnerCommentShareUrl(null);
    void postRollingPaperShareCommentLink(slug)
      .then((res) => {
        const u = res.data?.shortUrl?.trim();
        if (cancelled) return;
        if (u) {
          setOwnerCommentShareUrl(u);
        } else {
          setOwnerCommentShareFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setOwnerCommentShareFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isShareModalOpen, detail?.isOwner, slug]);

  useEffect(() => {
    if (!isShareModalOpen || !slug.trim() || !detail?.isOwner) return;
    if (shareTab !== "view") return;
    if (ownerViewShareUrl?.trim()) return;

    let cancelled = false;
    setOwnerViewShareError(null);
    void postRollingPaperShareViewLink(slug)
      .then((res) => {
        const u = res.data?.shortUrl?.trim();
        const exp = res.data?.expiresAt?.trim();
        if (cancelled) return;
        if (u) {
          setOwnerViewShareUrl(u);
          setOwnerViewExpiresAt(exp ?? null);
        } else {
          setOwnerViewShareError(res.message?.trim() || "링크를 만들지 못했습니다.");
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message.trim() : "링크를 만들지 못했습니다.";
        setOwnerViewShareError(msg || "링크를 만들지 못했습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [isShareModalOpen, detail?.isOwner, slug, shareTab, ownerViewShareUrl]);

  const syncVisitorSession = useCallback(async () => {
    const token = getAccessToken()?.trim();
    if (!token) {
      setVisitorMenuLoggedIn(false);
      return;
    }
    try {
      await getMyProfile();
      setVisitorMenuLoggedIn(true);
    } catch {
      setVisitorMenuLoggedIn(!!getAccessToken()?.trim());
    }
  }, []);

  useEffect(() => {
    void syncVisitorSession();
  }, [syncVisitorSession]);

  useEffect(() => {
    const syncTokens = () => setLoggedInState(!!getAccessToken()?.trim());
    const onFocus = () => {
      syncTokens();
      void syncVisitorSession();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACCESS_TOKEN_STORAGE_KEY || e.key === null) {
        syncTokens();
        void syncVisitorSession();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        syncTokens();
        void syncVisitorSession();
      }
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncVisitorSession]);

  const handleRollingPaperMenuClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    void syncVisitorSession();
    setIsSidebarOpen((open) => !open);
  };

  const handleRollingPaperLogout = useCallback(() => {
    clearAccessToken();
    clearWishlistPageSessionCache();
    setVisitorMenuLoggedIn(false);
    setLoggedInState(false);
    setIsSidebarOpen(false);
    router.push("/login");
  }, [router]);

  /** 모달 중 배경 스크롤 제거 — 고정 `main` 안쪽 `overflow-y-auto` 래퍼가 뷰포트 스크롤바를 만들던 문제 */
  useLayoutEffect(() => {
    if (!modalOpen || typeof document === "undefined") return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverscroll = body.style.overscrollBehavior;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, [modalOpen]);

  const headerTitle = useMemo(() => {
    const n = detail?.recipientName?.trim();
    if (n) return n;
    return displayNameFromSlug(slug);
  }, [detail?.recipientName, slug]);

  /**
   * 공유 모달 주소 — 댓글 작성 가능 토큰 우선(`commentToken` → 세션에서 댓글 가능할 때 URL의 `token`).
   * 보기 전용(`viewToken`)은 주소와 다를 때만 보조 링크로 둡니다.
   */
  const rollingShareModalLinks = useMemo(() => {
    const commentInviteToken =
      detail?.commentToken?.trim() ||
      (detail?.canComment ? rollingToken?.trim() || null : null);
    const viewOnlyToken = detail?.viewToken?.trim() || null;

    if (commentInviteToken) {
      const secondaryToken =
        viewOnlyToken && viewOnlyToken !== commentInviteToken
          ? viewOnlyToken
          : null;
      return {
        primaryToken: commentInviteToken,
        secondaryToken,
        primaryCaption: "댓글 작성 초대 링크",
        secondaryCaption: secondaryToken ? "보기·저장용 링크" : undefined,
      };
    }
    if (viewOnlyToken) {
      return {
        primaryToken: viewOnlyToken,
        secondaryToken: null,
        primaryCaption: "보기·저장용 링크",
        secondaryCaption: undefined,
      };
    }
    return {
      primaryToken: rollingToken?.trim() || null,
      secondaryToken: null,
      primaryCaption: undefined as string | undefined,
      secondaryCaption: undefined as string | undefined,
    };
  }, [detail, rollingToken]);

  const rollingShareUrl = useMemo(() => {
    const raw = rollingPaperAbsoluteShareUrl(
      slug,
      rollingShareModalLinks.primaryToken,
    );
    return raw.trim() ? raw : null;
  }, [slug, rollingShareModalLinks.primaryToken]);

  const rollingSharePathWithQs = useMemo(
    () =>
      rollingPaperSharePathWithToken(slug, rollingShareModalLinks.primaryToken),
    [slug, rollingShareModalLinks.primaryToken],
  );

  const rollingShareSecondaryAbsolute = useMemo(() => {
    const t = rollingShareModalLinks.secondaryToken;
    if (!t) return null;
    const raw = rollingPaperAbsoluteShareUrl(slug, t);
    return raw.trim() ? raw : null;
  }, [slug, rollingShareModalLinks.secondaryToken]);

  const rollingShareSecondaryPath = useMemo(
    () =>
      rollingShareModalLinks.secondaryToken
        ? rollingPaperSharePathWithToken(slug, rollingShareModalLinks.secondaryToken)
        : null,
    [slug, rollingShareModalLinks.secondaryToken],
  );

  /**
   * 공유 모달 — 댓글 탭·비소유자 공통: 미리보기·복사·Web Share 문자열.
   * 소유자 댓글 탭: 단축 URL(API) 우선, 실패 시 전체 페이지 URL 폴백.
   * 비소유자: `rollingShareUrl`(댓글 초대 토큰 우선).
   */
  const commentTabShareUrl = useMemo((): string | null => {
    if (!detail?.isOwner) {
      return rollingShareUrl;
    }
    if (ownerCommentShareUrl?.trim()) {
      return ownerCommentShareUrl.trim();
    }
    if (ownerCommentShareFailed) {
      return rollingShareUrl;
    }
    return null;
  }, [detail?.isOwner, ownerCommentShareUrl, ownerCommentShareFailed, rollingShareUrl]);

  const viewTabShareUrl = useMemo((): string | null => {
    if (!detail?.isOwner) return null;
    return ownerViewShareUrl?.trim() || null;
  }, [detail?.isOwner, ownerViewShareUrl]);

  const loadCommentsPage = useCallback(
    async (pageIdx: number) => {
      if (!slug.trim()) return;
      const commentsRes = await getRollingPaperComments(slug, {
        rollingToken,
        page: pageIdx,
        size: ROLLING_POSTIT_SLOT_COUNT,
      });
      const payload = commentsRes.data;
      const totalCount = payload.totalCount ?? 0;
      const lastFull = rollingPaperLastPageFullFromPayload(payload);
      setCommentsPaging({
        totalPages: payload.totalPages,
        lastPageFull: lastFull,
        totalCount,
      });
      setSlotComments(
        mapRollingCommentsToLocalSlots(
          pageIdx,
          payload.comments,
          ROLLING_POSTIT_SLOT_COUNT,
        ),
      );
    },
    [slug, rollingToken],
  );

  const boardsToRender = useMemo(
    () =>
      rollingPaperBoardSheetCount({
        totalPages: commentsPaging.totalPages,
        lastPageFull: commentsPaging.lastPageFull,
        totalCount: commentsPaging.totalCount,
      }),
    [commentsPaging],
  );

  const loadBoard = useCallback(async () => {
    if (!slug) return;
    /** 이펙트 직후 동기 setState 연쇄 렌더 유발 방지 — `react-hooks/set-state-in-effect` */
    await Promise.resolve();
    setLoading(true);
    setLoadError(null);
    setDetailForbidden(false);
    try {
      const detailRes = await getRollingPaperDetail(slug, rollingToken);
      setDetail(detailRes.data);
      setVisibleBoardPage(0);
      await loadCommentsPage(0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "불러오지 못했습니다.";
      if (isRollingPaperForbiddenMessage(msg)) {
        setDetailForbidden(true);
        setDetail(null);
      } else {
        setLoadError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [slug, rollingToken, loadCommentsPage]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    setVisibleBoardPage((p) =>
      Math.min(p, Math.max(0, boardsToRender - 1)),
    );
  }, [boardsToRender]);

  const goPrevBoard = useCallback(() => {
    const next = Math.max(0, visibleBoardPage - 1);
    if (next === visibleBoardPage) return;
    setVisibleBoardPage(next);
    void loadCommentsPage(next);
  }, [visibleBoardPage, loadCommentsPage]);

  const goNextBoard = useCallback(() => {
    const max = Math.max(0, boardsToRender - 1);
    const next = Math.min(max, visibleBoardPage + 1);
    if (next === visibleBoardPage) return;
    setVisibleBoardPage(next);
    void loadCommentsPage(next);
  }, [boardsToRender, visibleBoardPage, loadCommentsPage]);

  const canComment = detail?.canComment === true;

  const showRollingPaperShareEntry = Boolean(
    detail && (detail.isOwner === true || canComment),
  );

  /** 포스트잇에 메시지가 올라간 개수 — 첫 방문 시 물방울 개수와 동일 */
  const filledMessageCount = useMemo(() => {
    let n = 0;
    for (let i = 0; i < ROLLING_POSTIT_SLOT_COUNT; i++) {
      if (slotComments[i]) n += 1;
    }
    return n;
  }, [slotComments]);

  /** 기념일 0시(KST) — 마스킹 댓글 읽기 모달 카운트다운 */
  const rollingCommentRevealAtMs = useMemo(() => {
    const td = detail?.targetDate?.trim();
    if (!td) return undefined;
    const ms = getKstStartOfLocalDateMs(td);
    return Number.isFinite(ms) ? ms : undefined;
  }, [detail?.targetDate]);

  const openCreateModal = (slotIndex: number) => {
    if (!canComment) return;
    if (slotComments[slotIndex]) return;
    setModalMode("create");
    setActiveSlot(slotIndex);
    setContent("");
    setGuestNickname("");
    setGuestPassword("");
    setFormError(null);
    setCreateOverlayStep("postit");
    setModalOpen(true);
  };

  const openViewModal = (slotIndex: number) => {
    const row = slotComments[slotIndex];
    if (!row) return;
    setModalMode("view");
    setViewModalStep("read");
    setActiveSlot(slotIndex);
    setFormError(null);
    setGuestEditVerifyToken(null);
    setGuestPassword("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMode("create");
    setViewModalStep("read");
    setActiveSlot(null);
    setFormError(null);
    setCreateOverlayStep("postit");
    setGuestEditVerifyToken(null);
  };

  const handleSubmit = async () => {
    if (modalMode !== "create" || activeSlot === null || !slug) return;
    const member = Boolean(getAccessToken()?.trim());
    const trimmed = content.trim();
    if (!trimmed) {
      setFormError("내용을 입력해 주세요.");
      return;
    }
    if (trimmed.length > CONTENT_MAX) {
      setFormError(`댓글은 ${CONTENT_MAX}자 이내입니다.`);
      return;
    }

    if (!member) {
      const nick = guestNickname.trim();
      if (!nick) {
        setFormError("닉네임을 입력해 주세요. (비회원)");
        return;
      }
      if (nick.length > GUEST_NICKNAME_MAX_LEN) {
        setFormError(`닉네임은 ${GUEST_NICKNAME_MAX_LEN}자 이내입니다.`);
        return;
      }
      if (!guestPassword.trim()) {
        setFormError("비밀번호를 입력해 주세요. (비회원)");
        return;
      }
    }

    setFormError(null);
    setSubmitting(true);
    try {
      const globalSlot =
        visibleBoardPage * ROLLING_POSTIT_SLOT_COUNT + activeSlot;
      if (member) {
        await createRollingPaperComment(
          slug,
          {
            content: trimmed,
            stickerKey: DEFAULT_ROLLING_COMMENT_STICKER_KEY,
            slotIndex: globalSlot,
          },
          rollingToken,
        );
      } else {
        const res = await createRollingPaperComment(
          slug,
          {
            content: trimmed,
            stickerKey: DEFAULT_ROLLING_COMMENT_STICKER_KEY,
            slotIndex: globalSlot,
            guestNickname: guestNickname.trim(),
            guestPassword: guestPassword,
          },
          rollingToken,
        );
        const newId = res.data?.id;
        if (typeof newId === "number") {
          rememberRollingPaperGuestComment(slug, newId);
        }
      }
      closeModal();
      await loadCommentsPage(visibleBoardPage);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "작성에 실패했습니다.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewEditSubmit = async () => {
    if (
      modalMode !== "view" ||
      viewModalStep !== "edit" ||
      activeSlot === null ||
      !slug
    ) {
      return;
    }
    const row = slotComments[activeSlot];
    if (!row) return;

    const trimmed = content.trim();
    if (!trimmed) {
      setFormError("내용을 입력해 주세요.");
      return;
    }
    if (trimmed.length > CONTENT_MAX) {
      setFormError(`댓글은 ${CONTENT_MAX}자 이내입니다.`);
      return;
    }

    const jwtPresent = Boolean(getAccessToken()?.trim());
    const useMemberPatch = jwtPresent && row.isUser;
    const guestVt = guestEditVerifyToken?.trim();
    if (!useMemberPatch && !guestVt) {
      setFormError("먼저 비밀번호로 인증해 주세요.");
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      if (useMemberPatch) {
        await updateRollingPaperComment(slug, row.id, {
          content: trimmed,
          rollingToken,
        });
      } else {
        await updateRollingPaperComment(slug, row.id, {
          content: trimmed,
          verifyToken: guestVt,
          rollingToken,
        });
      }
      setViewModalStep("read");
      setGuestPassword("");
      setGuestEditVerifyToken(null);
      await loadCommentsPage(visibleBoardPage);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "수정에 실패했습니다.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestEditVerifyLoad = async () => {
    if (
      modalMode !== "view" ||
      viewModalStep !== "edit" ||
      activeSlot === null ||
      !slug
    ) {
      return;
    }
    const row = slotComments[activeSlot];
    if (!row || row.isUser) return;

    if (!guestPassword.trim()) {
      setFormError("비밀번호를 입력해 주세요.");
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      const { verifyToken, content: verifiedContent } =
        await verifyRollingPaperGuestCommentPassword(
          slug,
          row.id,
          guestPassword.trim(),
        );
      setGuestEditVerifyToken(verifyToken);
      setContent(
        typeof verifiedContent === "string" ? verifiedContent : "",
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "인증에 실패했습니다.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const viewRow =
    modalMode === "view" && activeSlot !== null
      ? slotComments[activeSlot]
      : undefined;

  const canEditViewMessage = useMemo(() => {
    if (modalMode !== "view" || activeSlot === null || !slug) return false;
    const row = slotComments[activeSlot];
    if (!row) return false;
    if (Boolean(getAccessToken()?.trim()) && row.isUser) return true;
    return canEditRollingPaperGuestComment(slug, row.id);
  }, [modalMode, activeSlot, slotComments, slug]);

  const rollingDialogTitle = useMemo(() => {
    const labelSlot =
      activeSlot !== null
        ? visibleBoardPage * ROLLING_POSTIT_SLOT_COUNT + activeSlot + 1
        : null;
    if (modalMode === "view" && activeSlot !== null && labelSlot !== null) {
      if (viewModalStep === "edit") {
        return `메시지 수정 (${labelSlot}번 슬롯)`;
      }
      return `메시지 보기 (${labelSlot}번 슬롯)`;
    }
    if (activeSlot !== null && labelSlot !== null) {
      return `메시지 작성 (${labelSlot}번 슬롯)`;
    }
    return "메시지 작성";
  }, [activeSlot, modalMode, viewModalStep, visibleBoardPage]);

  if (!slug) {
    return (
      <main className="wishlist-page-root app-shell-viewport-floor flex min-h-0 flex-col px-3 py-10 sm:px-4">
        <p className="text-center text-body-sm text-slate-600">잘못된 경로입니다.</p>
      </main>
    );
  }

  const modalPanelNeedsInnerScroll =
    modalMode === "view" ||
    (modalMode === "create" && createOverlayStep === "compose");

  const rollingPaperOverlay = (
    <div
      className="fixed inset-0 z-[500] isolate flex items-center justify-center overscroll-contain p-3 sm:p-4"
      role="presentation"
    >
        <button
          type="button"
          className="absolute inset-0 z-0 cursor-default bg-black/45"
          aria-label="배경을 눌러 닫기"
          onClick={closeModal}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rp-overlay-title"
          className="relative z-10 flex max-h-[min(92dvh,760px)] w-full max-w-[min(340px,calc(100vw-2rem))] flex-col items-center justify-center pointer-events-none"
        >
          <div
            className={`pointer-events-auto mx-auto flex w-full flex-col items-center gap-3 py-2 ${
              modalPanelNeedsInnerScroll
                ? "max-h-[min(88dvh,720px)] min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain"
                : "overflow-visible"
            }`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="rp-overlay-title" className="sr-only">
              {rollingDialogTitle}
            </h2>

            {modalMode === "view" && activeSlot !== null && viewRow ? (
              viewModalStep === "read" ? (
                <>
                  {isMaskedOthersWishComment(viewRow) ? (
                    <RollingPaperPostitShell
                      slotIndex={activeSlot}
                      fullTextScroll
                    >
                      <RollingPaperModalTextSlot>
                        <div className="flex w-full min-w-0 max-w-full flex-col items-center px-0.5 text-center">
                          <div className="w-full max-w-[min(260px,100%)] rounded-2xl border border-violet-100 bg-violet-50/90 px-3 py-2.5 shadow-sm">
                            <p className="text-[11px] font-semibold text-violet-900">
                              전체 공개까지
                            </p>
                            <p
                              className="mt-1 text-base font-bold leading-snug tracking-tight text-violet-700"
                              aria-live="polite"
                            >
                              <CommentRevealCountdown
                                revealAtMs={rollingCommentRevealAtMs}
                              />
                            </p>
                          </div>
                        </div>
                      </RollingPaperModalTextSlot>
                    </RollingPaperPostitShell>
                  ) : (
                    <RollingPaperPostitModalFrame
                      slotIndex={activeSlot}
                      text={
                        typeof viewRow.content === "string" &&
                        viewRow.content.trim() !== ""
                          ? viewRow.content.trim()
                          : "아직 공개되지 않은 메시지입니다."
                      }
                    />
                  )}
                  {canEditViewMessage ? (
                    <button
                      type="button"
                      className={`shrink-0 ${ROLLING_OVERLAY_PRIMARY_BTN_CLASS}`}
                      onClick={() => {
                        setViewModalStep("edit");
                        setGuestEditVerifyToken(null);
                        if (viewRow.isUser) {
                          setContent(
                            typeof viewRow.content === "string"
                              ? viewRow.content
                              : "",
                          );
                        } else {
                          setContent("");
                        }
                        setGuestPassword("");
                        setFormError(null);
                      }}
                    >
                      수정
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  {viewRow && !viewRow.isUser && !guestEditVerifyToken ? (
                    <>
                      <div className={ROLLING_OVERLAY_GUEST_CARD_CLASS}>
                        <label className="flex flex-col gap-1">
                          <span className="text-[11px] font-medium text-slate-700">
                            비밀번호
                          </span>
                          <input
                            type="password"
                            value={guestPassword}
                            onChange={(e) => setGuestPassword(e.target.value)}
                            className={ROLLING_OVERLAY_INPUT_CLASS}
                            placeholder="작성 시 설정한 비밀번호"
                            autoComplete="current-password"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void handleGuestEditVerifyLoad();
                              }
                            }}
                          />
                        </label>
                      </div>

                      {formError ? (
                        <p className="text-[13px] text-red-200" role="alert">
                          {formError}
                        </p>
                      ) : null}

                      <div className="flex w-full flex-wrap justify-end gap-2 pt-1">
                        <button
                          type="button"
                          className={ROLLING_OVERLAY_GHOST_BTN_CLASS}
                          onClick={() => {
                            setViewModalStep("read");
                            setFormError(null);
                            setGuestPassword("");
                            setGuestEditVerifyToken(null);
                          }}
                          disabled={submitting}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          className={ROLLING_OVERLAY_PRIMARY_BTN_DISABLED_CLASS}
                          onClick={() => void handleGuestEditVerifyLoad()}
                          disabled={submitting || !guestPassword.trim()}
                        >
                          {submitting ? "불러오는 중…" : "수정"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <RollingPaperPostitShell
                        slotIndex={activeSlot}
                        fullTextScroll
                      >
                        <RollingPaperModalTextSlot>
                          <RollingPaperPostitModalTextarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="메시지를 수정해 보세요"
                            autoFocus={
                              Boolean(viewRow?.isUser) ||
                              Boolean(guestEditVerifyToken)
                            }
                          />
                        </RollingPaperModalTextSlot>
                      </RollingPaperPostitShell>
                      <span className="w-full text-right text-[11px] text-white/80">
                        {content.trim().length}/{CONTENT_MAX}
                      </span>

                      {formError ? (
                        <p className="text-[13px] text-red-200" role="alert">
                          {formError}
                        </p>
                      ) : null}

                      <div className="flex w-full flex-wrap justify-end gap-2 pt-1">
                        <button
                          type="button"
                          className={ROLLING_OVERLAY_GHOST_BTN_CLASS}
                          onClick={() => {
                            setViewModalStep("read");
                            setFormError(null);
                            setGuestPassword("");
                            setGuestEditVerifyToken(null);
                          }}
                          disabled={submitting}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          className={ROLLING_OVERLAY_PRIMARY_BTN_DISABLED_CLASS}
                          onClick={() => void handleViewEditSubmit()}
                          disabled={
                            submitting ||
                            (Boolean(viewRow && !viewRow.isUser) &&
                              !guestEditVerifyToken?.trim())
                          }
                        >
                          {submitting ? "저장 중…" : "저장"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )
            ) : null}

            {modalMode === "create" && activeSlot !== null ? (
              createOverlayStep === "postit" ? (
                <button
                  type="button"
                  className="w-full shrink-0 border-0 bg-transparent p-0 outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  aria-label={`포스트잇 ${activeSlot + 1}번 — 탭하여 작성`}
                  onClick={() => setCreateOverlayStep("compose")}
                >
                  <RollingPaperPostitModalFrame
                    slotIndex={activeSlot}
                    text="탭하여 작성"
                  />
                </button>
              ) : (
                <>
                  {!loggedInState ? (
                    <div className={ROLLING_OVERLAY_GUEST_CARD_CLASS}>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-slate-700">
                          닉네임 (최대 {GUEST_NICKNAME_MAX_LEN}자)
                        </span>
                        <input
                          type="text"
                          value={guestNickname}
                          onChange={(e) =>
                            setGuestNickname(
                              e.target.value.slice(0, GUEST_NICKNAME_MAX_LEN),
                            )
                          }
                          maxLength={GUEST_NICKNAME_MAX_LEN}
                          className={ROLLING_OVERLAY_INPUT_TEXT_CLASS}
                          placeholder="친구"
                          autoComplete="nickname"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium text-slate-700">
                          비밀번호
                        </span>
                        <input
                          type="password"
                          value={guestPassword}
                          onChange={(e) => setGuestPassword(e.target.value)}
                          className={ROLLING_OVERLAY_INPUT_CLASS}
                          placeholder="비회원 작성 시 필요"
                          autoComplete="new-password"
                        />
                      </label>
                    </div>
                  ) : (
                    <p className="max-w-full shrink-0 text-center text-[11px] leading-snug text-white/85">
                      작성 후에는 이 슬롯에 다른 메시지를 넣을 수 없습니다.
                    </p>
                  )}

                  <RollingPaperPostitShell slotIndex={activeSlot} fullTextScroll>
                    <RollingPaperModalTextSlot>
                      <RollingPaperPostitModalTextarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="생일 축하해!"
                        autoFocus
                      />
                    </RollingPaperModalTextSlot>
                  </RollingPaperPostitShell>
                  <span className="w-full text-right text-[11px] text-white/80">
                    {content.trim().length}/{CONTENT_MAX}
                  </span>

                  {formError ? (
                    <p className="text-[13px] text-red-200" role="alert">
                      {formError}
                    </p>
                  ) : null}

                  <div className="flex w-full flex-wrap justify-end gap-2 pt-1">
                    <button
                      type="button"
                      className={ROLLING_OVERLAY_GHOST_BTN_CLASS}
                      onClick={() => setCreateOverlayStep("postit")}
                      disabled={submitting}
                    >
                      이전
                    </button>
                    <button
                      type="button"
                      className={ROLLING_OVERLAY_PRIMARY_BTN_DISABLED_CLASS}
                      onClick={() => void handleSubmit()}
                      disabled={submitting}
                    >
                      {submitting ? "전송 중…" : "등록"}
                    </button>
                  </div>
                </>
              )
            ) : null}
          </div>
        </div>
      </div>
  );

  return (
    <>
      <main className="wishlist-page-root app-shell-viewport-floor flex min-h-0 flex-col overflow-visible px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4">
      <div
        className={`relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col items-stretch justify-start overflow-x-hidden overscroll-contain transition-all duration-300 ease-out ${
          modalOpen ? "overflow-y-hidden" : "overflow-y-auto"
        }`}
      >
        <section className={`${ROLLING_PAPER_BOARD_WRAP} mx-auto min-h-0 w-full`}>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-visible p-0">
            <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-visible px-1 pb-1 pt-2 sm:px-2 sm:pb-2 sm:pt-3">
              <div
                className={ROLLING_PAPER_BOARD_FRAME}
                style={{
                  aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
                }}
              >
                <div
                  className={`pointer-events-none absolute inset-0 z-0 rounded-[18px] ${COLLAGE_BG}`}
                  aria-hidden
                />

                {!loading && !detailForbidden && !loadError && detail ? (
                  <RollingPaperBubbleLayer
                    slug={slug}
                    messageCount={filledMessageCount}
                    paused={modalOpen}
                  />
                ) : null}

                <div className="absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden rounded-[18px]">
                  <div
                    className={`${ROLLING_PAPER_BOARD_INNER} relative flex h-full min-h-0 flex-1 flex-col`}
                  >
                  {loading ? (
                    <div className="flex flex-1 items-center justify-center py-16 text-[13px] text-slate-500">
                      불러오는 중…
                    </div>
                  ) : detailForbidden ? (
                    <div className="mx-2 mb-2 flex flex-1 flex-col justify-center rounded-[14px] bg-white/80 px-4 py-8 text-center shadow-inner">
                      <p className="text-[14px] font-medium text-slate-800">
                        이 페이지에 접근할 수 없습니다.
                      </p>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                        소유자이거나 공유 링크(
                        <span className="font-mono text-[12px]">?token=</span>
                        )가 포함된 주소로 열어 주세요.
                      </p>
                    </div>
                  ) : loadError ? (
                    <div className="mx-2 mb-2 flex flex-1 flex-col items-center justify-center rounded-[14px] bg-red-50/90 px-4 py-8 text-center">
                      <p className="text-[13px] text-red-800">{loadError}</p>
                      <button
                        type="button"
                        className="mt-3 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-slate-800 shadow-sm ring-1 ring-slate-200"
                        onClick={() => void loadBoard()}
                      >
                        다시 시도
                      </button>
                    </div>
                  ) : (
                    <>
                      {detail && !canComment ? (
                        <div className="mx-2 mb-2 rounded-[12px] bg-amber-50 px-3 py-2 text-[12px] leading-snug text-amber-950 ring-1 ring-amber-200/80">
                          이 링크로는 댓글을 작성할 수 없습니다. (보기 전용 링크)
                        </div>
                      ) : null}

                      <div
                        className={`relative mx-2 mb-1 mt-0 min-h-0 flex-1 overflow-visible rounded-[14px] ${COLLAGE_BG} shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]`}
                      >
                        {COLLAGE_PIECES.map((piece) => {
                          const [aw, ah] = piece.aspect;
                          if (piece.kind === "polaroid") {
                            return (
                              <div
                                key={piece.src}
                                className={`pointer-events-none absolute ${piece.className}`}
                                style={{ aspectRatio: `${aw} / ${ah}` }}
                              >
                                <div className="relative h-full w-full">
                                  <Image
                                    src={rollingPaperImageSrc(piece.src)}
                                    alt={piece.alt}
                                    fill
                                    className="object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                                    sizes="(max-width: 420px) 50vw, 220px"
                                    priority
                                    {...rollingPaperImageDevProps}
                                  />
                                </div>
                              </div>
                            );
                          }

                          const slotIdx = piece.slotIndex;
                          const globalPostitNo =
                            visibleBoardPage * ROLLING_POSTIT_SLOT_COUNT +
                            slotIdx +
                            1;
                          const row = slotComments[slotIdx];
                          const occupied = Boolean(row);
                          const masked =
                            row && isMaskedOthersWishComment(row);
                          const text =
                            row?.content?.trim() ||
                            (occupied
                              ? masked
                                ? "메시지가 있어요"
                                : "···"
                              : "");
                          return (
                            <div
                              key={piece.src}
                              className={`absolute ${piece.className}`}
                              style={{ aspectRatio: `${aw} / ${ah}` }}
                            >
                              <div className="relative h-full w-full">
                                <Image
                                  src={rollingPaperImageSrc(piece.src)}
                                  alt={piece.alt}
                                  fill
                                  className="pointer-events-none object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                                  sizes="(max-width: 420px) 50vw, 220px"
                                  priority={slotIdx === 1}
                                  {...rollingPaperImageDevProps}
                                />

                                {text ? (
                                  <RollingPaperBoardPostitPreviewText
                                    slotIndex={slotIdx}
                                    text={text}
                                  />
                                ) : (
                                  <div
                                    className={`pointer-events-none absolute ${modalPostitFrameInsetClass(slotIdx)} z-[5] flex min-h-0 flex-col items-center justify-center overflow-hidden ${postitBoardTextFramePaddingClass(slotIdx)}`}
                                  >
                                    <span
                                      className={`text-center text-[13px] leading-snug text-slate-400/90 sm:text-[14px] ${ROLLING_POSTIT_FONT_CLASS}`}
                                    >
                                      {canComment && !occupied
                                        ? "탭하여 작성"
                                        : occupied
                                          ? "탭하여 보기"
                                          : ""}
                                    </span>
                                  </div>
                                )}

                                {canComment && !occupied ? (
                                  <button
                                    type="button"
                                    className="absolute inset-0 z-10 cursor-pointer rounded-sm bg-transparent transition hover:bg-black/[0.03] active:bg-black/[0.06]"
                                    aria-label={`포스트잇 ${globalPostitNo}번에 메시지 작성`}
                                    onClick={() => openCreateModal(slotIdx)}
                                  />
                                ) : occupied ? (
                                  <button
                                    type="button"
                                    className="absolute inset-0 z-10 cursor-pointer rounded-sm bg-transparent transition hover:bg-black/[0.03] active:bg-black/[0.06]"
                                    aria-label={`포스트잇 ${globalPostitNo}번 메시지 보기`}
                                    onClick={() => openViewModal(slotIdx)}
                                  />
                                ) : null}
                              </div>
                            </div>
                          );
                        })}

                        <div
                          className={`pointer-events-none absolute bottom-2 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 transition-opacity duration-200 sm:bottom-3 sm:gap-2.5 ${
                            modalOpen ? "opacity-0" : "opacity-100"
                          }`}
                        >
                          <button
                            type="button"
                            disabled={loading || visibleBoardPage <= 0}
                            onClick={goPrevBoard}
                            className="pointer-events-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-sm ring-1 ring-slate-200/90 transition hover:bg-white disabled:pointer-events-none disabled:opacity-35"
                            aria-label="이전 보드"
                          >
                            <CaretLeftIcon size={20} weight="bold" />
                          </button>
                          <span className="pointer-events-none min-w-[3.25rem] text-center text-[11px] font-semibold tabular-nums text-slate-700">
                            {visibleBoardPage + 1} / {boardsToRender}
                          </span>
                          <button
                            type="button"
                            disabled={
                              loading ||
                              visibleBoardPage >= boardsToRender - 1
                            }
                            onClick={goNextBoard}
                            className="pointer-events-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-sm ring-1 ring-slate-200/90 transition hover:bg-white disabled:pointer-events-none disabled:opacity-35"
                            aria-label="다음 보드"
                          >
                            <CaretRightIcon size={20} weight="bold" />
                          </button>
                        </div>
                      </div>

                      {showRollingPaperShareEntry ? (
                        <div
                          className={`pointer-events-none absolute bottom-6 right-[4%] z-30 flex flex-col items-end gap-2.5 transition-opacity duration-200 ${
                            modalOpen ? "opacity-0" : "opacity-100"
                          }`}
                        >
                          <BoardShareFabButton
                            onClick={() => setIsShareModalOpen(true)}
                            ariaLabel="롤링페이퍼 공유"
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                  </div>

                </div>

                <RollingPaperProfileHeader
                  recipientName={headerTitle}
                  isSidebarOpen={isSidebarOpen}
                  onMenuClick={handleRollingPaperMenuClick}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {visitorMenuLoggedIn ? (
        <AppSideMenu
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleRollingPaperLogout}
          hideMyWishlistShortcut
        />
      ) : (
        <PublicWishlistVisitorMenu
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          loggedIn={false}
          onLogout={handleRollingPaperLogout}
          loginHref={loginHrefWithReturn}
        />
      )}
    </main>

      {showRollingPaperShareEntry ? (
        <BoardShareDialog
          presentation="page"
          open={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          description={
            !detail?.isOwner
              ? "롤링페이퍼 링크를 복사하거나 공유할 수 있어요. 친구에게 메시지를 남기게 하려면 댓글 초대 링크를 보내 주세요."
              : shareTab === "comment"
                ? "댓글 작성용 단축 링크예요. 공개일(기준일)까지 접속 후 작성할 수 있어요."
                : "받는 사람만 저장·열람할 링크예요. 이 링크로는 댓글을 작성할 수 없어요."
          }
          absoluteUrl={detail?.isOwner ? commentTabShareUrl : rollingShareUrl}
          linkHref={
            detail?.isOwner ? commentTabShareUrl : rollingSharePathWithQs || null
          }
          rollingPaperOwnerTabs={
            detail?.isOwner
              ? {
                  activeTab: shareTab,
                  onTabChange: setShareTab,
                  comment: {
                    absoluteUrl: commentTabShareUrl,
                    linkHref: commentTabShareUrl,
                  },
                  view: {
                    absoluteUrl: viewTabShareUrl,
                    linkHref: viewTabShareUrl,
                    expiresAt: ownerViewExpiresAt,
                    error: ownerViewShareError,
                  },
                }
              : undefined
          }
          secondaryAbsoluteUrl={
            detail?.isOwner ? undefined : rollingShareSecondaryAbsolute
          }
          secondaryLinkHref={
            detail?.isOwner ? undefined : rollingShareSecondaryPath
          }
          primaryLinkCaption={
            detail?.isOwner ? undefined : rollingShareModalLinks.primaryCaption
          }
          secondaryLinkCaption={
            detail?.isOwner ? undefined : rollingShareModalLinks.secondaryCaption
          }
          navigatorShareTitle="롤링페이퍼"
        />
      ) : null}

      {modalOpen && portalReady && typeof document !== "undefined"
        ? createPortal(rollingPaperOverlay, document.body)
        : null}
    </>
  );
}
