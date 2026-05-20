const MIN_CONTENT_PAGES_FOR_AD = 3;

function pickInsertAfterContentIndex(
  contentPageCount: number,
  storageKey: string,
): number | null {
  const minInsert = 1;
  const maxInsert = contentPageCount - 2;
  if (contentPageCount < MIN_CONTENT_PAGES_FOR_AD || maxInsert < minInsert) {
    return null;
  }

  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = Number.parseInt(stored, 10);
        if (
          Number.isFinite(parsed) &&
          parsed >= minInsert &&
          parsed <= maxInsert
        ) {
          return parsed;
        }
      }
    } catch {
      /* private mode 등 */
    }
  }

  const picked =
    minInsert + Math.floor(Math.random() * (maxInsert - minInsert + 1));

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(storageKey, String(picked));
    } catch {
      /* ignore */
    }
  }

  return picked;
}

export type CarouselAdSlide = { kind: "ad" };

export type ContentCarouselSlide = {
  kind: "content";
  /** 0-based 콘텐츠 면 인덱스 (위시 0면, 롤링 보드 0면 …) */
  contentIndex: number;
};

export type CarouselSlide = ContentCarouselSlide | CarouselAdSlide;

export function buildCarouselSlidesWithRandomAd(
  contentPageCount: number,
  storageKey: string,
): CarouselSlide[] {
  const insertAfter = pickInsertAfterContentIndex(contentPageCount, storageKey);

  const slides: CarouselSlide[] = [];
  for (let i = 0; i < contentPageCount; i++) {
    slides.push({ kind: "content", contentIndex: i });
    if (insertAfter !== null && i === insertAfter) {
      slides.push({ kind: "ad" });
    }
  }
  /** 맨 끝 페이지(더블 화살표) — 항상 광고 면 */
  slides.push({ kind: "ad" });
  return slides;
}

export function getCarouselSlide(
  slides: CarouselSlide[],
  visualIndex: number,
): CarouselSlide | undefined {
  return slides[visualIndex];
}

export function isCarouselAdSlide(
  slide: CarouselSlide | undefined,
): slide is CarouselAdSlide {
  return slide?.kind === "ad";
}

export function getContentIndexFromVisual(
  slides: CarouselSlide[],
  visualIndex: number,
): number | null {
  const slide = slides[visualIndex];
  if (!slide || slide.kind !== "content") return null;
  return slide.contentIndex;
}

/** 페이지 표시용 — 광고 면이면 null */
export function findVisualIndexForContent(
  slides: CarouselSlide[],
  contentIndex: number,
): number {
  const idx = slides.findIndex(
    (s) => s.kind === "content" && s.contentIndex === contentIndex,
  );
  return idx >= 0 ? idx : contentIndex;
}

export function getContentPagerLabel(
  slides: CarouselSlide[],
  visualIndex: number,
): { current: number; total: number } | "ad" | null {
  const slide = slides[visualIndex];
  if (!slide) return null;
  if (slide.kind === "ad") return "ad";
  const contentTotal = slides.filter((s) => s.kind === "content").length;
  return { current: slide.contentIndex + 1, total: contentTotal };
}
