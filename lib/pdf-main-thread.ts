/**
 * PDF.js normally spawns a dedicated `Worker` from `GlobalWorkerOptions.workerSrc`.
 * Preloading the worker bundle on the main thread and exposing `WorkerMessageHandler` on `globalThis`
 * makes PDF.js use the "fake worker" path (LoopbackPort) so no worker thread is created.
 */
let primePromise: Promise<void> | null = null;

export function primePdfJsMainThreadOnly(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const g = globalThis as typeof globalThis & {
    pdfjsWorker?: { WorkerMessageHandler?: unknown };
  };

  if (g.pdfjsWorker?.WorkerMessageHandler) {
    return Promise.resolve();
  }

  primePromise ??= import("pdfjs-dist/build/pdf.worker.mjs").then((mod) => {
    g.pdfjsWorker = mod as typeof g.pdfjsWorker;
  });

  return primePromise;
}
