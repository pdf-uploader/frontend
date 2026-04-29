"use client";

import { useEffect } from "react";

interface DeleteUserConfirmDialogProps {
  open: boolean;
  /** Shown in the message body (email, @username, or id) */
  displayLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}

export function DeleteUserConfirmDialog({
  open,
  displayLabel,
  onCancel,
  onConfirm,
  pending,
}: DeleteUserConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        aria-label="Dismiss"
        disabled={pending}
        onClick={() => {
          if (!pending) {
            onCancel();
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-confirm-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/95 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.15)]"
      >
        <h2 id="delete-user-confirm-title" className="text-lg font-semibold tracking-tight text-slate-900">
          Delete this user?
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
          This will permanently remove{" "}
          <span className="font-medium text-slate-900">{displayLabel || "this account"}</span>. This cannot be undone.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Delete user"}
          </button>
        </div>
      </div>
    </div>
  );
}
