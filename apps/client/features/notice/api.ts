import { apiClient } from "@/lib/api/client";

const NOTICES_PATH = "/api/notices";

export type NoticeItem = {
  id: number;
  title: string;
  isPinned: boolean;
  startAt: string;
  endAt: string;
  createdAt: string;
};

export type NoticesListResponse = {
  success: boolean;
  message: string;
  data: {
    notices: NoticeItem[];
  };
};

/**
 * GET /api/notices — 로그인 시 Bearer 포함(관리자는 전체, 일반은 기간 내).
 * 비로그인 시 Authorization 없이 호출(기간 내 공지만).
 */
export async function fetchNotices(): Promise<NoticesListResponse> {
  return apiClient<NoticesListResponse>(NOTICES_PATH, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

const ADMIN_NOTICES_PATH = "/api/admin/notices";

export type AdminNoticeCreatePayload = {
  title: string;
  bannerText?: string | null;
  isPinned: boolean;
  /** ISO-8601 로컬 일시 문자열 (예: 2026-04-28T10:00:00) */
  startAt: string;
  endAt: string;
};

export type AdminNoticeCreateResponse = {
  success: boolean;
  message: string;
  data: {
    id: number;
  };
};

/**
 * POST /api/admin/notices — `@RequestPart("request") NoticeCreateRequest` + `images`.
 *
 * `request` 파트는 **파일(File·filename)로 넣지 않고**, `application/json` **Blob만** append 한다.
 * (`filename="request.json"` 이 붙으면 스프링이 MultipartFile 취급해 DTO 바인딩이 깨질 수 있음.)
 *
 * JSON 키는 `NoticeCreateRequest` 필드명과 동일: title, bannerText?, isPinned, startAt, endAt
 *
 * 요청 URL은 상대 경로 `/api/admin/notices` — Next `app/api/admin/notices/route.ts` 가 백엔드로 전달.
 */
export type NoticeDetailImage = {
  displayOrder: number;
  imageUrl: string;
};

export type NoticeDetail = {
  id: number;
  title: string;
  bannerText: string | null;
  isPinned: boolean;
  startAt: string;
  endAt: string;
  images: NoticeDetailImage[];
  createdAt: string;
  updatedAt: string;
};

export type NoticeDetailResponse = {
  success: boolean;
  message: string;
  data: NoticeDetail;
};

/**
 * GET /api/notices/{id} — 상세(비관리자는 기간 내 공지만).
 */
export async function fetchNoticeDetail(id: number): Promise<NoticeDetailResponse> {
  return apiClient<NoticeDetailResponse>(`${NOTICES_PATH}/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export type AdminNoticeUpdatePayload = AdminNoticeCreatePayload;

export type AdminNoticeUpdateResponse = {
  success: boolean;
  message: string;
};

/**
 * PUT /api/admin/notices/{id} — `@RequestPart("request")` + 선택 `images`.
 * 이미지를 보내면 기존 이미지 전체 교체; 비우면 본문·일정만 수정.
 */
export async function updateAdminNotice(
  id: number,
  payload: AdminNoticeUpdatePayload,
  imageFiles?: File[],
): Promise<AdminNoticeUpdateResponse> {
  const body: Record<string, unknown> = {
    title: payload.title.trim(),
    isPinned: payload.isPinned,
    startAt: payload.startAt,
    endAt: payload.endAt,
  };
  const bt = payload.bannerText?.trim();
  if (bt) body.bannerText = bt;

  const formData = new FormData();
  formData.append(
    "request",
    new Blob([JSON.stringify(body)], { type: "application/json" }),
  );

  const files = imageFiles?.length
    ? [...imageFiles].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
      )
    : [];
  for (const file of files) {
    formData.append("images", file);
  }

  return apiClient<AdminNoticeUpdateResponse>(`${ADMIN_NOTICES_PATH}/${id}`, {
    method: "PUT",
    body: formData,
  });
}

export type AdminNoticeDeleteResponse = {
  success: boolean;
  message: string;
};

/** DELETE /api/admin/notices/{id} */
export async function deleteAdminNotice(id: number): Promise<AdminNoticeDeleteResponse> {
  return apiClient<AdminNoticeDeleteResponse>(`${ADMIN_NOTICES_PATH}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function createAdminNotice(
  payload: AdminNoticeCreatePayload,
  imageFiles: File[],
): Promise<AdminNoticeCreateResponse> {
  const sorted = [...imageFiles].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  );

  const body: Record<string, unknown> = {
    title: payload.title.trim(),
    isPinned: payload.isPinned,
    startAt: payload.startAt,
    endAt: payload.endAt,
  };
  const bt = payload.bannerText?.trim();
  if (bt) body.bannerText = bt;

  const formData = new FormData();
  formData.append(
    "request",
    new Blob([JSON.stringify(body)], { type: "application/json" }),
  );
  for (const file of sorted) {
    formData.append("images", file);
  }

  return apiClient<AdminNoticeCreateResponse>(ADMIN_NOTICES_PATH, {
    method: "POST",
    body: formData,
  });
}
