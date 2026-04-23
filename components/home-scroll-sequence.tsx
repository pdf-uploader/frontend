"use client";

import Image from "next/image";
import Link from "next/link";

export function HomeScrollSequence({ loginHref }: { loginHref?: string }) {
  return (
    <section className="relative min-h-screen w-full bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-3 sm:px-6 sm:pt-4 lg:px-10">
        <div className="flex items-start justify-between gap-4">
          <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white py-5">
            <div className="logo-slider-track flex w-max items-center gap-8 sm:gap-12">
              <div className="relative h-20 w-56 shrink-0 sm:h-24 sm:w-72">
                <Image src="/logo/KOICA.png" alt="KOICA" fill className="object-contain" priority />
              </div>
              <div className="relative h-20 w-52 shrink-0 sm:h-24 sm:w-64">
                <Image src="/logo/MOWT.png" alt="MOWT" fill className="object-contain" priority />
              </div>
              <div className="relative h-16 w-[340px] shrink-0 sm:h-20 sm:w-[460px]">
                <Image
                  src="/logo/consultant-companies.png"
                  alt="Consultant partner companies"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 340px, 460px"
                  priority
                />
              </div>
              <div className="relative h-20 w-56 shrink-0 sm:h-24 sm:w-72">
                <Image src="/logo/KOICA.png" alt="KOICA duplicate" fill className="object-contain" />
              </div>
              <div className="relative h-20 w-52 shrink-0 sm:h-24 sm:w-64">
                <Image src="/logo/MOWT.png" alt="MOWT duplicate" fill className="object-contain" />
              </div>
              <div className="relative h-16 w-[340px] shrink-0 sm:h-20 sm:w-[460px]">
                <Image
                  src="/logo/consultant-companies.png"
                  alt="Consultant partner companies duplicate"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 340px, 460px"
                />
              </div>
            </div>
          </div>
          {loginHref && (
            <Link
              href={loginHref}
              className="inline-flex shrink-0 items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <h1 className="blink-text px-4 text-center text-5xl font-black uppercase tracking-[0.08em] text-slate-700 sm:text-7xl lg:text-8xl">
          Design In Progress
        </h1>
      </div>
      <style jsx>{`
        .logo-slider-track {
          animation: logo-slide 18s linear infinite;
        }

        .blink-text {
          animation: blur-pulse 2.2s ease-in-out infinite;
        }

        @keyframes logo-slide {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @keyframes blur-pulse {
          0%,
          100% {
            filter: blur(0px);
            opacity: 1;
          }
          50% {
            filter: blur(6px);
            opacity: 0.7;
          }
        }
      `}</style>
    </section>
  );
}
