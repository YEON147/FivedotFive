"use client";

import { CaretLeft, TextAlignJustify } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import { MyPageForm } from "@/components/common/MyPageForm";
import { useMyPageForm } from "@/features/user/hooks";
import { clearAccessToken } from "@/lib/api/token-store";

const MYPAGE_HEADER_ROW =
  "relative z-40 mb-4 flex w-full shrink-0 items-center justify-between gap-2.5 pl-[7%] pr-[4%] pt-[7%]";

const MYPAGE_MENU_BUTTON =
  "relative z-40 flex size-[42px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#7B61FF] shadow-sm transition hover:bg-slate-200 active:bg-slate-300/90 touch-manipulation";

const MYPAGE_BACK_BUTTON =
  "relative z-40 flex size-[42px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 shadow-sm transition hover:bg-slate-200 active:bg-slate-300/90 touch-manipulation";

const MY_PAGE_BACK_BUTTON =
  "inline-flex size-[42px] shrink-0 items-center justify-center rounded-full text-slate-800 transition hover:opacity-70 active:opacity-50 touch-manipulation";

export default function MyPagePage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    values,
    errors,
    isLoading,
    isLoaded,
    saveMessage,
    saveSuccess,
    isSaving,
    schoolKeyword,
    schoolResults,
    isSchoolSearching,
    isSchoolDropdownOpen,
    hasSelectedSchool,
    ignoreNextSchoolFocus,
    isDirty,
    canSubmit,
    setIgnoreNextSchoolFocus,
    setIsSchoolDropdownOpen,
    updateField,
    selectSchool,
    submit,
    resetChanges,

    nicknameCheckStatus,
    nicknameCheckMessage,
    checkNickname,

    isPasswordModalOpen,
    passwordValues,
    passwordErrors,
    passwordMessage,
    passwordSuccess,
    isPasswordSaving,
    openPasswordModal,
    closePasswordModal,
    updatePasswordField,
    submitPasswordChange,
  } = useMyPageForm();

  const handleLogout = useCallback(() => {
    clearAccessToken();
    setIsSidebarOpen(false);
    router.push("/login");
  }, [router]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  return (
    <main className="wishlist-page-root app-shell-viewport-floor flex flex-col px-3 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] sm:px-4">
      <AppSideMenu
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-start">
        <div className="mx-auto flex w-full min-h-0 max-w-[372px] flex-1 flex-col">
          <header className={MYPAGE_HEADER_ROW}>
            <Link
              href="/wishlist"
              scroll={false}
              prefetch={false}
              className={MYPAGE_BACK_BUTTON}
              aria-label="위시리스트로 이동"
            >
              <CaretLeft size={22} weight="bold" />
            </Link>

            <div className="flex min-h-0 min-w-0 flex-1 justify-center px-2">
              <h1 className="text-center text-wish-title leading-tight text-slate-900">
                My Page
              </h1>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleSidebar();
              }}
              className={MYPAGE_MENU_BUTTON}
              aria-label="메뉴 열기"
              aria-expanded={isSidebarOpen}
            >
              <TextAlignJustify size={23} weight="bold" />
            </button>
          </header>

          {/** 랭킹 페이지와 동일 — `wishlist-page-root` 오로라 위에 셸 없이 콘텐츠 */}
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="signup-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] px-2 pb-5 pt-1 sm:px-3">
              <MyPageForm
                values={values}
                errors={errors}
                isLoading={isLoading}
                isLoaded={isLoaded}
                saveMessage={saveMessage}
                saveSuccess={saveSuccess}
                isSaving={isSaving}
                schoolKeyword={schoolKeyword}
                schoolResults={schoolResults}
                isSchoolSearching={isSchoolSearching}
                isSchoolDropdownOpen={isSchoolDropdownOpen}
                hasSelectedSchool={hasSelectedSchool}
                ignoreNextSchoolFocus={ignoreNextSchoolFocus}
                isDirty={isDirty}
                canSubmit={canSubmit}
                nicknameCheckStatus={nicknameCheckStatus}
                nicknameCheckMessage={nicknameCheckMessage}
                onChange={updateField}
                onCheckNickname={checkNickname}
                onSelectSchool={selectSchool}
                onSetSchoolDropdownOpen={setIsSchoolDropdownOpen}
                onSetIgnoreNextSchoolFocus={setIgnoreNextSchoolFocus}
                onSubmit={submit}
                onReset={resetChanges}
                isPasswordModalOpen={isPasswordModalOpen}
                passwordValues={passwordValues}
                passwordErrors={passwordErrors}
                passwordMessage={passwordMessage}
                passwordSuccess={passwordSuccess}
                isPasswordSaving={isPasswordSaving}
                onOpenPasswordModal={openPasswordModal}
                onClosePasswordModal={closePasswordModal}
                onChangePasswordField={updatePasswordField}
                onSubmitPasswordChange={submitPasswordChange}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}