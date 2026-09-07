"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function CharacterModal({
  children,
  titleId,
  onClose,
}: {
  children: ReactNode;
  titleId: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const node = ref.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="char-dialog"
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
    >
      {children}
    </dialog>
  );
}
