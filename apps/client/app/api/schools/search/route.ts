// 학교 검색 api 프론트 처리 로직

import { NextRequest, NextResponse } from "next/server";

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

    const data = rows.map((school) => ({
      schoolName: school.SCHUL_NM ?? "",
      schoolCode: school.SD_SCHUL_CODE ?? "",
      officeCode: school.ATPT_OFCDC_SC_CODE ?? "",
      address: school.ORG_RDNMA ?? "",
    }));

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