export interface RawRow {
  [key: string]: string;
}

function detectDelimiter(headerLine: string): string {
  const counts = { ";": 0, ",": 0, "\t": 0 };
  for (const ch of headerLine) {
    if (ch in counts) counts[ch as keyof typeof counts]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function parseLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseCSV(text: string): { headers: string[]; rows: RawRow[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseLine(lines[0], delimiter).map((h) => h.replace(/^["']|["']$/g, ""));

  const rows: RawRow[] = lines.slice(1).map((line) => {
    const cells = parseLine(line, delimiter);
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? "").replace(/^["']|["']$/g, "")]));
  });

  return { headers, rows };
}

/** Parse French date formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD */
export function parseDate(value: string): string | null {
  const clean = value.trim();
  const dmY = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmY) return `${dmY[3]}-${dmY[2].padStart(2, "0")}-${dmY[1].padStart(2, "0")}`;
  const Ymd = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (Ymd) return `${Ymd[1]}-${Ymd[2].padStart(2, "0")}-${Ymd[3].padStart(2, "0")}`;
  return null;
}

/** Parse French amount: "1 234,56" or "-1234.56" or "1 234.56" */
export function parseAmount(value: string): number | null {
  const clean = value.trim().replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}
