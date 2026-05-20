"use client";

import { Children, useEffect, useState, type ReactNode } from "react";

const SUBMENU_BASE_CLASS =
  "absolute bottom-full right-0 mb-3 flex flex-col-reverse items-end gap-3";

const ITEM_IN_MS = 220;
const ITEM_OUT_MS = 150;
const STAGGER_MS = 58;

type Phase = "in" | "out";

type BoardFabSpeedDialSubmenuProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
};

function exitDurationMs(itemCount: number): number {
  if (itemCount <= 0) return ITEM_OUT_MS;
  return ITEM_OUT_MS + (itemCount - 1) * STAGGER_MS;
}

/** FAB ＋ 위 보조 버튼 — 아래에서 위로 하나씩 자라남 */
export function BoardFabSpeedDialSubmenu({
  open,
  children,
  className = "",
}: BoardFabSpeedDialSubmenuProps) {
  const [mounted, setMounted] = useState(open);
  const [phase, setPhase] = useState<Phase>(open ? "in" : "out");

  const items = Children.toArray(children).filter(Boolean);
  const trimmedClass = className.trim();
  const exitMs = exitDurationMs(items.length);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setPhase("in");
      return;
    }

    setPhase("out");
    const timer = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [open, exitMs]);

  if (!mounted) return null;

  const isIn = phase === "in";

  return (
    <div
      className={[SUBMENU_BASE_CLASS, trimmedClass, isIn ? "" : "pointer-events-none"]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!isIn}
    >
      {items.map((child, index) => {
        const delayMs = isIn
          ? index * STAGGER_MS
          : (items.length - 1 - index) * STAGGER_MS;

        return (
          <div
            key={index}
            className={`fab-speed-dial-item ${isIn ? "fab-speed-dial-item--in" : "fab-speed-dial-item--out"}`}
            style={{ animationDelay: `${delayMs}ms` }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
