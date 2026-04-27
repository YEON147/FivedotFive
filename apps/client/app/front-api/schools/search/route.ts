/**
 * NEIS 학교 검색 — Next.js Route Handler에서만 처리 (Spring 백엔드로 프록시되지 않음).
 * 환경 변수: NEIS_API_KEY, 선택 NEIS_API_BASE_URL (기본 https://open.neis.go.kr/hub)
 */

import { NextRequest, NextResponse } from "next/server";

/** NEIS에 없는 삼성 첨단기술·SSAFY 캠퍼스 — 검색 시 API 결과와 병합 */
const SSAFY_EXTRA_CAMPUSES: Array<{
  schoolName: string;
  schoolCode: string;
  officeCode: string;
  address: string;
}> = [
  { schoolName: "서울SSAFY", schoolCode: "SeoulSSAFY", officeCode: "", address: "" },
  { schoolName: "대전SSAFY", schoolCode: "DaejeonSSAFY", officeCode: "", address: "" },
  {
    schoolName: "부울경SSAFY",
    schoolCode: "BusanUlsanGyeongnamSSAFY",
    officeCode: "",
    address: "",
  },
  { schoolName: "광주SSAFY", schoolCode: "GwangjuSSAFY", officeCode: "", address: "" },
  {
    schoolName: "대구구미SSAFY",
    schoolCode: "DaeguGumiSSAFY",
    officeCode: "",
    address: "",
  },
];

function matchesSsafyCampus(
  keyword: string,
  campus: (typeof SSAFY_EXTRA_CAMPUSES)[number],
): boolean {
  const kw = keyword.trim();
  if (!kw) return false;
  const lower = kw.toLowerCase();
  if (campus.schoolName.includes(kw)) return true;
  if (campus.schoolCode.toLowerCase().includes(lower)) return true;
  return false;
}

function filterMatchingSsafyCampuses(keyword: string) {
  return SSAFY_EXTRA_CAMPUSES.filter((c) => matchesSsafyCampus(keyword, c));
}

type NeisSchoolRow = {
  SCHUL_NM?: string;
  SD_SCHUL_CODE?: string;
  ATPT_OFCDC_SC_CODE?: string;
  ORG_RDNMA?: string;
};

type NeisSchoolInfoResponse = {
  schoolInfo?: Array<{
    head?: Array<{
      list_total_count?: number;
      RESULT?: {
        CODE?: string;
        MESSAGE?: string;
      };
    }>;
    row?: NeisSchoolRow[];
  }>;
};

export async function GET(request: NextRequest) {
  try {
    const keyword = request.nextUrl.searchParams.get("keyword")?.trim() ?? "";

    if (!keyword) {
      return NextResponse.json(
        {
          success: true,
          data: [],
        },
        { status: 200 }
      );
    }

    const apiKey = process.env.NEIS_API_KEY;
    const baseUrl =
      process.env.NEIS_API_BASE_URL ?? "https://open.neis.go.kr/hub";

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "NEIS_API_KEY가 설정되지 않았습니다.",
        },
        { status: 500 }
      );
    }

    const url = new URL(`${baseUrl}/schoolInfo`);
    url.searchParams.set("KEY", apiKey);
    url.searchParams.set("Type", "json");
    url.searchParams.set("pIndex", "1");
    url.searchParams.set("pSize", "20");
    url.searchParams.set("SCHUL_NM", keyword);

    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.error("NEIS API HTTP 오류", {
        status: response.status,
        statusText: response.statusText,
        rawText,
      });

      return NextResponse.json(
        {
          success: false,
          message: `학교 검색 API 호출에 실패했습니다. (${response.status})`,
        },
        { status: 502 }
      );
    }

    let json: NeisSchoolInfoResponse;

    try {
      json = JSON.parse(rawText) as NeisSchoolInfoResponse;
    } catch (error) {
      console.error("NEIS 응답 JSON 파싱 실패", rawText);
      return NextResponse.json(
        {
          success: false,
          message: "학교 검색 API 응답 파싱에 실패했습니다.",
        },
        { status: 502 }
      );
    }

    const schoolInfo = json.schoolInfo ?? [];
    const rows =
      schoolInfo.find((item) => Array.isArray(item.row))?.row ?? [];

    const neisRows = rows.map((school) => ({
      schoolName: school.SCHUL_NM ?? "",
      schoolCode: school.SD_SCHUL_CODE ?? "",
      officeCode: school.ATPT_OFCDC_SC_CODE ?? "",
      address: school.ORG_RDNMA ?? "",
    }));

    const ssafyExtras = filterMatchingSsafyCampuses(keyword);
    const ssafyCodes = new Set(ssafyExtras.map((c) => c.schoolCode));
    const neisWithoutSsafyDup = neisRows.filter(
      (row) => !ssafyCodes.has(row.schoolCode),
    );
    const data = [...ssafyExtras, ...neisWithoutSsafyDup];

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("학교 검색 route 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "학교 검색 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
