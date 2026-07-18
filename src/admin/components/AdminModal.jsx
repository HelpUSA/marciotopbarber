import React, {
  useEffect,
} from "react";

import {
  X,
} from "lucide-react";

export default function AdminModal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  wide = false,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    open,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className={[
          "flex max-h-[92vh] w-full flex-col",
          "overflow-hidden rounded-3xl",
          "border border-white/10",
          "bg-neutral-900 shadow-2xl",
          wide ? "max-w-4xl" : "max-w-2xl",
        ].join(" ")}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7">
          <div>
            <h2
              id="admin-modal-title"
              className="text-xl font-bold text-white"
            >
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm text-neutral-400">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="Fechar janela"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-neutral-400 transition hover:bg-white/5 hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {children}
        </div>

        {footer && (
          <footer className="border-t border-white/10 px-5 py-4 sm:px-7">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}
