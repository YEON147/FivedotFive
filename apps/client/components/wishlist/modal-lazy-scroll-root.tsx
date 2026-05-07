"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type ModalLazyScrollRegister = (
  element: Element,
  onIntersect: () => void,
) => () => void;

const ModalLazyScrollContext = createContext<ModalLazyScrollRegister | null>(
  null,
);

export function useModalLazyScrollRegister(): ModalLazyScrollRegister | null {
  return useContext(ModalLazyScrollContext);
}

/**
 * 모달 내부 세로 스크롤 영역 한 개당 IntersectionObserver **1개**만 생성.
 * 자식은 `register(target, onVisible)`으로 등록 — 셀마다 Observer를 만들지 않음.
 */
export function ModalLazyScrollRoot({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const handlersRef = useRef(new Map<Element, () => void>());
  const pendingRef = useRef<{ element: Element; onIntersect: () => void }[]>(
    [],
  );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const fn = handlersRef.current.get(entry.target);
          if (fn) {
            fn();
            handlersRef.current.delete(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      {
        root,
        rootMargin: "180px 0px",
        threshold: 0,
      },
    );
    ioRef.current = io;

    for (const { element, onIntersect } of pendingRef.current) {
      handlersRef.current.set(element, onIntersect);
      io.observe(element);
    }
    pendingRef.current = [];

    return () => {
      io.disconnect();
      ioRef.current = null;
      handlersRef.current.clear();
      pendingRef.current = [];
    };
  }, []);

  const register = useCallback<ModalLazyScrollRegister>(
    (element, onIntersect) => {
      const io = ioRef.current;
      if (io) {
        handlersRef.current.set(element, onIntersect);
        io.observe(element);
      } else {
        pendingRef.current.push({ element, onIntersect });
      }
      return () => {
        pendingRef.current = pendingRef.current.filter(
          (p) => p.element !== element,
        );
        handlersRef.current.delete(element);
        io?.unobserve(element);
      };
    },
    [],
  );

  const value = useMemo(() => register, [register]);

  return (
    <ModalLazyScrollContext.Provider value={value}>
      <div ref={rootRef} className={className}>
        {children}
      </div>
    </ModalLazyScrollContext.Provider>
  );
}
