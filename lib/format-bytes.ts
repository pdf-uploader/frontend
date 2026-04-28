/** Short human-readable size for progress UI (binary units). */
export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u += 1;
  }
  const rounded = u === 0 ? Math.round(n) : Number(n.toFixed(fractionDigits));
  return `${rounded} ${units[u]}`;
}
