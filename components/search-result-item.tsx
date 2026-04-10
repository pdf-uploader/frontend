import Link from "next/link";
import { SearchResult } from "@/lib/types";

export function SearchResultItem({ result, keyword }: { result: SearchResult; keyword: string }) {
  return (
    <Link
      href={`/files/${result.fileId}?page=${result.page}&keyword=${encodeURIComponent(keyword)}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300"
    >
      <p className="text-sm font-semibold text-slate-900">{result.filename}</p>
      <p className="mt-1 text-xs text-slate-500">Page {result.page}</p>
      <p className="mt-3 line-clamp-2 text-sm text-slate-700">{result.snippet}</p>
    </Link>
  );
}
