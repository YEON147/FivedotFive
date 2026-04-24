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
const STICKER_SIZE = 86;

/** 선물 지름은 항상 스티커보다 큼 (`STICKER_SIZE` 대비 여유) */
const MIN_GIFT_SIZE = STICKER_SIZE + 12;

/**
 * 디자인 캔버스(320×680) 기준 선물 배치.
 * - 슬롯 수가 늘수록 지름은 줄이되 `MIN_GIFT_SIZE` 이상 유지
 * - `stickerSlots` 원형과 선물 원형이 겹치지 않도록 좌표·크기 조정됨
 */
const giftLayouts: Record<GiftLayoutCount, GiftSlot[]> = {
  1: [{ id: 1, top: 352, left: 160, size: 130 }],
  /** 2개: ②는 ①의 대각선 좌하단(왼쪽·아래). 세로 나열은 하단 스티커(S5·S6)와 겹치기 쉬움 */
  2: [
    { id: 1, top: 268, left: 188, size: 98 },
    { id: 2, top: 398, left: 110, size: 98 },
  ],
  3: [
    { id: 1, top: 268, left: 122, size: 90 },
    { id: 2, top: 428, left: 112, size: 90 },
    { id: 3, top: 348, left: 208, size: 90 },
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
  { id: 4, top: 400, left: 270 },
  { id: 5, top: 502, left: 46 },
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
}: {
  slot: BaseSlot;
  kind: SlotKind;
  size: number;
  onClick?: (slotId: number) => void;
  showPlaceholder?: boolean;
}) {
  const hasImage = Boolean(slot.imageSrc);

  if (!hasImage && !showPlaceholder) {
    return null;
  }

  const hoverClass =
    kind === "gift"
      ? "transition-transform hover:scale-100 active:scale-[0.99]"
      : "transition-transform hover:scale-[1.02] active:scale-[0.98]";

  /** 투명 슬롯용 — 점선 전: 연한 흰 테두리 + 반투명 + 블러 */
  const slotChrome =
    "border border-white/35 bg-white/15 shadow-sm backdrop-blur-[4px] text-slate-800";

  /** 스티커가 있을 때: 슬롯 영역 = 이미지(비율 유지). 배경·블러 없음 */
  const stickerFilledSurface =
    "border-0 bg-transparent shadow-none backdrop-blur-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B61FF] hover:ring-2 hover:ring-white/50";

  const isStickerImageOnly = kind === "sticker" && hasImage;

  /** 보드 최대 폭 372px 가정 시 슬롯이 차지하는 대략적인 CSS 폭 — `sizes` 힌트용 */
  const slotSizesHint = `${Math.max(48, Math.round((size / DESIGN_WIDTH) * 372))}px`;

  const slotTransform =
    kind === "sticker"
      ? getStickerSlotCssTransform(slot.id)
      : "translate(-50%, -50%)";

  return (
    <button
      key={slot.id}
      type="button"
      onClick={() => onClick?.(slot.id)}
      className={`absolute aspect-square overflow-hidden rounded-full ${
        isStickerImageOnly ? stickerFilledSurface : slotChrome
      } ${kind === "gift" ? "z-20" : "z-[12]"} ${hoverClass}`}
      style={{
        top: toYPercent(slot.top),
        left: toXPercent(slot.left),
        width: toXPercent(size),
        transform: slotTransform,
      }}
      aria-label={slotAriaLabel(kind, slot.id, hasImage)}
    >
      {hasImage ? (
        <>
          <Image
            src={slot.imageSrc ?? ""}
            alt={slot.imageAlt ?? `${kind} ${slot.id}`}
            fill
            unoptimized
            sizes={slotSizesHint}
            className={
              isStickerImageOnly
                ? "object-contain object-center p-0.5"
                : "object-cover"
            }
          />
          {kind === "gift" ? (
            <span className="pointer-events-none absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/65 px-1 text-[11px] font-semibold text-white">
              {slot.id}
            </span>
          ) : null}
        </>
      ) : (
        <span className="flex h-full w-full items-center justify-center text-wish-body font-semibold">
          {slot.id}
        </span>
      )}
    </button>
  );
}

function GiftSlots({
  count,
  images,
  onSlotClick,
  showPlaceholder,
}: {
  count: GiftLayoutCount;
  images?: Partial<Record<number, string | null>>;
  onSlotClick?: (slotId: number) => void;
  showPlaceholder?: boolean;
}) {
  const slots = mergeSlotImages(giftLayouts[count], images);

  return slots.map((slot) => (
    <SlotBubble
      key={slot.id}
      slot={slot}
      kind="gift"
      size={Math.max(slot.size, MIN_GIFT_SIZE)}
      onClick={onSlotClick}
      showPlaceholder={showPlaceholder}
    />
  ));
}

function StickerSlots({
  images,
  onSlotClick,
  showPlaceholder,
}: {
  images?: Partial<Record<number, string | null>>;
  onSlotClick?: (slotId: number) => void;
  showPlaceholder?: boolean;
}) {
  const slots = mergeSlotImages(stickerSlots, images);

  return slots.map((slot) => (
    <SlotBubble
      key={slot.id}
      slot={slot}
      kind="sticker"
      size={STICKER_SIZE}
      onClick={onSlotClick}
      showPlaceholder={showPlaceholder}
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
export type { GiftLayoutCount, GiftSlot, StickerSlot };
