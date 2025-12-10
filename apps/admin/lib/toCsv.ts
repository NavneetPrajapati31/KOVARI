// apps/admin/lib/toCsv.ts
export function toCsv(headers: string[], rows: unknown[][]): string {
  const escapeCell = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    let str = String(value);

    // Escape quotes
    if (str.includes('"')) {
      str = str.replace(/"/g, '""');
    }

    // If contains comma, quote or newline → wrap in quotes
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
      str = `"${str}"`;
    }

    return str;
  };

  const headerLine = headers.map(escapeCell).join(",");
  const lines = rows.map((row) => row.map(escapeCell).join(","));

  return [headerLine, ...lines].join("\n");
}
