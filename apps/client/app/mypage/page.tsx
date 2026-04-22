"use client";

import { MyPageForm } from "@/components/common/MyPageForm";
import { useMyPageForm } from "@/features/user/hooks";

export default function MyPagePage() {
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
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
      </section>
    </main>
  );
}