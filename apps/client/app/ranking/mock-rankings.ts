import type { RankingTabId, RankEntry } from "@/components/ranking/types";

/** 목업 — API 연동 시 제거·교체 */
export const MOCK_RANKINGS: Record<RankingTabId, RankEntry[]> = {
  schoolStudents: [
    { rank: 1, title: "도농초등학교", value: 2112 },
    { rank: 2, title: "대전초등학교", value: 2112 },
    { rank: 3, title: "싸피초등학교", value: 2112 },
    { rank: 4, title: "사등초등학교", value: 1600 },
    { rank: 5, title: "오등초등학교", value: 1600 },
    { rank: 6, title: "육등초등학교", value: 1600 },
    { rank: 7, title: "칠등초등학교", value: 1600 },
    { rank: 8, title: "팔등초등학교", value: 1600 },
  ],
  schoolComments: [
    { rank: 1, title: "도농초등학교", value: 842 },
    { rank: 2, title: "싸피초등학교", value: 791 },
    { rank: 3, title: "대전초등학교", value: 654 },
    { rank: 4, title: "사등초등학교", value: 521 },
    { rank: 5, title: "오등초등학교", value: 498 },
    { rank: 6, title: "육등초등학교", value: 412 },
    { rank: 7, title: "칠등초등학교", value: 305 },
    { rank: 8, title: "팔등초등학교", value: 288 },
  ],
  personalComments: [
    { rank: 1, title: "김싸피", value: 128 },
    { rank: 2, title: "이오점오", value: 96 },
    { rank: 3, title: "박코딩", value: 84 },
    { rank: 4, title: "최위시", value: 72 },
    { rank: 5, title: "정스티커", value: 61 },
    { rank: 6, title: "한댓글", value: 55 },
    { rank: 7, title: "조학교", value: 48 },
    { rank: 8, title: "윤개발", value: 40 },
  ],
};
