"use client";

import Image from "next/image";

type BaseSlot = {
  id: number;
  top: number;
  left: number;
  imageAlt?: string;
  imageSrc?: string | null;
};

type GiftLayoutCount = 1 | 2 | 3;

type GiftSlot = BaseSlot & {
  size: number;
};

type StickerSlot = BaseSlot;

type SlotKind = "gift" | "sticker";

const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 680;
/** 스티커 슬롯 원 지름(px, 디자인 좌표 기준) — 선물보다 한 단계 작게 유지 */
const STICKER_SIZE = 88;

/** 선물 지름은 항상 스티커보다 큼 (`STICKER_SIZE` 대비 여유) */
const MIN_GIFT_SIZE = STICKER_SIZE + 18;

/**
 * 디자인 캔버스(320×680) 기준 선물 배치.
 * - 슬롯 수가 늘수록 지름은 줄이되 `MIN_GIFT_SIZE` 이상 유지
 * - `stickerSlots` 원형과 선물 원형이 겹치지 않도록 좌표·크기 조정됨
 */
const giftLayouts: Record<GiftLayoutCount, GiftSlot[]> = {
  1: [{ id: 1, top: 332, left: 160, size: 160 }],
  /** 2개: ②는 ①의 대각선 좌하단(왼쪽·아래). 세로 나열은 하단 스티커(S5·S6)와 겹치기 쉬움 */
  2: [
    { id: 1, top: 268, left: 192, size: 114 },
    { id: 2, top: 388, left: 106, size: 114 },
  ],
  3: [
    { id: 1, top: 270, left: 124, size: 112 },
    { id: 2, top: 428, left: 112, size: 112 },
    { id: 3, top: 350, left: 210, size: 112 },
  ],
};

/**
 * 스티커는 크기 고정 — 코너·가장자리로 살짝 붙여 중앙 선물 영역과 간섭 최소화
 * (GiftSlots 가 StickerSlots 보다 위 z-index 이므로 겹치면 선물이 클릭 우선)
 */
const stickerSlots: StickerSlot[] = [
  { id: 1, top: 220, left: 62 },
  { id: 2, top: 138, left: 148 },
  { id: 3, top: 188, left: 262 },
  /** 오른쪽 끝(270)은 회전·호버 스케일 시 보드 `overflow-hidden`에 잘리기 쉬움 — 262로 안쪽 이동 */
  { id: 4, top: 430, left: 270 },
  { id: 5, top: 492, left: 48 },
  /** 하단·가운데 조각 UI(선물 추가 버튼)와 겹치지 않도록 간격 유지 */
  { id: 6, top: 554, left: 170 },
];

function toXPercent(px: number) {
  return `${(px / DESIGN_WIDTH) * 100}%`;
}

function toYPercent(px: number) {
  return `${(px / DESIGN_HEIGHT) * 100}%`;
}

/** 스티커 슬롯 1·5: 왼쪽(↺), 3·4: 오른쪽(↻)으로 살짝 기울임 — 중심 정렬 유지 */
export function getStickerSlotCssTransform(slotId: number): string {
  const deg =
    slotId === 1 || slotId === 5 ? -7 : slotId === 3 || slotId === 4 ? 7 : 0;
  return deg !== 0
    ? `translate(-50%, -50%) rotate(${deg}deg)`
    : "translate(-50%, -50%)";
}

function mergeSlotImages<TSlot extends BaseSlot>(
  slots: TSlot[],
  images?: Partial<Record<number, string | null>>,
) {
  return slots.map((slot) => ({
    ...slot,
    imageSrc: images?.[slot.id] ?? null,
  }));
}

function slotAriaLabel(kind: SlotKind, id: number, hasImage: boolean) {
  const noun = kind === "gift" ? "gift" : "sticker";
  const state = hasImage ? "filled" : "empty";

  return `${noun} slot ${id}, ${state}`;
}

function SlotBubble({
  slot,
  kind,
  size,
  onClick,
  showPlaceholder = true,
  /** false면 보기 모드 — 채워진 슬롯은 이미지만(투명 버튼), 스티커는 호버·탭 비활성 */
  decorateActive = true,
  /** 스티커 빈 칸일 때만 — 없으면 슬롯 번호(`slot.id`) */
  stickerEmptyLabel,
  /** 선물만 — 부모 래퍼가 `absolute`·중앙 정렬일 때 버튼은 영역만 채움 */
  giftLayoutPosition = "floating",
}: {
  slot: BaseSlot;
  kind: SlotKind;
  size: number;
  onClick?: (slotId: number) => void;
  showPlaceholder?: boolean;
  decorateActive?: boolean;
  stickerEmptyLabel?: string;
  giftLayoutPosition?: "floating" | "embedded";
}) {
  const hasImage = Boolean(slot.imageSrc);

  if (!hasImage && !showPlaceholder) {
    return null;
  }

  const stickerDecorating = kind === "sticker" && decorateActive;

  const hoverClass =
    kind === "gift"
      ? "transition-transform hover:scale-100 active:scale-[0.99]"
      : stickerDecorating
        ? "transition-transform hover:scale-[1.02] active:scale-[0.98]"
        : "";

  /** 투명 슬롯용 — 점선 전: 연한 흰 테두리 + 반투명 + 블러 */
  const slotChrome =
    "border border-white/35 bg-white/15 shadow-sm backdrop-blur-[4px] text-slate-800";

  /** 스티커 이미지 채움 — 꾸미기 모드에서만 링·포커스·호버 */
  const stickerFilledLive =
    "border-0 bg-transparent shadow-none backdrop-blur-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B61FF] hover:ring-2 hover:ring-white/50";
  const stickerFilledStatic =
    "border-0 bg-transparent shadow-none backdrop-blur-0";

  /** 보드 최대 폭 372px 가정 시 슬롯이 차지하는 대략적인 CSS 폭 — `sizes` 힌트용 */
  const slotSizesHint = `${Math.max(48, Math.round((size / DESIGN_WIDTH) * 372))}px`;

  const slotTransform =
    kind === "sticker"
      ? getStickerSlotCssTransform(slot.id)
      : "translate(-50%, -50%)";

  const isGiftEmbedded = kind === "gift" && giftLayoutPosition === "embedded";

  const positionStyle =
    isGiftEmbedded
      ? undefined
      : {
          top: toYPercent(slot.top),
          left: toXPercent(slot.left),
          width: toXPercent(size),
          transform: slotTransform,
        };

  const positionClass = isGiftEmbedded
    ? "relative h-full w-full"
    : "absolute aspect-square";

  return (
    <button
      type="button"
      onClick={() => onClick?.(slot.id)}
      tabIndex={kind === "sticker" && !decorateActive ? -1 : undefined}
      className={`${positionClass} overflow-visible rounded-full ${
        hasImage
          ? decorateActive
            ? stickerFilledLive
            : stickerFilledStatic
          : slotChrome
      } ${kind === "gift" ? "z-20" : "z-[12]"} ${hoverClass} ${
        kind === "sticker" && !decorateActive
          ? "pointer-events-none cursor-default"
          : ""
      }`}
      style={positionStyle}
      aria-label={slotAriaLabel(kind, slot.id, hasImage)}
      aria-disabled={kind === "sticker" && !decorateActive ? true : undefined}
    >
      {hasImage ? (
        <span
          className={`pointer-events-none absolute ${
            kind === "gift"
              ? "inset-0 overflow-hidden rounded-full"
              : "inset-0 overflow-visible"
          }`}
        >
          <Image
            src={slot.imageSrc ?? ""}
            alt={slot.imageAlt ?? `${kind} ${slot.id}`}
            fill
            unoptimized
            sizes={slotSizesHint}
            className={
              kind === "sticker"
                ? "object-contain object-center p-[1%]"
                : "object-contain object-center p-[1%]"
            }
          />
        </span>
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center px-1 text-center font-semibold leading-tight ${
            kind === "sticker" && stickerEmptyLabel != null && stickerEmptyLabel !== ""
              ? "text-[10px] text-slate-800 sm:text-[11px]"
              : "text-wish-body"
          }`}
        >
          {kind === "sticker" && stickerEmptyLabel != null && stickerEmptyLabel !== ""
            ? stickerEmptyLabel
            : slot.id}
        </span>
      )}
    </button>
  );
}

export type GiftSlotsProps = {
  count: GiftLayoutCount;
  images?: Partial<Record<number, string | null>>;
  /** 레이아웃 슬롯 id(1…N) → 선물 이름 — 아이콘 아래 표시 */
  labels?: Partial<Record<number, string>>;
  onSlotClick?: (slotId: number) => void;
  showPlaceholder?: boolean;
  /** false면 보기 모드 — 채워진 슬롯에 포커스·호버 링 없음 */
  decorateActive?: boolean;
};

function GiftSlots({
  count,
  images,
  labels,
  onSlotClick,
  showPlaceholder,
  decorateActive = false,
}: GiftSlotsProps) {
  const slots = mergeSlotImages(giftLayouts[count], images);

  return slots.map((slot) => {
    const sizePx = Math.max(slot.size, MIN_GIFT_SIZE);
    const caption = labels?.[slot.id]?.trim();
    const bubbleProps = {
      slot,
      kind: "gift" as const,
      size: sizePx,
      onClick: onSlotClick,
      showPlaceholder,
      decorateActive,
    };

    if (!caption) {
      return <SlotBubble key={slot.id} {...bubbleProps} giftLayoutPosition="floating" />;
    }

    return (
      <div
        key={slot.id}
        className="absolute z-20 flex max-w-[min(100%,42%)] flex-col items-center"
        style={{
          top: toYPercent(slot.top),
          left: toXPercent(slot.left),
          width: toXPercent(sizePx),
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="relative aspect-square w-full shrink-0">
          <SlotBubble {...bubbleProps} giftLayoutPosition="embedded" />
        </div>
        <p className="text-wish-body line-clamp-2 w-full max-w-full px-0.5 text-center text-[10px] font-normal leading-tight text-slate-800 drop-shadow-[0_1px_0_rgb(255_255_255/0.85)] sm:text-[11px]">
          {caption}
        </p>
      </div>
    );
  });
}

type StickerSlotsProps = {
  images?: Partial<Record<number, string | null>>;
  onSlotClick?: (slotId: number) => void;
  showPlaceholder?: boolean;
  /** false면 보기 모드 — 스티커에 호버·클릭 반응 없음 */
  decorateActive?: boolean;
  /** 빈 스티커 칸에 넣을 문구 — 없으면 1~6 숫자 */
  stickerEmptyLabel?: string;
};

function StickerSlots({
  images,
  onSlotClick,
  showPlaceholder,
  decorateActive = false,
  stickerEmptyLabel,
}: StickerSlotsProps) {
  const slots = mergeSlotImages(stickerSlots, images);

  return slots.map((slot) => (
    <SlotBubble
      key={slot.id}
      slot={slot}
      kind="sticker"
      size={STICKER_SIZE}
      onClick={onSlotClick}
      showPlaceholder={showPlaceholder}
      decorateActive={decorateActive}
      stickerEmptyLabel={stickerEmptyLabel}
    />
  ));
}

export {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GiftSlots,
  StickerSlots,
  STICKER_SIZE,
  giftLayouts,
  stickerSlots,
  toXPercent,
  toYPercent,
};
export type { GiftLayoutCount, GiftSlot, StickerSlot, StickerSlotsProps };
