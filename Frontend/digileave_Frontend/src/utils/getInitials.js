export function getInitials(name = "", email = "") {
  const n = String(name || "").trim();
  if (n) {
    const letters = n.match(/\b\p{L}/gu) || n.match(/\b\w/g) || [];
    if (letters.length) return letters.slice(0, 2).join("").toUpperCase();
  }
  const e = String(email || "").trim();
  return e ? e[0].toUpperCase() : "??";
}
