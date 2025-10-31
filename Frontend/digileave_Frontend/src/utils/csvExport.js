export function csvExport(rows, fields, filename, headersMap = {}) {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return "";
    let s = typeof val === "object"
      ? Array.isArray(val) ? val.join("; ") : JSON.stringify(val)
      : String(val);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const headerLine = fields
    .map((f) => headersMap[f] || f)
    .join(",");

  const lines = rows.map((r) =>
    fields.map((f) => escapeCsv(r[f])).join(",")
  );

  const csv = "\uFEFF" + [headerLine, ...lines].join("\n"); // BOM for Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "export.csv";
  a.click();
  URL.revokeObjectURL(url);
}