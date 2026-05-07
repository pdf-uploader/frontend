"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signOut } from "@/lib/api";
import { hasAuthSession } from "@/lib/auth-session";
import { isAdminUser } from "@/lib/auth-user";
import { useAuth } from "@/lib/hooks/use-auth";

const fontSerif = "'Playfair Display', Georgia, serif";
const fontBody  = "'Source Serif 4', 'Georgia', serif";

const C = {
  navy:   "#1a2744",
  gold:   "#c97c2a",
  paper:  "#faf8f3",
  border: "#d0c4aa",
  muted:  "#a07848",
};

export function Navbar() {
  const router          = useRouter();
  const auth            = useAuth();
  const { user }        = auth;
  const canManageUsers  = isAdminUser(user);
  const username        =
    user?.username?.trim() ||
    user?.email?.split("@")[0]?.trim() ||
    "User";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSettled: () => router.replace("/"),
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!hasAuthSession(auth)) return null;

  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 40,
        width: "100%", height: 64,
        background: C.paper,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 1280,
          margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        {/* ── Left: IMME wordmark ── */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{
              fontFamily: fontSerif, fontSize: 18, fontWeight: 700,
              color: C.navy, lineHeight: 1.1, letterSpacing: "-0.01em",
            }}>
              IMME
            </span>
            <span style={{
              fontFamily: fontBody, fontSize: 10,
              color: C.muted, letterSpacing: "0.09em", lineHeight: 1,
            }}>
              Uganda Expressways
            </span>
          </div>
        </Link>

        {/* ── Right: search icon + avatar pill + logout ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          {/* Search focus shortcut */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("globalSearch");
              if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
            }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 8px", color: C.navy, opacity: 0.65,
              display: "flex", alignItems: "center",
              borderRadius: 4, transition: "opacity 150ms",
            }}
            aria-label="Focus search bar"
            title="Search"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.65"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          {/* Avatar pill with dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setDropdownOpen(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "white", border: `1px solid ${C.border}`,
                borderRadius: 999, padding: "5px 12px 5px 7px",
                cursor: "pointer", fontFamily: fontBody,
                fontSize: 13, color: C.navy, fontWeight: 500,
                transition: "border-color 150ms",
              }}
              aria-label="User menu"
              aria-expanded={dropdownOpen}
            >
              {/* Avatar circle */}
              <span style={{
                width: 24, height: 24, borderRadius: "50%",
                background: C.navy, color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, fontFamily: fontSerif,
                flexShrink: 0,
              }}>
                {username.charAt(0).toUpperCase()}
              </span>
              {username}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: C.paper, border: `1px solid ${C.border}`,
                borderRadius: 6, minWidth: 192,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                zIndex: 100, overflow: "hidden",
              }}>
                {/* User info header */}
                <div style={{
                  padding: "10px 14px 8px",
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <p style={{
                    fontFamily: fontBody, fontSize: 10, color: C.muted,
                    letterSpacing: "0.07em", textTransform: "uppercase",
                    marginBottom: 3,
                  }}>
                    {canManageUsers ? "Administrator" : "Member"}
                  </p>
                  <p style={{
                    fontFamily: fontBody, fontSize: 12, color: C.navy,
                    wordBreak: "break-all",
                  }}>
                    {user?.email}
                  </p>
                </div>

                {/* Admin: Manage Users */}
                {canManageUsers && (
                  <DropdownLink href="/users" onClick={() => setDropdownOpen(false)}>
                    Manage Users
                  </DropdownLink>
                )}

                {/* Logout inside dropdown (duplicates button for discoverability) */}
                <button
                  type="button"
                  onClick={() => { setDropdownOpen(false); logoutMutation.mutate(); }}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "10px 14px", fontFamily: fontBody, fontSize: 13,
                    color: "#c0392b", background: "none", border: "none",
                    cursor: "pointer", transition: "background 150ms",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fdf0ef"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Logout button */}
          <LogoutButton
            pending={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          />
        </div>
      </div>
    </header>
  );
}

/* ── Small helpers ── */

function DropdownLink({
  href, onClick, children,
}: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "block", padding: "10px 14px",
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: 13, color: "#1a2744",
        textDecoration: "none",
        borderBottom: "1px solid #d0c4aa",
        transition: "background 150ms",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#f0ebe0"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
    >
      {children}
    </Link>
  );
}

function LogoutButton({ pending, onClick }: { pending: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontSize: 13, letterSpacing: "0.02em",
        color:       hovered ? "white" : "#1a2744",
        background:  hovered ? "#c97c2a" : "transparent",
        border: `1px solid ${hovered ? "#c97c2a" : "#1a2744"}`,
        borderRadius: 4, padding: "6px 14px",
        cursor: "pointer", transition: "all 200ms",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? "Logging out…" : "Logout"}
    </button>
  );
}
