/**
 * 공지 관리자 생성 POST 전용 프록시.
 * 브라우저가 큰 multipart 로 Spring 에 직접 붙거나 dev 리라이트만 타면
 * 연결이 RST 되는 환경이 있어, 동일 오리진으로 들어온 뒤 Node 에서 백엔드로 한 번 더 전달합니다.
 */
import { NextRequest, NextResponse } from "next/server";

import { devError } from "@/lib/dev-log";

export const runtime = "nodejs";

const backendOrigin =
  process.env.BACKEND_REWRITE_TARGET?.replace(/\/$/, "") ||
  "http://127.0.0.1:8080";

export async function POST(request: NextRequest) {
  const url = `${backendOrigin}/api/admin/notices`;

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
      method: "POST",
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
    devError("[api/admin/notices proxy]", e);
    return NextResponse.json(
      {
        success: false,
        message: "공지 등록 요청을 백엔드로 전달하지 못했습니다.",
      },
      { status: 502 },
    );
  }
}
