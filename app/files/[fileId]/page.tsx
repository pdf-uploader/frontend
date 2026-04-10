"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PDFViewer } from "@/components/pdf-viewer";
import { api } from "@/lib/api";
import { FileDetails } from "@/lib/types";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

export default function FileViewerPage() {
  const params = useParams<{ fileId: string }>();
  const searchParams = useSearchParams();
  const fileId = params.fileId;
  const keyword = searchParams.get("keyword") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const initialPage = Number.isFinite(page) && page > 0 ? page : 1;

  const fileQuery = useQuery({
    queryKey: ["file", fileId],
    queryFn: async () => (await api.get<FileDetails>(`/files/${fileId}`)).data,
    enabled: Boolean(fileId),
  });

  const safeUrl = useMemo(() => fileQuery.data?.fileUrl ?? "", [fileQuery.data?.fileUrl]);

  if (fileQuery.isLoading) {
    return <p className="text-sm text-slate-600">Loading file...</p>;
  }

  if (fileQuery.error || !fileQuery.data) {
    return <p className="text-sm text-red-600">Unable to load file details.</p>;
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="min-h-[70vh] rounded-xl border border-slate-200 bg-slate-100 p-4">
        <h1 className="mb-4 text-lg font-semibold">{fileQuery.data.filename}</h1>
        <PDFViewer fileUrl={safeUrl} initialPage={initialPage} keyword={keyword} />
      </div>
      <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Search Context</h2>
        <p className="text-sm text-slate-600">
          Jumped to page <span className="font-medium">{initialPage}</span>
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
