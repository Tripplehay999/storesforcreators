import { NextResponse } from "next/server";

export type CsvRow = Record<string, string | number | boolean | null>;

export function toCsv(rows: CsvRow[]) {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const cell = (value: CsvRow[string]) => {
    const text = value === null ? "" : String(value);
    // Quote everything; neutralise spreadsheet formula injection.
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  return [headers.join(","), ...rows.map(row => headers.map(key => cell(row[key])).join(","))].join("\n");
}

/** A CSV download named `sfc-<name>-<YYYY-MM-DD>.csv`. */
export function csvResponse(name: string, rows: CsvRow[]) {
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sfc-${name}-${date}.csv"`
    }
  });
}
