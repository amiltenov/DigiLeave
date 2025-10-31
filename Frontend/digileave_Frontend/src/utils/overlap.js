export function parseYMD(s) {
  if (!s) return new Date(NaN);
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

export function hasOverlapWithRequests(startDate, endDate, requests) {
  const aStart = parseYMD(startDate);
  const aEnd = parseYMD(endDate);

  return requests.some((r) => {
    const status = String(r.status || "").toLowerCase();
    if (["rejected", "cancelled", "canceled", "declined"].includes(status)) return false;

    const bStart = parseYMD(r.startDate || r.start || r.fromDate || r.from);
    const bEnd = parseYMD(r.endDate || r.end || r.toDate || r.to);
    if (Number.isNaN(bStart) || Number.isNaN(bEnd)) return false;

    return rangesOverlap(aStart, aEnd, bStart, bEnd);
  });
}
