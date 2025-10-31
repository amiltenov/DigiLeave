export function formatDate(s) {
  if (!s) return "—";
  const ymd = String(s).split("T")[0];
  const parts = ymd.split("-");
  if (parts.length !== 3) return s;
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
}