import type { RankingTabItem } from "./types";

export const RANKING_TABS: readonly RankingTabItem[] = [
  { id: "schoolStudents", label: "학교 학생 수" },
  { id: "schoolComments", label: "학교 댓글 수" },
  { id: "personalComments", label: "개인 댓글 수" },
] as const;
