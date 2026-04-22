"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import { getAccessToken } from "@/lib/api/token-store";

type CreateBoardResponse = {
  success: boolean;
  message?: string;
  data?: {
    boardSlug?: string;
  };
};

export default function Home() {
  const router = useRouter();
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateBoard = async () => {
    if (isCreatingBoard) {
      return;
    }

    if (!getAccessToken()) {
      router.push("/login");
      return;
    }

    setIsCreatingBoard(true);
    setCreateError(null);

    try {
      // 이미 보드가 있으면 바로 이동
      await apiClient<CreateBoardResponse>("/api/boards/me");
      router.push("/wishlist");
    } catch {
      // 보드가 없는 경우에만 생성
      try {
        await apiClient<CreateBoardResponse>("/api/boards", {
          method: "POST",
          body: JSON.stringify({}),
        });
        router.push("/wishlist");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "위시리스트 생성 중 오류가 발생했습니다.";
        setCreateError(message);
      }
    } finally {
      setIsCreatingBoard(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-mint)] px-6 py-10">
      <section className="w-full max-w-md rounded-[32px] bg-white px-8 py-10 text-center shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
        <h1 className="mt-3 text-h1 text-black">메인페이지</h1>
        <p className="mt-3 text-body text-black/70">
          원하는 선물들을 위시리스트로 직접 만들어보세요.
        </p>

        {createError ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {createError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void handleCreateBoard()}
          disabled={isCreatingBoard}
          className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--color-point-coral)] px-6 text-button text-black transition-transform duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreatingBoard ? "생성 중..." : "위시리스트 만들러 가기"}
        </button>
      </section>
    </main>
  );
}
