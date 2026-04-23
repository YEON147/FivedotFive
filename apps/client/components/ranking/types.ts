export type RankingTabId = "schoolStudents" | "schoolComments" | "personalComments";

export type RankEntry = {
  rank: number;
  title: string;
  value: number;
};

export type RankingTabItem = {
  id: RankingTabId;
  label: string;
};
