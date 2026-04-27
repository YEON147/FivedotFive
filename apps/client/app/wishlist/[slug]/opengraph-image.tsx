import { readFile } from "fs/promises";
import { join } from "path";

import { ImageResponse } from "next/og";

import {
  displayNameFromBoard,
  getPublicBoardForOg,
} from "@/lib/server/public-board-for-og";

/** 로컬 파일만 사용 — CDN 없이 `public/fonts`와 동일한 서비스 폰트 (`globals.css` @font-face와 동일 소스). */
export const runtime = "nodejs";

export const alt = "위시리스트 미리보기";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ACCENT = "#7B61FF";
const SITE_NAME = "오쩜오";

/** UI 기본 폰트명 — `globals.css` 의 font-family 와 동일 */
const FONT_FAMILY_UI = "TmoneyRoundWind";

function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const sliced = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
  return sliced as ArrayBuffer;
}

/** `public/fonts` — 브라우저용 `/fonts/...` 와 같은 파일을 OG 생성 시 디스크에서 로드 */
async function loadServiceUiFonts(): Promise<
  | {
      fonts: Array<{
        name: typeof FONT_FAMILY_UI;
        data: ArrayBuffer;
        weight: 400 | 800;
        style: "normal";
      }>;
    }
  | Record<string, never>
> {
  try {
    const dir = join(process.cwd(), "public", "fonts");
    const [regularBuf, extraBoldBuf] = await Promise.all([
      readFile(join(dir, "TmoneyRoundWindRegular.otf")),
      readFile(join(dir, "TmoneyRoundWindExtraBold.otf")),
    ]);
    return {
      fonts: [
        {
          name: FONT_FAMILY_UI,
          data: bufferToArrayBuffer(regularBuf),
          weight: 400,
          style: "normal",
        },
        {
          name: FONT_FAMILY_UI,
          data: bufferToArrayBuffer(extraBoldBuf),
          weight: 800,
          style: "normal",
        },
      ],
    };
  } catch {
    return {};
  }
}

type ImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const board = await getPublicBoardForOg(slug);
  const display = displayNameFromBoard(board);
  const titleLine = `${display}님의 위시리스트`;

  const fontOpts = await loadServiceUiFonts();
  const hasFonts = "fonts" in fontOpts && fontOpts.fonts.length > 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(145deg, #f8f7ff 0%, #ffffff 48%, #eef0ff 100%)",
          fontFamily: hasFonts ? `${FONT_FAMILY_UI}, sans-serif` : "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1.25,
            maxWidth: 960,
          }}
        >
          {titleLine}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            fontWeight: 400,
            color: ACCENT,
          }}
        >
          {SITE_NAME}
        </div>
      </div>
    ),
    {
      ...size,
      ...(hasFonts ? fontOpts : {}),
    },
  );
}
