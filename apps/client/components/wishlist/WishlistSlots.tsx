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
const STICKER_SIZE = 68;

const giftLayouts: Record<GiftLayoutCount, GiftSlot[]> = {
  1: [{ id: 1, top: 330, left: 160, size: 138 }],
  2: [
    { id: 1, top: 260, left: 148, size: 110 },
    { id: 2, top: 395, left: 130, size: 110 },
  ],
  3: [
    { id: 1, top: 270, left: 112, size: 100 },
    { id: 2, top: 395, left: 110, size: 100 },
    { id: 3, top: 340, left: 214, size: 100 },
  ],
};

const stickerSlots: StickerSlot[] = [
  { id: 1, top: 180, left: 52 },
  { id: 2, top: 128, left: 170 },
  { id: 3, top: 195, left: 256 },
  { id: 4, top: 455, left: 256 },
  { id: 5, top: 515, left: 52 },
  { id: 6, top: 555, left: 156 },
];

function toXPercent(px: number) {
  return `${(px / DESIGN_WIDTH) * 100}%`;
}

function toYPercent(px: number) {
  return `${(px / DESIGN_HEIGHT) * 100}%`;
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
}: {
  slot: BaseSlot;
  kind: SlotKind;
  size: number;
  onClick?: (slotId: number) => void;
}) {
  const hasImage = Boolean(slot.imageSrc);

  return (
    <button
      key={slot.id}
      type="button"
      onClick={() => onClick?.(slot.id)}
      className="absolute aspect-square overflow-hidden rounded-full border border-white/70 bg-[#d9d9d9] text-slate-700 shadow-sm transition-transform hover:scale-[1.02]"
      style={{
        top: toYPercent(slot.top),
        left: toXPercent(slot.left),
        width: toXPercent(size),
        transform: "translate(-50%, -50%)",
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
            sizes="100vw"
            className="object-cover"
          />
          <span className="absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-black/65 px-1 text-[11px] font-semibold text-white">
            {slot.id}
          </span>
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
}: {
  count: GiftLayoutCount;
  images?: Partial<Record<number, string | null>>;
  onSlotClick?: (slotId: number) => void;
}) {
  const slots = mergeSlotImages(giftLayouts[count], images);

  return slots.map((slot) => (
    <SlotBubble
      key={slot.id}
      slot={slot}
      kind="gift"
      size={slot.size}
      onClick={onSlotClick}
    />
  ));
}

function StickerSlots({
  images,
  onSlotClick,
}: {
  images?: Partial<Record<number, string | null>>;
  onSlotClick?: (slotId: number) => void;
}) {
  const slots = mergeSlotImages(stickerSlots, images);

  return slots.map((slot) => (
    <SlotBubble
      key={slot.id}
      slot={slot}
      kind="sticker"
      size={STICKER_SIZE}
      onClick={onSlotClick}
    />
  ));
}

export {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  GiftSlots,
  StickerSlots,
  giftLayouts,
  stickerSlots,
  toXPercent,
  toYPercent,
};
export type { GiftLayoutCount, GiftSlot, StickerSlot };
