/**
 * 공지 관리자 수정 PUT 전용 프록시.
 * POST `/api/admin/notices` 와 동일하게 multipart 를 백엔드로 전달합니다.
 */
import { NextRequest, NextResponse } from "next/server";

import { devError } from "@/lib/dev-log";

export const runtime = "nodejs";

const backendOrigin =
  process.env.BACKEND_REWRITE_TARGET?.replace(/\/$/, "") ||
  "http://127.0.0.1:8080";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = `${backendOrigin}/api/admin/notices/${encodeURIComponent(id)}`;

  const headers = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) {
    headers.set("Authorization", auth);
  }
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  try {
    const body = await request.arrayBuffer();

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body,
      cache: "no-store",
    });

    const buf = await res.arrayBuffer();
    const out = new NextResponse(buf, {
      status: res.status,
      statusText: res.statusText,
    });
    const ct = res.headers.get("content-type");
    if (ct) out.headers.set("Content-Type", ct);
    return out;
  } catch (e) {
    devError("[api/admin/notices/[id] proxy]", e);
    return NextResponse.json(
      {
        success: false,
        message: "공지 수정 요청을 백엔드로 전달하지 못했습니다.",
      },
      { status: 502 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = `${backendOrigin}/api/admin/notices/${encodeURIComponent(id)}`;

  const headers = new Headers();
  const auth = _request.headers.get("authorization");
  if (auth) {
    headers.set("Authorization", auth);
  }

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers,
      cache: "no-store",
    });

    const buf = await res.arrayBuffer();
    const out = new NextResponse(buf, {
      status: res.status,
      statusText: res.statusText,
    });
    const ct = res.headers.get("content-type");
    if (ct) out.headers.set("Content-Type", ct);
    return out;
  } catch (e) {
    devError("[api/admin/notices/[id] DELETE proxy]", e);
    return NextResponse.json(
      {
        success: false,
        message: "공지 삭제 요청을 백엔드로 전달하지 못했습니다.",
      },
      { status: 502 },
    );
  }
}
