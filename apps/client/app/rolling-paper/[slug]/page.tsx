"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";

import { WishlistCenterDialog } from "@/components/wishlist/WishlistCenterDialog";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "@/components/wishlist/WishlistSlots";
import {
  createRollingPaperComment,
  DEFAULT_ROLLING_COMMENT_STICKER_KEY,
  getRollingPaperComments,
  getRollingPaperDetail,
  type RollingPaperCommentRow,
  type RollingPaperDetailPayload,
} from "@/features/rolling-paper/api";
import { getAccessToken } from "@/lib/api/token-store";

const ROLLING_PAPER_BOARD_WRAP =
  "relative flex h-full min-h-0 max-h-full w-full max-w-[min(420px,calc(100vw-1.5rem))] flex-1 flex-col overflow-visible bg-transparent";

const ROLLING_PAPER_BOARD_FRAME =
  "relative isolate overflow-visible rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 wishlist-board-frame--decorate mx-auto w-full max-w-[372px] max-h-[min(680px,100%)] shrink-0 ring-violet-200/55";

const ROLLING_PAPER_BOARD_INNER =
  "relative h-full w-full min-h-0 min-w-0 overflow-visible bg-transparent";

const COLLAGE_BG = "bg-[#f4f2ec]";

type CollagePiece =
  | {
      kind: "polaroid";
      src: string;
      className: string;
      aspect: [number, number];
      alt: string;
    }
  | {
      kind: "postit";
      slotIndex: number;
      src: string;
      className: string;
      aspect: [number, number];
      alt: string;
    };

const COLLAGE_PIECES: CollagePiece[] = [
  {
    kind: "polaroid",
    src: "/rollingpaper/rollingpaper-01.png",
    className: "left-[5%] top-[1%] z-10 w-[46%] -rotate-[7deg]",
    aspect: [376, 489],
    alt: "폴라로이드 포토 프레임",
  },
  {
    kind: "postit",
    slotIndex: 0,
    src: "/rollingpaper/postit_01.png",
    className: "right-2 top-[16%] z-[30] w-[42%] rotate-[4deg]",
    aspect: [435, 466],
    alt: "포스트잇1",
  },
  {
    kind: "postit",
    slotIndex: 1,
    src: "/rollingpaper/postit_02.png",
    className: "left-[6%] top-[38%] z-[14] w-[56%] -rotate-[6deg]",
    aspect: [642, 571],
    alt: "포스트잇2",
  },
  {
    kind: "postit",
    slotIndex: 2,
    src: "/rollingpaper/postit_03.png",
    className: "right-[4%] bottom-[18%] z-[18] w-[44%] rotate-[5deg]",
    aspect: [458, 542],
    alt: "포스트잇3",
  },
  {
    kind: "postit",
    slotIndex: 3,
    src: "/rollingpaper/postit_04.png",
    className: "left-[7%] bottom-[4%] z-[22] w-[42%] -rotate-[10deg]",
    aspect: [399, 436],
    alt: "포스트잇4",
  },
];

const CONTENT_MAX = 200;

function displayNameFromSlug(slug: string): string {
  const raw = slug?.trim() || "";
  if (!raw) return "회원";
  try {
    return decodeURIComponent(raw).replace(/-/g, " ");
  } catch {
    return raw.replace(/-/g, " ");
  }
}

export default function RollingPaperSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: slugParam } = use(params);
  const slug = slugParam?.trim() ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const rollingToken = searchParams.get("token")?.trim() || null;

  const [detail, setDetail] = useState<RollingPaperDetailPayload | null>(null);
  const [detailForbidden, setDetailForbidden] = useState(false);
  const [slotComments, setSlotComments] = useState<
    Partial<Record<number, RollingPaperCommentRow>>
  >({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [guestNickname, setGuestNickname] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [loggedInState, setLoggedInState] = useState(() =>
    Boolean(getAccessToken()?.trim()),
  );

  useEffect(() => {
    const sync = () => setLoggedInState(!!getAccessToken()?.trim());
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const headerTitle = useMemo(() => {
    const n = detail?.recipientName?.trim();
    if (n) return n;
    return displayNameFromSlug(slug);
  }, [detail?.recipientName, slug]);

  const loadBoard = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setLoadError(null);
    setDetailForbidden(false);
    try {
      const [detailRes, commentsRes] = await Promise.all([
        getRollingPaperDetail(slug, rollingToken),
        getRollingPaperComments(slug, { rollingToken, page: 0, size: 8 }),
      ]);
      setDetail(detailRes.data);
      const next: Partial<Record<number, RollingPaperCommentRow>> = {};
      for (const c of commentsRes.data.comments ?? []) {
        const si = c.slotIndex;
        if (typeof si === "number" && si >= 0 && si <= 3) {
          next[si] = c;
        }
      }
      setSlotComments(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "불러오지 못했습니다.";
      if (
        msg.includes("403") ||
        msg.includes("권한") ||
        msg.includes("FORBIDDEN") ||
        msg.includes("롤링페이퍼에 대한 권한")
      ) {
        setDetailForbidden(true);
        setDetail(null);
      } else {
        setLoadError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [slug, rollingToken]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const canComment = detail?.canComment === true;

  const openModalForSlot = (slotIndex: number) => {
    if (!canComment) return;
    if (slotComments[slotIndex]) return;
    setActiveSlot(slotIndex);
    setContent("");
    setGuestNickname("");
    setGuestPassword("");
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveSlot(null);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (activeSlot === null || !slug) return;
    const member = Boolean(getAccessToken()?.trim());
    const trimmed = content.trim();
    if (!trimmed) {
      setFormError("내용을 입력해 주세요.");
      return;
    }
    if (trimmed.length > CONTENT_MAX) {
      setFormError(`댓글은 ${CONTENT_MAX}자 이내입니다.`);
      return;
    }
    if (!member) {
      const nick = guestNickname.trim();
      if (!nick) {
        setFormError("닉네임을 입력해 주세요. (비회원)");
        return;
      }
      if (nick.length > 8) {
        setFormError("닉네임은 8자 이내입니다.");
        return;
      }
      if (!guestPassword.trim()) {
        setFormError("비밀번호를 입력해 주세요. (비회원)");
        return;
      }
    }

    setFormError(null);
    setSubmitting(true);
    try {
      if (member) {
        await createRollingPaperComment(
          slug,
          {
            content: trimmed,
            stickerKey: DEFAULT_ROLLING_COMMENT_STICKER_KEY,
            slotIndex: activeSlot,
          },
          rollingToken,
        );
      } else {
        await createRollingPaperComment(
          slug,
          {
            content: trimmed,
            stickerKey: DEFAULT_ROLLING_COMMENT_STICKER_KEY,
            slotIndex: activeSlot,
            guestNickname: guestNickname.trim(),
            guestPassword: guestPassword,
          },
          rollingToken,
        );
      }
      closeModal();
      await loadBoard();
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "작성에 실패했습니다.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!slug) {
    return (
      <main className="wishlist-page-root app-shell-viewport-floor flex min-h-0 flex-col px-3 py-10 sm:px-4">
        <p className="text-center text-body-sm text-slate-600">잘못된 경로입니다.</p>
      </main>
    );
  }

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex min-h-0 flex-col overflow-visible px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4">
      <div className="relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col items-stretch justify-start overflow-visible">
        <section className={`${ROLLING_PAPER_BOARD_WRAP} mx-auto min-h-0 w-full`}>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-visible p-0">
            <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-visible px-1 pb-1 pt-2 sm:px-2 sm:pb-2 sm:pt-3">
              <div
                className={ROLLING_PAPER_BOARD_FRAME}
                style={{
                  aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
                }}
              >
                <div
                  className={`pointer-events-none absolute inset-0 z-0 rounded-[18px] ${COLLAGE_BG}`}
                  aria-hidden
                />

                <div
                  className={`${ROLLING_PAPER_BOARD_INNER} relative z-10 flex h-full min-h-0 flex-col`}
                >
                  <header className="flex shrink-0 items-start justify-between gap-2 px-1 pb-2 pt-0 sm:px-2">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-left leading-snug text-slate-900">
                        <span className="block text-[clamp(15px,4.2vw,18px)]">
                          <span className="font-bold text-[#7B61FF]">{headerTitle}</span>
                          <span className="font-light text-slate-900">
                            님을 위한 롤링페이퍼
                          </span>
                        </span>
                      </h1>
                      <Link
                        href="/wishlist"
                        className="mt-1 inline-block text-[12px] font-medium text-[#7B61FF]/90 underline-offset-4 hover:underline"
                      >
                        위시 홈으로
                      </Link>
                    </div>
                  </header>

                  {loading ? (
                    <div className="flex flex-1 items-center justify-center py-16 text-[13px] text-slate-500">
                      불러오는 중…
                    </div>
                  ) : detailForbidden ? (
                    <div className="mx-2 mb-2 flex flex-1 flex-col justify-center rounded-[14px] bg-white/80 px-4 py-8 text-center shadow-inner">
                      <p className="text-[14px] font-medium text-slate-800">
                        이 페이지에 접근할 수 없습니다.
                      </p>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                        소유자이거나 공유 링크(
                        <span className="font-mono text-[12px]">?token=</span>
                        )가 포함된 주소로 열어 주세요.
                      </p>
                    </div>
                  ) : loadError ? (
                    <div className="mx-2 mb-2 flex flex-1 flex-col items-center justify-center rounded-[14px] bg-red-50/90 px-4 py-8 text-center">
                      <p className="text-[13px] text-red-800">{loadError}</p>
                      <button
                        type="button"
                        className="mt-3 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-slate-800 shadow-sm ring-1 ring-slate-200"
                        onClick={() => void loadBoard()}
                      >
                        다시 시도
                      </button>
                    </div>
                  ) : (
                    <>
                      {detail && !canComment ? (
                        <div className="mx-2 mb-2 rounded-[12px] bg-amber-50 px-3 py-2 text-[12px] leading-snug text-amber-950 ring-1 ring-amber-200/80">
                          이 링크로는 댓글을 작성할 수 없습니다. (보기 전용 링크)
                        </div>
                      ) : null}

                      <div
                        className={`relative mx-2 mb-1 mt-0 min-h-0 flex-1 overflow-visible rounded-[14px] ${COLLAGE_BG} shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]`}
                      >
                        {COLLAGE_PIECES.map((piece) => {
                          const [aw, ah] = piece.aspect;
                          if (piece.kind === "polaroid") {
                            return (
                              <div
                                key={piece.src}
                                className={`pointer-events-none absolute ${piece.className}`}
                                style={{ aspectRatio: `${aw} / ${ah}` }}
                              >
                                <div className="relative h-full w-full">
                                  <Image
                                    src={piece.src}
                                    alt={piece.alt}
                                    fill
                                    className="object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                                    sizes="(max-width: 420px) 50vw, 220px"
                                    priority
                                  />
                                </div>
                              </div>
                            );
                          }

                          const slotIdx = piece.slotIndex;
                          const row = slotComments[slotIdx];
                          const occupied = Boolean(row);
                          const text =
                            row?.content?.trim() ||
                            (occupied ? "···" : "");

                          return (
                            <div
                              key={piece.src}
                              className={`absolute ${piece.className}`}
                              style={{ aspectRatio: `${aw} / ${ah}` }}
                            >
                              <div className="relative h-full w-full">
                                <Image
                                  src={piece.src}
                                  alt={piece.alt}
                                  fill
                                  className="pointer-events-none object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                                  sizes="(max-width: 420px) 50vw, 220px"
                                />

                                <div className="pointer-events-none absolute inset-[10%_9%_14%_9%] z-[5] flex items-center justify-center overflow-hidden">
                                  {text ? (
                                    <p className="max-h-full w-full overflow-hidden text-center text-[10px] font-medium leading-[1.25] text-slate-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] sm:text-[11px]">
                                      {text}
                                    </p>
                                  ) : (
                                    <span className="text-[9px] text-slate-400/90">
                                      {canComment ? "탭하여 작성" : ""}
                                    </span>
                                  )}
                                </div>

                                {canComment && !occupied ? (
                                  <button
                                    type="button"
                                    className="absolute inset-0 z-10 cursor-pointer rounded-sm bg-transparent transition hover:bg-black/[0.03] active:bg-black/[0.06]"
                                    aria-label={`포스트잇 ${slotIdx + 1}번에 메시지 작성`}
                                    onClick={() => openModalForSlot(slotIdx)}
                                  />
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <WishlistCenterDialog
        open={modalOpen}
        onClose={closeModal}
        title={
          activeSlot !== null
            ? `메시지 작성 (${activeSlot + 1}/4)`
            : "메시지 작성"
        }
        titleId="rp-comment-dialog-title"
        description={
          loggedInState
            ? "작성 후에는 이 슬롯에 다른 메시지를 넣을 수 없습니다."
            : "비회원은 닉네임·비밀번호가 필요합니다. (수정·삭제 시 비밀번호 사용)"
        }
        variant="static"
        staticStack="aboveMenu"
      >
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-slate-700">내용</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={CONTENT_MAX}
              rows={4}
              className="min-h-[96px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] text-slate-900 outline-none ring-violet-300 focus:border-violet-300 focus:ring-2"
              placeholder="생일 축하해!"
              aria-required
            />
            <span className="text-right text-[11px] text-slate-400">
              {content.trim().length}/{CONTENT_MAX}
            </span>
          </label>

          {!loggedInState ? (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-slate-700">
                  닉네임 (최대 8자)
                </span>
                <input
                  type="text"
                  value={guestNickname}
                  onChange={(e) => setGuestNickname(e.target.value.slice(0, 8))}
                  maxLength={8}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-300"
                  placeholder="친구"
                  autoComplete="nickname"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-slate-700">
                  비밀번호
                </span>
                <input
                  type="password"
                  value={guestPassword}
                  onChange={(e) => setGuestPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-300"
                  placeholder="수정·삭제 시 사용"
                  autoComplete="new-password"
                />
              </label>
            </>
          ) : null}

          {formError ? (
            <p className="text-[13px] text-red-600" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-full px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-100"
              onClick={closeModal}
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="button"
              className="rounded-full bg-[#7B61FF] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#6b52e0] disabled:opacity-50"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? "전송 중…" : "등록"}
            </button>
          </div>
        </div>
      </WishlistCenterDialog>
    </main>
  );
}
