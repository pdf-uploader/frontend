import { FolderBrowser } from "@/components/folder-browser";

export default function HomePage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">PDF Library</h1>
        <p className="text-sm text-slate-600">Browse folders, search files, and open manuals quickly.</p>
      </div>
      <FolderBrowser />
    </section>
  );
}
