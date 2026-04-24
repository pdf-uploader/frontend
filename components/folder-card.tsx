import Link from "next/link";
import { Folder } from "@/lib/types";

export function FolderCard({ folder }: { folder: Folder }) {
  return (
    <Link
      href={`/folders/${folder.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-base font-semibold text-slate-900">{folder.foldername}</h3>
          {folder.lock && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-800">
              Locked
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {folder.files.length} files
        </span>
      </div>
      <ul className="space-y-1 text-sm text-slate-600">
        {folder.files.slice(0, 3).map((file) => (
          <li key={file.id} className="truncate break-keep">
            {file.filename}
          </li>
        ))}
        {folder.files.length > 3 && <li className="text-xs text-slate-400">+ more</li>}
      </ul>
    </Link>
  );
}
