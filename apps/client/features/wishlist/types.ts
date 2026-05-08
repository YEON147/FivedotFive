export type CommentData = {
  id: number;
  senderName: string;
  /** 공개 전(예: 2026-05-05 08:00 KST 이전) 타인 댓글은 API가 `null`로 마스킹할 수 있음 */
  content: string | null;
  stickerKey: string | null;
  /** 본인 댓글 — API는 `isUser` 또는 Jackson `user` */
  isUser: boolean;
  user?: boolean;
  /** GET 응답 — 전역 슬롯: `페이지 * 6 + (0~5)` (구 데이터는 첫 페이지만 0~5) */
  slotIndex?: number | null;
  createdAt: string;
};

/** GET /api/boards/:slug/comments — `ApiResponse.data` 본문 */
export type CommentListPayload = {
  comments: CommentData[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  /** 전체 댓글 수가 6의 배수이면 true — 빈 다음 면(새 페이지) UI */
  isLastPageFull?: boolean;
  /** Jackson이 `isLastPageFull` 대신 내려주는 경우(롬복 boolean getter 명명) */
  lastPageFull?: boolean;
};

export type CommentListData = {
  success?: boolean;
  message?: string;
  data: CommentListPayload;
};

export type CommentCreateData = {
  success?: boolean;
  message?: string;
  data: {
    id: number;
    slotIndex: number;
  };
};

export type BoardAssetData = {
  /** 서버 `AssetType` — 선물 아이콘은 `GIFT_STICKER`, 일부 응답은 `GIFT_ICON` 호환 */
  assetType: "BACKGROUND" | "STICKER" | "GIFT_ICON" | "GIFT_STICKER";
  assetKey: string;
  slotIndex: number | null;
};

export type WishItemData = {
  slotIndex: number;
  itemName: string | null;
  iconKey: string | null;
  likeCount: number;
  status: string | null;
};

export type MyBoardData = {
  data: {
    boardSlug: string;
    isPublic: boolean;
    targetDate: string;
    items: WishItemData[];
    assets: BoardAssetData[];
  };
};

/** GET /api/boards/me/items — `ApiResponse.data`(내부 `WishItemListResponse`) */
export type MyWishItemsData = {
  success?: boolean;
  message?: string;
  data: {
    items: WishItemData[];
  };
};

export type PublicBoardData = {
  data: {
    boardSlug: string;
    username: string;
    /** 공개 보드 헤더 표시용 — 없으면 `username` 폴백 */
    nickname?: string | null;
    targetDate: string;
    items: WishItemData[];
    assets: BoardAssetData[];
  };
};

/** 댓글 스티커 선택 — `assetKey`가 API `stickerKey`와 동일 */
export type StickerOption = {
  id: string;
  label: string;
  assetKey: string;
};

/** GET /api/me/boards-all — `data[]` 항목 (`type` 표기는 백엔드 스펙에 따라 다를 수 있음) */
export type MyBoardListEntry = {
  /** 예: WISH_BOARD | WISHBOARD | ROLLING_PAPER | ROLLINGPAPER */
  type: string;
  slug: string;
  title: string | null;
  createdAt: string;
};

export type MyBoardsAllApiResponse = {
  success?: boolean;
  message?: string;
  data: MyBoardListEntry[];
};

/** `GET /api/boards/me` — 최신 1건 메타(신규 스펙) */
export type MyLatestBoardSummaryPayload = {
  type: string;
  slug: string;
  title?: string | null;
  targetDate?: string | null;
  createdAt: string;
  /** WISHBOARD만 */
  isPublic?: boolean;
  /** ROLLINGPAPER만 */
  recipientName?: string;
  imageKey?: string | null;
};
