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

/** GET /api/boards/me — 위시·롤링 중 최근 생성 1건 요약 */
export type MyBoardMeSummaryWishBoard = {
  type: "WISH_BOARD";
  slug: string;
  title: string | null;
  targetDate: string;
  createdAt: string;
  isPublic: boolean;
  isCommentPublic?: boolean;
};

export type MyBoardMeSummaryRollingPaper = {
  type: "ROLLING_PAPER";
  slug: string;
  title: string | null;
  targetDate: string;
  createdAt: string;
  recipientName: string | null;
  imageKey: string | null;
};

export type MyBoardMeSummary =
  | MyBoardMeSummaryWishBoard
  | MyBoardMeSummaryRollingPaper;

export type MyBoardMeApiResponse = {
  success?: boolean;
  message?: string;
  data: MyBoardMeSummary;
};

/** 에디터·세션 캐시용 — items/assets 포함 스냅샷 */
export type MyBoardData = {
  data: {
    boardSlug: string;
    isPublic: boolean;
    isCommentPublic?: boolean;
    targetDate: string;
    items: WishItemData[];
    assets: BoardAssetData[];
  };
};

/** GET /api/boards/me/list 아이템 */
export type MyWishBoardListItem = {
  boardSlug: string;
  title: string | null;
  isPublic: boolean;
  isCommentPublic?: boolean;
  targetDate: string;
  createdAt: string;
};

export type MyWishBoardListApiResponse = {
  success?: boolean;
  message?: string;
  data: MyWishBoardListItem[];
};

/** GET /api/boards/{slug}/items — `ApiResponse.data`(내부 `WishItemListResponse`) */
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
    /** 기념일 없음·구단 보드 등 — `null`이면 댓글 공개일 기준 UI는 숨김 */
    targetDate: string | null;
    /** GET 보드 응답 — 댓글 즉시 공개 설정 */
    isCommentPublic?: boolean;
    /** 저장본·소유자 여부 (GET /api/boards/{slug}, JWT 시) */
    isOwner?: boolean;
    isSavedCopy?: boolean;
    /** 서버 계산 — 타인 댓글 마스킹 해제 여부 */
    commentsRevealed?: boolean;
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
  /** yyyy-MM-dd 또는 미포함 */
  targetDate?: string | null;
  /** 위시보드 전용 */
  isPublic?: boolean | null;
  /** 롤링페이퍼 전용 */
  recipientName?: string | null;
  imageKey?: string | null;
  /** 롤링페이퍼 전용 — 댓글 즉시 공개 */
  isCommentPublic?: boolean | null;
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
  /** WISH_BOARD: 링크로 다른 사람에게 공개 여부 */
  isPublic?: boolean;
  /** WISH_BOARD·ROLLING_PAPER: 기준일 전 타인 댓글 노출 */
  isCommentPublic?: boolean;
  /** ROLLINGPAPER만 */
  recipientName?: string;
  imageKey?: string | null;
};
