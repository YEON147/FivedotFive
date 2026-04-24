export type CommentData = {
  id: number;
  senderName: string;
  content: string;
  stickerKey: string | null;
  isUser: boolean;
  createdAt: string;
};

export type CommentListData = {
  data: {
    comments: CommentData[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
  };
};

export type CommentCreateData = {
  data: {
    id: number;
  };
};

export type BoardAssetData = {
  assetType: "BACKGROUND" | "STICKER" | "GIFT_ICON";
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

/** GET /api/boards/me/items */
export type MyWishItemsData = {
  success: boolean;
  message: string;
  data: {
    items: WishItemData[];
  };
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

export type PublicBoardData = {
  data: {
    boardSlug: string;
    username: string;
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
