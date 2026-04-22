import Link from "next/link";
import { FolderFile } from "@/lib/types";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function FileList({ files }: { files: FolderFile[] }) {
  if (!files.length) {
    return <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">No files yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Filename</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <Link className="break-keep break-words text-blue-600 hover:underline" href={`/files/${file.id}`}>
                  {file.filename}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDate(file.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
