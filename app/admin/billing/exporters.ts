'use client';

/* Dependency-free exporters for tables and invoices. */

const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Export a table to a real .xls file (opens cleanly in Excel/LibreOffice/Sheets). */
export function exportExcel(
  filename: string,
  columns: string[],
  rows: (string | number)[][],
  title?: string
) {
  const head = `<tr>${columns.map(c => `<th style="background:#4f46e5;color:#fff;font-weight:bold;padding:6px;border:1px solid #ccc">${esc(c)}</th>`).join("")}</tr>`;
  const body = rows
    .map(r => `<tr>${r.map(c => `<td style="padding:5px;border:1px solid #ddd">${esc(c)}</td>`).join("")}</tr>`)
    .join("");
  const titleRow = title
    ? `<tr><td colspan="${columns.length}" style="font-size:16px;font-weight:bold;padding:8px">${esc(title)}</td></tr>`
    : "";
  const html =
    `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head>` +
    `<body><table>${titleRow}${head}${body}</table></body></html>`;
  downloadBlob(new Blob([html], { type: "application/vnd.ms-excel" }), `${filename}.xls`);
}

/** Open a clean print window (no app chrome, no browser header/footer) and print → Save as PDF. */
export function exportTablePDF(opts: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
  align?: ("left" | "right" | "center")[];
}) {
  const { title, subtitle, columns, rows, align = [] } = opts;
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) { alert("Please allow pop-ups to export PDF."); return; }

  const head = `<tr>${columns.map((c, i) => `<th style="text-align:${align[i] || "left"}">${esc(c)}</th>`).join("")}</tr>`;
  const body = rows
    .map(r => `<tr>${r.map((c, i) => `<td style="text-align:${align[i] || "left"}">${esc(c)}</td>`).join("")}</tr>`)
    .join("");

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <style>
      @page { size: A4; margin: 12mm; }
      * { box-sizing:border-box; }
      body { font-family:'Segoe UI',Arial,sans-serif; color:#111827; margin:0; }
      h1 { font-size:20px; margin:0 0 2px; }
      .sub { color:#6b7280; font-size:12px; margin-bottom:16px; }
      table { width:100%; border-collapse:collapse; font-size:12px; }
      th { background:#f3f4f6; text-transform:uppercase; font-size:10px; letter-spacing:.05em; color:#6b7280; padding:8px 10px; border-bottom:2px solid #e5e7eb; }
      td { padding:8px 10px; border-bottom:1px solid #eee; }
      tr:nth-child(even) td { background:#fafafa; }
      .foot { margin-top:18px; font-size:11px; color:#9ca3af; text-align:center; }
    </style></head><body>
    <h1>${esc(title)}</h1>
    ${subtitle ? `<div class="sub">${esc(subtitle)}</div>` : ""}
    <table><thead>${head}</thead><tbody>${body}</tbody></table>
    <div class="foot">Generated on ${new Date().toLocaleString("en-IN")}</div>
    <script>window.onload=function(){setTimeout(function(){window.print();},250);};</script>
    </body></html>`);
  w.document.close();
}
