import { redirect } from "next/navigation";

/** Historical `/search` URL → dashboard; preserves `?keyword=` for bookmarks and links. */
export default async function SearchRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp.keyword;
  const kw = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const q = new URLSearchParams();
  if (kw) q.set("keyword", kw);
  const qs = q.toString();
  redirect(qs ? `/dashboard?${qs}` : "/dashboard");
}
