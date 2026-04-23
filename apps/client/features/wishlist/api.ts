import { apiClient } from "@/lib/api/client";
import type {
  CommentCreateData,
  CommentListData,
  MyBoardData,
  MyWishItemsData,
  PublicBoardData,
} from "./types";

export async function getMyBoard(): Promise<MyBoardData> {
  return apiClient<MyBoardData>("/api/boards/me");
}

/** GET /api/boards/me/items — CHILD, 슬롯 3개 고정 */
export async function getMyWishItems(): Promise<MyWishItemsData> {
  return apiClient<MyWishItemsData>("/api/boards/me/items", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export type PatchMyWishItemBody = {
  itemName: string;
  iconKey?: string;
  /** 서버가 빈 `iconKey`로 아이콘 제거를 허용할 때 */
  clearIcon?: boolean;
};

export type PatchMyWishItemResponse = {
  success: boolean;
  message: string;
};

/** PATCH /api/boards/me/items/:slotIndex — CHILD, slotIndex 1~3 */
export async function patchMyWishItem(
  slotIndex: number,
  body: PatchMyWishItemBody,
): Promise<PatchMyWishItemResponse> {
  const payload: Record<string, string> = {
    itemName: body.itemName,
  };
  if (body.clearIcon) {
    payload.iconKey = "";
  } else if (body.iconKey != null && body.iconKey.trim() !== "") {
    payload.iconKey = body.iconKey.trim();
  }

  return apiClient<PatchMyWishItemResponse>(`/api/boards/me/items/${slotIndex}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export type DeleteMyWishItemResponse = {
  success: boolean;
  message: string;
};

/** DELETE /api/boards/me/items/:slotIndex — CHILD, 슬롯 비우기 (slotIndex 1~3) */
export async function deleteMyWishItem(slotIndex: number): Promise<DeleteMyWishItemResponse> {
  return apiClient<DeleteMyWishItemResponse>(`/api/boards/me/items/${slotIndex}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function getPublicBoard(slug: string): Promise<PublicBoardData> {
  return apiClient<PublicBoardData>(`/api/boards/${slug}`);
}

export async function getComments(slug: string, page: number): Promise<CommentListData> {
  return apiClient<CommentListData>(`/api/boards/${slug}/comments?page=${page + 1}&size=6`);
}

export async function createComment(
  slug: string,
  content: string,
  stickerKey: string,
): Promise<CommentCreateData> {
  return apiClient<CommentCreateData>(`/api/boards/${slug}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, stickerKey }),
  });
}

export async function updateComment(
  slug: string,
  commentId: number,
  content: string,
): Promise<void> {
  await apiClient(`/api/boards/${slug}/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(slug: string, commentId: number): Promise<void> {
  await apiClient(`/api/boards/${slug}/comments/${commentId}`, {
    method: "DELETE",
  });
}
