"use client";

import { formatBytes } from "@/lib/format-bytes";

type DownloadProgress = { loaded: number; total: number | null };

export function PdfViewerPageLoading(props: {
  fileMetadataLoaded: boolean;
  pdfDownloading: boolean;
  filename?: string;
  progress: DownloadProgress;
}) {
  const { fileMetadataLoaded, pdfDownloading, filename, progress } = props;
  const hasSizeHint = pdfDownloading && progress.loaded > 0;
  const total = progress.total;
  const percent =
    total != null && total > 0 ? Math.min(100, Math.round((progress.loaded / total) * 100)) : null;
  const indeterminatePdf = pdfDownloading && total == null;

  const title = (() => {
    if (!fileMetadataLoaded && !hasSizeHint) {
      return "Opening document";
    }
    if (pdfDownloading) {
      return "Downloading PDF";
    }
    return "Loading";
  })();

  return (
    <section className="mx-auto w-full max-w-md px-3">
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white via-white to-slate-50/90 p-6 shadow-sm ring-1 ring-slate-900/5">
        <div className="mb-5 flex items-start gap-3">
          <div
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100"
            aria-hidden
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.106 18.742H21a3.042 3.042 0 0 0 3.046-3.046V10.125a48 48 0 0 0-3.93-21.066A48.036 48.036 0 0 0 12 7.086m0 17.734c-.882.087-1.77.086-2.67 0-.9-.086-1.79-.086-2.671 0M12 21.086c-.882-.087-1.77-.086-2.671 0M12 21.086"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-tight text-slate-900">{title}</p>
            {filename ? (
              <p className="mt-1 truncate text-xs text-slate-500" title={filename}>
                {filename}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">&nbsp;</p>
            )}
          </div>
        </div>

        <dl className="mb-4 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <dt className="font-medium text-slate-600">Details</dt>
            <dd className="flex items-center gap-1.5 text-slate-700">
              {fileMetadataLoaded ? (
                <>
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                    ✓
                  </span>
                  <span className="text-emerald-800">Ready</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
                  </span>
                  <span className="text-slate-600">Fetching…</span>
                </>
              )}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="font-medium text-slate-600">File data</dt>
            <dd className="text-right text-slate-700">
              {pdfDownloading ? (
                percent != null ? (
                  <span className="tabular-nums">{percent}%</span>
                ) : hasSizeHint ? (
                  <span className="tabular-nums text-slate-600">{formatBytes(progress.loaded)}</span>
                ) : (
                  <span className="text-slate-600">Starting…</span>
                )
              ) : (
                <span className="text-emerald-800">Ready</span>
              )}
            </dd>
          </div>
        </dl>

        <div
          className={[
            "relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90",
            indeterminatePdf ? "pdf-load-track-indeterminate" : "",
          ].join(" ")}
          role="progressbar"
          aria-valuenow={percent ?? undefined}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Download progress"
        >
          <div
            className={[
              "h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-blue-600 shadow-sm transition-[width] duration-200 ease-out",
              indeterminatePdf ? "pdf-load-bar-indeterminate w-[38%]" : "",
            ].join(" ")}
            style={
              indeterminatePdf
                ? undefined
                : {
                    width: `${percent != null ? percent : progress.loaded > 0 ? 6 : 2}%`,
                  }
            }
          />
        </div>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
          {pdfDownloading && total != null && total > 0 ? (
            <>
              <span className="tabular-nums">{formatBytes(progress.loaded)}</span>
              {" of "}
              <span className="tabular-nums">{formatBytes(total)}</span>
            </>
          ) : pdfDownloading && hasSizeHint ? (
            <>
              Received <span className="tabular-nums font-medium text-slate-600">{formatBytes(progress.loaded)}</span>
              {total == null ? " — total size unavailable, still receiving…" : ""}
            </>
          ) : pdfDownloading ? (
            "Receiving the document from the server…"
          ) : (
            "\u00a0"
          )}
        </p>

        <style jsx>{`
          @keyframes pdf-load-indeterminate-slide {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(350%);
            }
          }
          :global(.pdf-load-bar-indeterminate) {
            animation: pdf-load-indeterminate-slide 1.25s ease-in-out infinite;
          }
          :global(.pdf-load-track-indeterminate) {
            background: linear-gradient(90deg, rgb(226 232 240 / 0.95), rgb(241 245 249 / 0.95));
          }
        `}</style>
      </div>
    </section>
  );
}

/** Shown while react-pdf parses and lays out pages after the blob is ready. */
export function PdfDocumentRenderLoading() {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm ring-1 ring-slate-900/5">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
        <p className="text-xs font-semibold text-slate-800">Rendering PDF</p>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
        Parsing pages and preparing the viewer. Large files may take a moment.
      </p>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/90">
        <div className="pdf-render-shimmer h-full w-full rounded-full bg-gradient-to-r from-transparent via-blue-400/55 to-transparent" />
      </div>
      <style jsx>{`
        @keyframes pdf-render-shimmer-move {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        :global(.pdf-render-shimmer) {
          animation: pdf-render-shimmer-move 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
