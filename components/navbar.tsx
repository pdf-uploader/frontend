"use client";

import Image from "next/image";
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
  const isUsersRoute = pathname.startsWith("/users");
  const canManageUsers = isAdminUser(user);
  const roleLabel = canManageUsers ? "ADMIN" : "USER";

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex min-h-16 w-full items-center justify-between gap-2 py-2 pl-0 pr-0 sm:min-h-20 sm:gap-2.5 sm:py-2.5 sm:pl-1 sm:pr-1">
        <div className="relative h-[5.25rem] w-[min(16.5rem,46vw)] min-w-0 shrink-0 pl-1 min-[400px]:pl-1.5 sm:h-24 sm:w-[min(19.5rem,50vw)] sm:pl-2">
          <Image
            src="/logo/MOWT.png"
            alt="Ministry of Works and Transport"
            fill
            className="object-contain object-left"
            priority
            sizes="(max-width: 640px) 200px, (max-width: 1024px) 300px, 320px"
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2.5">
          <p className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-emerald-800 sm:px-3 sm:text-xs">
            {roleLabel}
          </p>
          {canManageUsers && (
            <Link
              href="/users"
              className={[
                "shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-medium transition sm:px-3 sm:text-xs",
                isUsersRoute ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800",
              ].join(" ")}
            >
              Manage Users
            </Link>
          )}
          <p className="hidden max-w-[9rem] shrink truncate rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500 min-[480px]:block sm:max-w-[10rem] md:max-w-none">
            {user?.email}
          </p>
          <button
            onClick={() => logoutMutation.mutate()}
            className="ui-btn-primary shrink-0 text-xs"
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </button>
          <div className="relative h-10 w-20 shrink-0 self-center pr-0 min-[400px]:pr-0.5 sm:h-12 sm:w-28 sm:pr-1 md:h-14 md:w-32">
            <Image
              src="/logo/KOICA.png"
              alt="KOICA"
              fill
              className="object-contain object-right"
              priority
              sizes="(max-width: 640px) 80px, 128px"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
