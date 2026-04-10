"use client";

import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { SearchResultItem } from "@/components/search-result-item";
import { api } from "@/lib/api";
import { SearchResult } from "@/lib/types";

interface FindApiItem {
  id: string;
  filename: string;
  content?: Array<{
    page: number;
    content: string;
  }>;
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword] = useDebounce(keyword, 400);

  const searchQuery = useQuery({
    queryKey: ["search", debouncedKeyword],
    queryFn: async () => {
      const response = await api.get<FindApiItem[]>("/files/find", { params: { keyword: debouncedKeyword } });
      const flattened: SearchResult[] = response.data.flatMap((file) =>
        (file.content ?? []).map((match, index) => ({
          id: `${file.id}-${match.page}-${index}`,
          fileId: file.id,
          filename: file.filename,
          page: Math.max(1, match.page + 1),
          snippet: match.content,
        }))
      );
      return flattened;
    },
    enabled: debouncedKeyword.trim().length > 0,
  });

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold">Global PDF Search</h1>
      <SearchBar value={keyword} onChange={setKeyword} />

      {searchQuery.isLoading && <p className="text-sm text-slate-600">Searching...</p>}
      {searchQuery.error && <p className="text-sm text-red-600">Search failed. Try again.</p>}

      <div className="grid gap-3">
        {searchQuery.data?.map((result) => (
          <SearchResultItem key={result.id} result={result} keyword={debouncedKeyword} />
        ))}
      </div>
    </section>
  );
}
