"use client";

import Link from "next/link";
import { MyPageForm } from "@/components/common/MyPageForm";
import { useMyPageForm } from "@/features/user/hooks";

export default function MyPagePage() {
  const {
    values,
    errors,
    isLoading,
    isLoaded,
    isPreviewMode,
    loadMessage,
    loadSuccess,
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
    reload,
  } = useMyPageForm();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">마이페이지</h1>
            <p className="mt-2 text-sm text-slate-500">
              학교, 학년, 성별만 수정 가능하도록 제한하고 회원가입과 동일한 타입과 학교 검색 흐름을 재사용했습니다.
            </p>
          </div>

          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            회원가입 화면 보기
          </Link>
        </div>

        <MyPageForm
          values={values}
          errors={errors}
          isLoading={isLoading}
          isLoaded={isLoaded}
          isPreviewMode={isPreviewMode}
          loadMessage={loadMessage}
          loadSuccess={loadSuccess}
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
          onReload={reload}
          onChange={updateField}
          onSelectSchool={selectSchool}
          onSetSchoolDropdownOpen={setIsSchoolDropdownOpen}
          onSetIgnoreNextSchoolFocus={setIgnoreNextSchoolFocus}
          onSubmit={submit}
          onReset={resetChanges}
        />
      </section>
    </main>
  );
}
