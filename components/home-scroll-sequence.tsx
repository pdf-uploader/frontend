"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const PART_COUNTS = [
  { folder: "part1", count: 236 },
  { folder: "part2", count: 300 },
  { folder: "part3", count: 70 },
  { folder: "part4", count: 240 },
] as const;
const LOOP_FPS = 48;

function buildFrameSources(): string[] {
  const frames: string[] = [];

  PART_COUNTS.forEach(({ folder, count }) => {
    for (let index = 1; index <= count; index += 1) {
      frames.push(`/${folder}/ezgif-frame-${String(index).padStart(3, "0")}.jpg`);
    }
  });

  return frames;
}

export function HomeScrollSequence({ loginHref }: { loginHref?: string }) {
  const [activeFrame, setActiveFrame] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameSources = useMemo(() => buildFrameSources(), []);

  useEffect(() => {
    let cancelled = false;
    let batchTimer: ReturnType<typeof setTimeout> | null = null;
    const preloaded: HTMLImageElement[] = [];

    // Preload in small batches to keep scrolling responsive while frames warm up.
    const preloadBatch = (startIndex: number) => {
      if (cancelled || startIndex >= frameSources.length) {
        return;
      }

      const endIndex = Math.min(startIndex + 30, frameSources.length);
      for (let index = startIndex; index < endIndex; index += 1) {
        const image = new window.Image();
        image.decoding = "async";
        image.src = frameSources[index];
        preloaded.push(image);
      }

      batchTimer = setTimeout(() => preloadBatch(endIndex), 18);
    };

    preloadBatch(0);

    return () => {
      cancelled = true;
      if (batchTimer) {
        clearTimeout(batchTimer);
      }
    };
  }, [frameSources]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("hide-browser-scrollbar");
    body.classList.add("hide-browser-scrollbar");

    return () => {
      html.classList.remove("hide-browser-scrollbar");
      body.classList.remove("hide-browser-scrollbar");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [frameSources]);

  useEffect(() => {
    if (!frameSources.length) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setActiveFrame((previous) => {
        const next = previous + 1;
        return next >= frameSources.length ? 0 : next;
      });
    }, Math.max(16, Math.round(1000 / LOOP_FPS)));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [frameSources]);

  return (
    <section className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <div className="h-full w-full overflow-hidden bg-slate-950">
        <img
          src={frameSources[activeFrame]}
          alt="Uganda and partner project visual sequence"
          className="h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/10 to-slate-950/80" />

        <div className="absolute inset-x-0 top-0 z-20 mx-auto w-full max-w-7xl p-5 sm:p-8">
          {loginHref && (
            <div className="flex justify-end">
              <Link
                href={loginHref}
                className="rounded-full border border-white/50 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
              >
                Login
              </Link>
            </div>
          )}
          <div className="inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium tracking-wide text-white backdrop-blur">
            Background Loop Experience
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
            Uganda x Global Partners Document Intelligence Platform
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-100 sm:text-base">
            Frames now loop continuously in the background from part1 to part4. Sign in to access the full PDF
            workspace.
          </p>
        </div>
      </div>
    </section>
  );
}
