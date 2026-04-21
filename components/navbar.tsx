"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signOut } from "@/lib/api";
import { isAdminUser } from "@/lib/auth-user";
import { useAuth } from "@/lib/hooks/use-auth";

export function Navbar() {
  const router = useRouter();
  const { user, token } = useAuth();

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
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            PDF Manager
          </Link>
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
            <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900">
              Library
            </Link>
            {isAdminUser(user) && (
              <Link href="/users" className="rounded-full px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900">
                Users
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
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
