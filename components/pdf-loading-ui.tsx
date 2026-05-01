"use client";

export function PdfViewerPageLoading(props: {
  fileMetadataLoaded: boolean;
  pdfBytesFetched: boolean;
  /** When known, drives the primary bar width and a numeric label (0–100). Null = indeterminate. */
  overallPercent: number | null;
  filename?: string;
}) {
  const { fileMetadataLoaded, pdfBytesFetched, overallPercent, filename } = props;

  const stillWorking = !fileMetadataLoaded || !pdfBytesFetched;
  const barIndeterminate = stillWorking && overallPercent === null;

  const detailLabel = !fileMetadataLoaded
    ? "Fetching file info…"
    : !pdfBytesFetched
      ? "Loading PDF through the app…"
      : " ";

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
            <p className="text-sm font-semibold tracking-tight text-slate-900">Opening document</p>
            {filename ? (
              <p className="mt-1 truncate text-xs text-slate-500" title={filename}>
                {filename}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">{detailLabel.trim() ? detailLabel : "\u00a0"}</p>
            )}
          </div>
        </div>

        <dl className="mb-4 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <dt className="font-medium text-slate-600">File details</dt>
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
            <dt className="font-medium text-slate-600">PDF stream</dt>
            <dd className="flex items-center gap-1.5 text-slate-700">
              {pdfBytesFetched ? (
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
        </dl>

        <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-slate-600">
          <span className="font-medium tabular-nums text-slate-700">
            {stillWorking ? (overallPercent !== null ? `${overallPercent}%` : "Loading…") : "100%"}
          </span>
        </div>
        <div
          className={["relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90", barIndeterminate ? "pdf-load-track-indeterminate" : ""].join(
            " ",
          )}
          role="progressbar"
          aria-busy={stillWorking}
          aria-label="Loading PDF viewer"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={
            overallPercent !== null ? overallPercent : stillWorking ? undefined : 100
          }
          aria-valuetext={
            overallPercent !== null ? `${overallPercent}%` : stillWorking ? "Loading progress unknown" : "100%"
          }
        >
          <div
            className={[
              "h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-blue-600 shadow-sm transition-[width] duration-150 ease-out",
              barIndeterminate ? "pdf-load-bar-indeterminate w-[38%]" : overallPercent !== null ? "" : stillWorking ? "w-0" : "w-full",
            ].filter(Boolean).join(" ")}
            style={overallPercent !== null && stillWorking ? { width: `${Math.min(100, Math.max(0, overallPercent))}%` } : undefined}
          />
        </div>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
          {stillWorking
            ? "The app loads storage on the server so the browser does not need direct access to S3."
            : "\u00a0"}
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

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) {
    return "0 B";
  }
  const u = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${u[i]}`;
}

/**
 * Single progress bar: network download (optional) then PDF.js parse, expressed as one 0–100 % when possible.
 */
export function PdfDocumentRenderLoading(props: {
  /** Bytes read from the HTTP response while building the Blob. */
  fetchLoaded?: number;
  fetchTotal?: number | null;
  /** PDF.js `onLoadProgress` while opening the document from the Blob. */
  parseLoaded?: number;
  parseTotal?: number;
  /** After `fetchTotal` is known, treat download as this share of 100% (rest reserved for parse). */
  fetchWeight?: number;
}) {
  const {
    fetchLoaded = 0,
    fetchTotal = null,
    parseLoaded = 0,
    parseTotal = 0,
    fetchWeight = 0.88,
  } = props;

  const w = Math.min(0.98, Math.max(0.5, fetchWeight));
  const parseWeight = 1 - w;

  const fetchHasTotal = typeof fetchTotal === "number" && fetchTotal > 0;
  const parseHasTotal = parseTotal > 0;

  let percent: number | null = null;
  let detail = "";

  if (fetchHasTotal) {
    const fetchPct = Math.min(1, fetchLoaded / fetchTotal) * w * 100;
    if (parseHasTotal) {
      percent = Math.min(100, Math.round(fetchPct + (parseLoaded / parseTotal) * parseWeight * 100));
      detail = "Downloading and opening the file…";
    } else {
      percent = Math.min(100, Math.round(fetchPct));
      detail = "Downloading…";
    }
  } else if (parseHasTotal) {
    percent = Math.min(100, Math.round((parseLoaded / parseTotal) * 100));
    detail = "Opening document…";
  } else if (fetchLoaded > 0) {
    detail = `Downloading… ${formatBytes(fetchLoaded)} (size unknown until complete)`;
  } else {
    detail = "Preparing…";
  }

  const barWidth = percent !== null ? Math.min(100, Math.max(0, percent)) : 8;

  return (
    <div className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm ring-1 ring-slate-900/5">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
        <p className="text-xs font-semibold text-slate-800">Loading PDF</p>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-slate-500">{detail}</p>
      <div className="mb-1.5 flex items-center justify-end text-[11px] font-medium tabular-nums text-slate-600">
        <span aria-live="polite">{percent !== null ? `${percent}%` : formatBytes(fetchLoaded)}</span>
      </div>
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/90"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
        aria-valuetext={percent !== null ? `${percent}%` : detail}
        aria-busy
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-blue-600 shadow-sm transition-[width] duration-150 ease-out"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
