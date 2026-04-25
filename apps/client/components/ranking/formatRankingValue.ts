import type { RankingTabId } from "./types";

export function formatRankingValue(tab: RankingTabId, value: number): string {
  const n = value.toLocaleString("ko-KR");
  if (tab === "schoolStudents") return `${n}명`;
  return `${n}개`;
}
