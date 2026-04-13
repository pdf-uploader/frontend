"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FileDetails } from "@/lib/types";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const PDFViewer = dynamic(() => import("@/components/pdf-viewer").then((mod) => mod.PDFViewer), {
  ssr: false,
  loading: () => <p className="text-sm text-slate-600">Loading PDF viewer...</p>,
});

export default function FileViewerPage() {
  const params = useParams<{ fileId: string }>();
  const searchParams = useSearchParams();
  const fileId = params.fileId;
  const keyword = searchParams.get("keyword") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const initialPage = Number.isFinite(page) && page > 0 ? page : 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const fileQuery = useQuery({
    queryKey: ["file", fileId],
    queryFn: async () => (await api.get<FileDetails>(`/files/${fileId}`)).data,
    enabled: Boolean(fileId),
  });

  const pdfBlobQuery = useQuery({
    queryKey: ["file-pdf", fileId],
    queryFn: async () => (await api.get<Blob>(`/files/pdf/${fileId}`, { responseType: "blob" })).data,
    enabled: Boolean(fileId),
  });

  useEffect(() => {
    if (!pdfBlobQuery.data) {
      setBlobUrl(null);
      return;
    }

    const url = URL.createObjectURL(pdfBlobQuery.data);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdfBlobQuery.data]);

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  const displayFilename = useMemo(
    () => fileQuery.data?.filename || `file-${fileId}.pdf`,
    [fileQuery.data?.filename, fileId]
  );

  if (fileQuery.isLoading || pdfBlobQuery.isLoading) {
    return <p className="text-sm text-slate-600">Loading file...</p>;
  }

  if (fileQuery.error || pdfBlobQuery.error || !fileQuery.data || !pdfBlobQuery.data) {
    return <p className="text-sm text-red-600">Unable to load file details.</p>;
  }

  const onDownload = () => {
    const downloadUrl = URL.createObjectURL(pdfBlobQuery.data);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = displayFilename.endsWith(".pdf") ? displayFilename : `${displayFilename}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="min-h-[70vh] rounded-xl border border-slate-200 bg-slate-100 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <Link href="/" className="inline-flex text-xs font-medium text-blue-700 hover:underline">
              ← Back to library
            </Link>
            <h1 className="text-lg font-semibold">{displayFilename}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
            >
              Download PDF
            </button>
          </div>
        </div>
        {blobUrl && (
          <PDFViewer
            fileUrl={blobUrl}
            initialPage={initialPage}
            keyword={keyword}
            onCurrentPageChange={setCurrentPage}
          />
        )}
      </div>
      <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Search Context</h2>
        <p className="text-sm text-slate-600">
          Jumped to page <span className="font-medium">{initialPage}</span>
        </p>
        <p className="text-sm text-slate-600">
          Current page <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-700">{currentPage}</span>
        </p>
        {keyword && (
          <p className="rounded bg-yellow-50 px-2 py-1 text-xs text-slate-700">
            Highlight keyword: <span className="font-semibold">{keyword}</span>
          </p>
        )}
      </aside>
    </section>
  );
}
