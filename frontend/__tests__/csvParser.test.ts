import { parseAmount, parseCSV, parseDate } from "@/infrastructure/csv/csvParser";

describe("parseCSV", () => {
  test("detects semicolon delimiter and parses headers", () => {
    const csv = "Date;Libellé;Montant\n01/05/2025;Carrefour;-45,20";
    const { headers, rows } = parseCSV(csv);
    expect(headers).toEqual(["Date", "Libellé", "Montant"]);
    expect(rows[0]).toEqual({ Date: "01/05/2025", Libellé: "Carrefour", Montant: "-45,20" });
  });

  test("detects comma delimiter", () => {
    const csv = "date,desc,amount\n2025-05-01,Shop,12.50";
    const { headers, rows } = parseCSV(csv);
    expect(headers).toEqual(["date", "desc", "amount"]);
    expect(rows[0]["amount"]).toBe("12.50");
  });

  test("handles quoted fields", () => {
    const csv = 'Date;Libellé;Montant\n"01/05/2025";"Virement entrant";"1 234,56"';
    const { rows } = parseCSV(csv);
    expect(rows[0]["Libellé"]).toBe("Virement entrant");
    expect(rows[0]["Montant"]).toBe("1 234,56");
  });

  test("returns empty for fewer than 2 lines", () => {
    expect(parseCSV("").rows).toHaveLength(0);
    expect(parseCSV("Date;Montant").rows).toHaveLength(0);
  });
});

describe("parseDate", () => {
  test("parses DD/MM/YYYY", () => {
    expect(parseDate("01/05/2025")).toBe("2025-05-01");
  });
  test("parses DD-MM-YYYY", () => {
    expect(parseDate("15-12-2024")).toBe("2024-12-15");
  });
  test("parses YYYY-MM-DD", () => {
    expect(parseDate("2025-05-01")).toBe("2025-05-01");
  });
  test("returns null for invalid", () => {
    expect(parseDate("not-a-date")).toBeNull();
  });
});

describe("parseAmount", () => {
  test("parses French format 1 234,56", () => {
    expect(parseAmount("1 234,56")).toBeCloseTo(1234.56);
  });
  test("parses negative -45,20", () => {
    expect(parseAmount("-45,20")).toBeCloseTo(-45.2);
  });
  test("parses dot decimal 12.50", () => {
    expect(parseAmount("12.50")).toBeCloseTo(12.5);
  });
  test("returns null for non-numeric", () => {
    expect(parseAmount("abc")).toBeNull();
  });
});
