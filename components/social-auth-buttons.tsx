"use client";

import { getGoogleAuthUrl, getWhatsAppAuthUrl } from "@/lib/social-auth-urls";

type Mode = "signin" | "signup";

interface SocialAuthButtonsProps {
  mode: Mode;
  /** Dark pills over map / charcoal (OpenAI-like). Default matches marketing cards. */
  variant?: "light" | "dark";
}

/** Google-mark–style glyph (compact; not an official reproduction). */
function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

export function SocialAuthButtons({ mode, variant = "light" }: SocialAuthButtonsProps) {
  const googleHref = getGoogleAuthUrl();
  const whatsappHref = getWhatsAppAuthUrl();

  const googleLabel =
    mode === "signin"
      ? "Continue with Google"
      : "Sign up with Google";
  const whatsappLabel =
    mode === "signin"
      ? "Continue with WhatsApp"
      : "Sign up with WhatsApp";

  const googleBtn =
    variant === "dark"
      ? "flex min-h-[3rem] w-full items-center justify-center gap-3 rounded-full border border-white/18 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white shadow-none transition hover:border-white/28 hover:bg-white/[0.07]"
      : "flex min-h-[3rem] w-full items-center justify-center gap-3 rounded-full border border-slate-300/95 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:border-slate-400 hover:bg-slate-50/90";

  const waBtn =
    variant === "dark"
      ? "flex min-h-[3rem] w-full items-center justify-center gap-3 rounded-full border border-emerald-400/25 bg-emerald-500/[0.07] px-4 py-2.5 text-sm font-medium text-emerald-50/95 transition hover:border-emerald-400/40 hover:bg-emerald-500/[0.11]"
      : "flex min-h-[3rem] w-full items-center justify-center gap-3 rounded-full border border-emerald-700/25 bg-white px-4 py-2.5 text-sm font-medium text-emerald-950 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition hover:border-emerald-700/40 hover:bg-emerald-50/50";

  const waDisabledBtn =
    variant === "dark"
      ? "flex min-h-[3rem] w-full cursor-not-allowed items-center gap-3 rounded-full border border-dashed border-white/16 bg-white/[0.03] px-4 py-2.5 text-left text-sm opacity-90"
      : "flex min-h-[3rem] w-full cursor-not-allowed items-center gap-3 rounded-full border border-dashed border-slate-300/90 bg-slate-50/90 px-4 py-2.5 text-left text-sm opacity-95";

  const waGlyphClass =
    variant === "dark" ? "h-[22px] w-[22px] shrink-0 text-emerald-300/90" : "h-[22px] w-[22px] shrink-0 text-emerald-600";

  return (
    <div className="flex flex-col gap-3">
      <a href={googleHref} className={googleBtn} aria-label={googleLabel}>
        <GoogleGlyph className="h-5 w-5 shrink-0" />
        <span>{googleLabel}</span>
      </a>

      {whatsappHref ? (
        <a href={whatsappHref} className={waBtn} aria-label={whatsappLabel}>
          <WhatsAppGlyph className={waGlyphClass} />
          <span>{whatsappLabel}</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          className={waDisabledBtn}
          title="Set NEXT_PUBLIC_AUTH_WHATSAPP_URL or NEXT_PUBLIC_WHATSAPP_INVITE_URL in env to enable this."
          aria-label="WhatsApp sign-in requires configuration"
        >
          <span
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              variant === "dark" ? "bg-white/10 text-emerald-200/90" : "bg-slate-200/80 text-emerald-800",
            ].join(" ")}
          >
            <WhatsAppGlyph className="h-[22px] w-[22px]" />
          </span>
          <span className="flex flex-col items-start gap-0.5">
            <span className={variant === "dark" ? "font-medium text-white/85" : "font-medium text-slate-700"}>
              Continue with WhatsApp
            </span>
            <span
              className={variant === "dark" ? "text-[10px] font-normal leading-tight text-white/45" : "text-[10px] font-normal leading-tight text-slate-500"}
            >
              Not configured for this deployment
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

export function AuthProviderDivider({
  label,
  variant = "light",
}: {
  label: string;
  variant?: "light" | "dark";
}) {
  const lineClass = variant === "dark" ? "auth-divider-line" : "auth-divider-line-muted";
  const labelClass =
    variant === "dark" ? "text-[13px] text-white/45" : "text-[13px] text-slate-500";

  return (
    <div className="relative my-6 flex items-center gap-3 first:mt-0">
      <span className={lineClass} aria-hidden />
      <span className={["shrink-0 px-1 text-center", labelClass].join(" ")}>{label}</span>
      <span className={lineClass} aria-hidden />
    </div>
  );
}
