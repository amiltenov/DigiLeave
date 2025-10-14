// src/utils/xlsxExport.js
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

/**
 * Create a styled Excel export.
 * @param {Object[]} rows - Array of row objects.
 * @param {string[]} fields - Ordered list of field keys to include.
 * @param {string} filename - Output filename (e.g., "export.xlsx").
 * @param {Record<string,string>} headers - Map field -> human label.
 */
export async function xlsxExport({ rows, fields, filename = "export.xlsx", headers = {} }) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Data", {
    views: [{ state: "frozen", ySplit: 1 }], // freeze header row
    properties: { defaultRowHeight: 18 },
  });

  // Columns with initial widths based on header label length
  ws.columns = fields.map((key) => ({
    header: headers[key] || key,
    key,
    width: Math.max(12, String(headers[key] || key).length + 4),
    style: { font: { size: 11 } },
  }));

  // Header row styling
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
  headerRow.border = {
    top: { style: "thin", color: { argb: "FFCCCCCC" } },
    left: { style: "thin", color: { argb: "FFCCCCCC" } },
    bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    right: { style: "thin", color: { argb: "FFCCCCCC" } },
  };

  // Push data
  rows.forEach((r) => {
    const rowValues = fields.map((k) => r[k]);
    ws.addRow(rowValues);
  });

  // Light zebra striping + borders + basic alignment
  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    if (i % 2 === 0) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9F9F9" } };
    }
    row.alignment = { vertical: "middle", wrapText: true };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFF1F1F1" } },
        left: { style: "thin", color: { argb: "FFF1F1F1" } },
        bottom: { style: "thin", color: { argb: "FFF1F1F1" } },
        right: { style: "thin", color: { argb: "FFF1F1F1" } },
      };
    });
  }

  // Common date/number formatting (tweak lists as needed)
  const dateCols = new Set(["startDate", "endDate", "decidedAt", "workingSince"]);
  const integerCols = new Set(["workdaysCount", "availableLeaveDays", "contractLeaveDays"]);
  ws.columns.forEach((col) => {
    if (dateCols.has(col.key)) col.numFmt = "yyyy-mm-dd";
    if (integerCols.has(col.key)) col.numFmt = "0";
  });

  // Wider column for long text (e.g., comment)
  const commentIdx = fields.indexOf("comment");
  if (commentIdx >= 0) {
    const col = ws.getColumn(commentIdx + 1);
    col.width = Math.max(col.width || 12, 42);
    col.alignment = { ...col.alignment, wrapText: true };
  }

  // Auto fit columns based on content
  ws.columns.forEach((col) => {
    let max = col.width || 12;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value == null ? "" : String(cell.value);
      max = Math.max(max, Math.min(60, v.length + 3));
    });
    col.width = Math.max(12, Math.min(60, Math.ceil(max)));
  });

  // Enable autofilter over the header
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: fields.length },
  };

  // Save file
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}