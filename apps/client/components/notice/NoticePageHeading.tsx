"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  /** 예: 관리자용 「작성」 링크 */
  action?: ReactNode;
};

export function NoticePageHeading({ title, description, action }: Props) {
  return (
    <div className="mb-5 flex min-h-[2.25rem] items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-h2 text-[var(--color-text-primary)]">{title}</h1>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
      </div>
      {action != null ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
