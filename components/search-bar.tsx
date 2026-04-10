"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor="searchKeyword" className="mb-2 block text-sm font-medium text-slate-700">
        Search keyword
      </label>
      <input
        id="searchKeyword"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Try: calibration, maintenance, wiring..."
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
      />
    </div>
  );
}
