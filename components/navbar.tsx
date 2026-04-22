"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signOut } from "@/lib/api";
import { isAdminUser } from "@/lib/auth-user";
import { useAuth } from "@/lib/hooks/use-auth";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token } = useAuth();
  const isUsersActive = pathname.startsWith("/users");
  const roleLabel = isAdminUser(user) ? "ADMIN" : "USER";

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSettled: () => {
      router.replace("/");
    },
  });

  if (!token) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-bold text-slate-900 sm:text-2xl">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-8 w-8 text-sky-400 sm:h-9 sm:w-9"
              fill="currentColor"
            >
              <path d="M2.25 7.5A2.25 2.25 0 0 1 4.5 5.25h4.74a2.25 2.25 0 0 1 1.59.66l1.5 1.5a2.25 2.25 0 0 0 1.59.66h5.58a2.25 2.25 0 0 1 2.25 2.25v6.18a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V7.5Z" />
            </svg>
            File Management
          </Link>
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
            {isAdminUser(user) && (
              <Link
                href="/users"
                className={[
                  "rounded-full px-3 py-1.5 font-medium transition",
                  isUsersActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 hover:text-slate-600",
                ].join(" ")}
              >
                Manage Users
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <p className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-800">
            {roleLabel}
          </p>
          <p className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500 sm:block">{user?.email}</p>
          <button
            onClick={() => logoutMutation.mutate()}
            className="ui-btn-primary text-xs"
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
