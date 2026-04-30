"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signOut } from "@/lib/api";
import { hasAuthSession } from "@/lib/auth-session";
import { isAdminUser } from "@/lib/auth-user";
import { useAuth } from "@/lib/hooks/use-auth";
import { BrandedSystemNavbarTitle } from "@/components/branded-logos-shell";
import { KOICA_WEBSITE_URL, MOWT_WEBSITE_URL } from "@/lib/branding-links";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const { user, token } = auth;
  const isUsersRoute = pathname.startsWith("/users");
  const canManageUsers = isAdminUser(user);
  const roleLabel = canManageUsers ? "ADMIN" : "USER";
  const homeScreenUserBadge =
    canManageUsers ? roleLabel : (user?.username?.trim() || user?.email?.split("@")[0]?.trim() || "User");

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSettled: () => {
      router.replace("/");
    },
  });

  if (!hasAuthSession(auth)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex min-h-16 w-full items-center gap-1.5 py-2 pl-0 pr-0 sm:min-h-20 sm:gap-2 sm:py-2.5 sm:pl-1 sm:pr-1 min-[900px]:gap-3">
        <a
          href={MOWT_WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block h-[5.25rem] w-[min(16.5rem,46vw)] min-w-0 shrink-0 pl-1 min-[400px]:pl-1.5 sm:h-24 sm:w-[min(19.5rem,50vw)] sm:pl-2 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2"
          aria-label="Ministry of Works and Transport — visit works.go.ug"
        >
          <Image
            src="/logo/MOWT.png"
            alt=""
            fill
            className="object-contain object-left"
            priority
            sizes="(max-width: 640px) 200px, (max-width: 1024px) 300px, 320px"
          />
        </a>
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center px-0.5 sm:px-2">
          <BrandedSystemNavbarTitle />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2.5">
          {canManageUsers ? (
            <Link
              href="/"
              className={[
                "shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] transition sm:px-3 sm:text-xs",
                isUsersRoute
                  ? "font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
                  : "border border-emerald-200 bg-emerald-50 font-semibold tracking-wide text-emerald-800",
              ].join(" ")}
            >
              {roleLabel}
            </Link>
          ) : (
            <p className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-emerald-800 sm:px-3 sm:text-xs">
              {homeScreenUserBadge}
            </p>
          )}
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
          <a
            href={KOICA_WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block h-10 w-20 shrink-0 self-center pr-0 min-[400px]:pr-0.5 sm:h-12 sm:w-28 sm:pr-1 md:h-14 md:w-32 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2"
            aria-label="KOICA — visit koica.go.kr"
          >
          </a>
        </div>
      </div>
    </header>
  );
}
