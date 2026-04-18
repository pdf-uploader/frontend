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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/" className="text-sm font-semibold text-blue-600">
            PDF Manager
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">
              Library
            </Link>
            {isAdminUser(user) && (
              <Link href="/users" className="font-medium text-blue-700 hover:text-blue-900">
                Users
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-slate-500 sm:block">{user?.email}</p>
          <button
            onClick={() => logoutMutation.mutate()}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
