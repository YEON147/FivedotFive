"use client";

import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { GENDER_OPTIONS, GRADE_OPTIONS } from "@/lib/constants/signup";
import type { MyPageFormValues } from "@/features/user/types";
import type { SchoolOption } from "@/features/signup/types";

type MyPageFormProps = {
  values: MyPageFormValues;
  errors: Partial<Record<"schoolName" | "gender" | "grade", string>>;
  isLoading: boolean;
  isLoaded: boolean;
  isPreviewMode: boolean;
  loadMessage: string | null;
  loadSuccess: boolean | null;
  saveMessage: string | null;
  saveSuccess: boolean | null;
  isSaving: boolean;
  schoolKeyword: string;
  schoolResults: SchoolOption[];
  isSchoolSearching: boolean;
  isSchoolDropdownOpen: boolean;
  hasSelectedSchool: boolean;
  ignoreNextSchoolFocus: boolean;
  isDirty: boolean;
  canSubmit: boolean;
  onReload: () => Promise<void>;
  onChange: (
    field: "schoolName" | "gender" | "grade",
    value: string
  ) => void;
  onSelectSchool: (school: SchoolOption) => void;
  onSetSchoolDropdownOpen: (open: boolean) => void;
  onSetIgnoreNextSchoolFocus: (ignore: boolean) => void;
  onSubmit: () => Promise<void>;
  onReset: () => void;
};

export function MyPageForm({
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
  onReload,
  onChange,
  onSelectSchool,
  onSetSchoolDropdownOpen,
  onSetIgnoreNextSchoolFocus,
  onSubmit,
  onReset,
}: MyPageFormProps) {
  const displayName = values.username?.trim() || "회원";

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">
          {displayName}님 안녕하세요
        </h2>
        <p className="text-sm text-slate-500">
          아래에서 학교, 성별, 학년을 수정할 수 있습니다.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">회원 정보</h3>
            <p className="mt-1 text-sm text-slate-500">
              이메일은 확인만 가능하며, 학교 · 성별 · 학년만 수정할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void onReload()}
            disabled={isLoading || isSaving}
            className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "불러오는 중..." : "다시 불러오기"}
          </button>
        </div>

        {loadMessage ? (
          <p
            className={`mt-3 text-sm ${
              loadSuccess ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {loadMessage}
          </p>
        ) : null}

        {isPreviewMode ? (
          <p className="mt-2 text-xs text-amber-600">
            현재는 백엔드 미연결 상태를 고려한 미리보기 모드도 함께 지원합니다.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        <TextField
          id="mypage-email"
          type="email"
          label="이메일"
          value={values.email}
          disabled
          readOnly
          className="cursor-not-allowed bg-slate-100 text-slate-500"
          hint="이메일은 현재 확인만 가능하며 수정할 수 없습니다."
        />

        <div className="relative">
          <TextField
            id="mypage-school"
            label="학교"
            placeholder="학교명을 검색해주세요"
            value={schoolKeyword}
            error={errors.schoolName}
            disabled={!isLoaded || isSaving}
            onFocus={() => {
              if (ignoreNextSchoolFocus) {
                onSetIgnoreNextSchoolFocus(false);
                return;
              }

              if (!hasSelectedSchool && schoolResults.length > 0) {
                onSetSchoolDropdownOpen(true);
              }
            }}
            onChange={(event) => onChange("schoolName", event.target.value)}
            hint="회원가입에서 사용한 학교 검색과 동일한 방식입니다."
          />

          {isSchoolDropdownOpen ? (
            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {isSchoolSearching ? (
                <div className="px-4 py-3 text-sm text-slate-500">검색 중...</div>
              ) : schoolResults.length > 0 ? (
                schoolResults.map((school) => (
                  <button
                    key={`${school.schoolCode}-${school.officeCode}`}
                    type="button"
                    onClick={() => onSelectSchool(school)}
                    className="flex w-full flex-col items-start gap-1 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                  >
                    <span className="text-sm font-semibold text-slate-800">
                      {school.schoolName}
                    </span>
                    {school.address ? (
                      <span className="text-xs text-slate-500">{school.address}</span>
                    ) : null}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-500">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <SelectField
          id="mypage-gender"
          label="성별"
          value={values.gender}
          options={GENDER_OPTIONS}
          error={errors.gender}
          disabled={!isLoaded || isSaving}
          onChange={(event) => onChange("gender", event.target.value)}
        />

        <SelectField
          id="mypage-grade"
          label="학년"
          value={values.grade}
          options={GRADE_OPTIONS}
          error={errors.grade}
          disabled={!isLoaded || isSaving}
          onChange={(event) => onChange("grade", event.target.value)}
        />
      </div>

      {saveMessage ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            saveSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {saveMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onReset}
          disabled={!isDirty || isSaving}
          className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          변경 취소
        </button>

        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={!canSubmit}
          className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? "저장 중..." : "변경사항 저장"}
        </button>
      </div>
    </div>
  );
}
