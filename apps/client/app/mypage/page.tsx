"use client";

import { CaretLeft, TextAlignJustify } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { AppSideMenu } from "@/components/common/AppSideMenu";
import { MyPageForm } from "@/components/common/MyPageForm";
import { useMyPageForm } from "@/features/user/hooks";
import { clearAccessToken } from "@/lib/api/token-store";
import {
  APP_MAIN_COLUMN,
  APP_MAIN_SCROLL_BODY,
  APP_SHELL_STAGE,
  APP_SHELL_VIEWPORT_MAIN,
} from "@/lib/constants/app-shell-layout";
import {
  PAGE_HEADER_BACK_BUTTON,
  PAGE_HEADER_MENU_BUTTON,
  PAGE_HEADER_ROW,
} from "@/lib/constants/page-header";
import { navigateAppBack } from "@/lib/navigate-app-back";

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

    canWithdrawAccount,
    withdrawRequiresPassword,
    isWithdrawModalOpen,
    withdrawStep,
    withdrawPassword,
    withdrawMessage,
    isWithdrawSubmitting,
    openWithdrawModal,
    closeWithdrawModal,
    goWithdrawConfirmNext,
    goWithdrawConfirmBack,
    updateWithdrawPassword,
    submitWithdrawAccount,
  } = useMyPageForm();

  const handleLogout = useCallback(() => {
    clearAccessToken();
    setIsSidebarOpen(false);
    router.push("/login");
  }, [router]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleHeaderBack = useCallback(() => {
    navigateAppBack(router, "/");
  }, [router]);

  return (
    <main className={APP_SHELL_VIEWPORT_MAIN}>
      <AppSideMenu
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className={APP_SHELL_STAGE}>
        <div className={APP_MAIN_COLUMN}>
          <header className={PAGE_HEADER_ROW}>
            <button
              type="button"
              onClick={handleHeaderBack}
              className={PAGE_HEADER_BACK_BUTTON}
              aria-label="이전 페이지로"
            >
              <CaretLeft size={22} weight="bold" />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleSidebar();
              }}
              className={PAGE_HEADER_MENU_BUTTON}
              aria-label="메뉴 열기"
              aria-expanded={isSidebarOpen}
            >
              <TextAlignJustify size={23} weight="bold" />
            </button>
          </header>

          {/** 위시와 동일 오로라 배경 위 콘텐츠 */}
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <div className={APP_MAIN_SCROLL_BODY}>
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
                canWithdrawAccount={canWithdrawAccount}
                withdrawRequiresPassword={withdrawRequiresPassword}
                isWithdrawModalOpen={isWithdrawModalOpen}
                withdrawStep={withdrawStep}
                withdrawPassword={withdrawPassword}
                withdrawMessage={withdrawMessage}
                isWithdrawSubmitting={isWithdrawSubmitting}
                onOpenWithdrawModal={openWithdrawModal}
                onCloseWithdrawModal={closeWithdrawModal}
                onWithdrawConfirmNext={goWithdrawConfirmNext}
                onWithdrawConfirmBack={goWithdrawConfirmBack}
                onChangeWithdrawPassword={updateWithdrawPassword}
                onSubmitWithdrawAccount={submitWithdrawAccount}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}