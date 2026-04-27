import { publicApiClient } from "@/lib/api/client";
import type { RankEntry } from "@/components/ranking/types";

const SCHOOL_USER_RANKINGS_PATH = "/api/rankings/schools/users";

export type SchoolUserRankingItem = {
  rank: number;
  school: string;
  userCount: number;
};

export type SchoolUserRankingsResponse = {
  success: boolean;
  message: string;
  data: {
    rankings: SchoolUserRankingItem[];
    updatedAt: string;
  };
};

/** GET /api/rankings/schools/users — 학교별 사용자 수 랭킹 (비로그인 허용) */
export async function fetchSchoolUserRankings(): Promise<SchoolUserRankingsResponse> {
  return publicApiClient<SchoolUserRankingsResponse>(SCHOOL_USER_RANKINGS_PATH, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function mapSchoolUserRankingsToEntries(
  data: SchoolUserRankingsResponse["data"],
): RankEntry[] {
  return data.rankings.map((r) => ({
    rank: r.rank,
    title: r.school,
    value: r.userCount,
  }));
}

const SCHOOL_COMMENT_RANKINGS_PATH = "/api/rankings/schools/comments";

export type SchoolCommentRankingItem = {
  rank: number;
  school: string;
  commentCount: number;
};

export type SchoolCommentRankingsResponse = {
  success: boolean;
  message: string;
  data: {
    rankings: SchoolCommentRankingItem[];
    updatedAt: string;
  };
};

/** GET /api/rankings/schools/comments — 학교별 댓글 수 랭킹 (비로그인 허용) */
export async function fetchSchoolCommentRankings(): Promise<SchoolCommentRankingsResponse> {
  return publicApiClient<SchoolCommentRankingsResponse>(SCHOOL_COMMENT_RANKINGS_PATH, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function mapSchoolCommentRankingsToEntries(
  data: SchoolCommentRankingsResponse["data"],
): RankEntry[] {
  return data.rankings.map((r) => ({
    rank: r.rank,
    title: r.school,
    value: r.commentCount,
  }));
}

const USER_COMMENT_RANKINGS_PATH = "/api/rankings/users/comments";

export type UserCommentRankingItem = {
  rank: number;
  username: string;
  /** 표시용 — 없으면 `username` */
  nickname: string;
  commentCount: number;
};

export type UserCommentRankingsResponse = {
  success: boolean;
  message: string;
  data: {
    rankings: UserCommentRankingItem[];
    updatedAt: string;
  };
};

/** GET /api/rankings/users/comments — 개인별 받은 댓글 수 랭킹 (비로그인 허용) */
export async function fetchUserCommentRankings(): Promise<UserCommentRankingsResponse> {
  return publicApiClient<UserCommentRankingsResponse>(USER_COMMENT_RANKINGS_PATH, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function mapUserCommentRankingsToEntries(
  data: UserCommentRankingsResponse["data"],
): RankEntry[] {
  return data.rankings.map((r) => ({
    rank: r.rank,
    title: r.nickname?.trim() || r.username,
    value: r.commentCount,
  }));
}
