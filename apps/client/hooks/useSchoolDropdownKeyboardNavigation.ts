"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

type Options = {
  isOpen: boolean;
  isSearching: boolean;
  /** 검색어·결과가 바뀔 때 하이라이트 초기화용 */
  schoolKeyword: string;
  itemCount: number;
  onSelectIndex: (index: number) => void;
  onClose: () => void;
};

export function useSchoolDropdownKeyboardNavigation({
  isOpen,
  isSearching,
  schoolKeyword,
  itemCount,
  onSelectIndex,
  onClose,
}: Options) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const highlightedIndexRef = useRef(-1);
  highlightedIndexRef.current = highlightedIndex;

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [schoolKeyword, itemCount, isSearching, isOpen]);

  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    listRef.current
      .querySelector(`[data-school-option-index="${highlightedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const onSchoolInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        onClose();
        return;
      }

      const navigable = isOpen && !isSearching && itemCount > 0;
      if (!navigable) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const next =
              prev < 0 ? 0 : Math.min(itemCount - 1, prev + 1);
            highlightedIndexRef.current = next;
            return next;
          });
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev <= 0 ? -1 : prev - 1;
            highlightedIndexRef.current = next;
            return next;
          });
          break;
        case "Enter": {
          const idx = highlightedIndexRef.current;
          if (idx >= 0 && idx < itemCount) {
            event.preventDefault();
            onSelectIndex(idx);
          }
          break;
        }
        default:
          break;
      }
    },
    [isOpen, isSearching, itemCount, onClose, onSelectIndex],
  );

  return {
    highlightedIndex,
    listRef,
    onSchoolInputKeyDown,
  };
}
