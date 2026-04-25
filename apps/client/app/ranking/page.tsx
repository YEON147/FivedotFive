"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import {
  buildPodiumTuple,
  formatRankingValue,
  RANKING_TABS,
  RankingLeaderboard,
  RankingPageHeader,
  RankingPlaceholderAd,
  type RankEntry,
  type RankingTabId,
} from "@/components/ranking";
import {
  fetchSchoolCommentRankings,
  fetchSchoolUserRankings,
  fetchUserCommentRankings,
  mapSchoolCommentRankingsToEntries,
  mapSchoolUserRankingsToEntries,
  mapUserCommentRankingsToEntries,
} from "@/features/ranking/api";
import { clearWishlistPageSessionCache } from "@/features/wishlist/wishlist-session-cache";
import { clearAccessToken } from "@/lib/api/token-store";

export default function RankingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<RankingTabId>("schoolStudents");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [schoolRows, setSchoolRows] = useState<RankEntry[]>([]);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [schoolError, setSchoolError] = useState<string | null>(null);

  const [commentRows, setCommentRows] = useState<RankEntry[]>([]);
  const [commentLoading, setCommentLoading] = useState(true);
  const [commentError, setCommentError] = useState<string | null>(null);

  const [personalRows, setPersonalRows] = useState<RankEntry[]>([]);
  const [personalLoading, setPersonalLoading] = useState(true);
  const [personalError, setPersonalError] = useState<string | null>(null);

  const loadSchoolRankings = useCallback(async () => {
    setSchoolLoading(true);
    setSchoolError(null);
    try {
      const res = await fetchSchoolUserRankings();
      if (!res.success) {
        throw new Error(res.message ?? "랭킹을 불러오지 못했습니다.");
      }
      setSchoolRows(mapSchoolUserRankingsToEntries(res.data));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "랭킹 조회 중 오류가 발생했습니다.";
      setSchoolError(message);
      setSchoolRows([]);
    } finally {
      setSchoolLoading(false);
    }
  }, []);

  const loadCommentRankings = useCallback(async () => {
    setCommentLoading(true);
    setCommentError(null);
    try {
      const res = await fetchSchoolCommentRankings();
      if (!res.success) {
        throw new Error(res.message ?? "랭킹을 불러오지 못했습니다.");
      }
      setCommentRows(mapSchoolCommentRankingsToEntries(res.data));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "랭킹 조회 중 오류가 발생했습니다.";
      setCommentError(message);
      setCommentRows([]);
    } finally {
      setCommentLoading(false);
    }
  }, []);

  const loadPersonalRankings = useCallback(async () => {
    setPersonalLoading(true);
    setPersonalError(null);
    try {
      const res = await fetchUserCommentRankings();
      if (!res.success) {
        throw new Error(res.message ?? "랭킹을 불러오지 못했습니다.");
      }
      setPersonalRows(mapUserCommentRankingsToEntries(res.data));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "랭킹 조회 중 오류가 발생했습니다.";
      setPersonalError(message);
      setPersonalRows([]);
    } finally {
      setPersonalLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchoolRankings();
  }, [loadSchoolRankings]);

  useEffect(() => {
    void loadCommentRankings();
  }, [loadCommentRankings]);

  useEffect(() => {
    void loadPersonalRankings();
  }, [loadPersonalRankings]);

  const rows = useMemo(() => {
    if (tab === "schoolStudents") return schoolRows;
    if (tab === "schoolComments") return commentRows;
    if (tab === "personalComments") return personalRows;
    return [];
  }, [tab, schoolRows, commentRows, personalRows]);

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  const orderedTop3 = useMemo(() => buildPodiumTuple(tab, top3), [tab, top3]);

  const valueLabel = useCallback(
    (row: RankEntry) => formatRankingValue(tab, row.value),
    [tab],
  );

  const handleLogout = useCallback(() => {
    clearAccessToken();
    clearWishlistPageSessionCache();
    setIsSidebarOpen(false);
    router.push("/login");
  }, [router]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const listLoading =
    (tab === "schoolStudents" && schoolLoading) ||
    (tab === "schoolComments" && commentLoading) ||
    (tab === "personalComments" && personalLoading);

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex flex-col px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4">
      <AppSideMenu
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-start">
        <div className="mx-auto flex w-full min-h-0 max-w-[372px] flex-1 flex-col">
          <RankingPageHeader
            menuOpen={isSidebarOpen}
            onMenuToggle={toggleSidebar}
          />

          {tab === "schoolStudents" && schoolError ? (
            <div className="mb-3 shrink-0 rounded-xl bg-[var(--color-surface)] px-4 py-3 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-[var(--color-text-primary)]">{schoolError}</p>
              <button
                type="button"
                onClick={() => void loadSchoolRankings()}
                className="mt-2 text-sm font-semibold text-[#7B61FF] underline-offset-2 hover:underline"
              >
                다시 시도
              </button>
            </div>
          ) : null}

          {tab === "schoolComments" && commentError ? (
            <div className="mb-3 shrink-0 rounded-xl bg-[var(--color-surface)] px-4 py-3 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-[var(--color-text-primary)]">{commentError}</p>
              <button
                type="button"
                onClick={() => void loadCommentRankings()}
                className="mt-2 text-sm font-semibold text-[#7B61FF] underline-offset-2 hover:underline"
              >
                다시 시도
              </button>
            </div>
          ) : null}

          {tab === "personalComments" && personalError ? (
            <div className="mb-3 shrink-0 rounded-xl bg-[var(--color-surface)] px-4 py-3 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-[var(--color-text-primary)]">{personalError}</p>
              <button
                type="button"
                onClick={() => void loadPersonalRankings()}
                className="mt-2 text-sm font-semibold text-[#7B61FF] underline-offset-2 hover:underline"
              >
                다시 시도
              </button>
            </div>
          ) : null}

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <RankingLeaderboard
              tabs={RANKING_TABS}
              tab={tab}
              onTabChange={setTab}
              orderedTop3={orderedTop3}
              restRows={rest}
              valueLabel={valueLabel}
              listLoading={listLoading}
            />
          </div>

          <RankingPlaceholderAd />
        </div>
      </div>
    </main>
  );
}
