import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getRepoRoot } from "../../repo-root.js";
import { checkFileQuality } from "./data-quality-check.js";

let tempDir: string | undefined;

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

function writeTempCsv(content: string): string {
  tempDir = mkdtempSync(join(tmpdir(), "dqc-"));
  const filePath = join(tempDir, "data.csv");
  writeFileSync(filePath, content, "utf8");
  return filePath;
}

describe("checkFileQuality", () => {
  it("passes for a clean CSV", () => {
    const path = writeTempCsv(
      ["id,name,amount", "1,Alice,10", "2,Bob,20"].join("\n"),
    );
    const report = checkFileQuality(path, ["id", "name"], ["amount"], "id");
    expect(report.level).toBe("pass");
    expect(report.rowCount).toBe(2);
    expect(report.duplicateIds).toBe(0);
    expect(report.issues).toHaveLength(0);
    const amount = report.columnChecks.find((c) => c.column === "amount");
    expect(amount).toMatchObject({ nullRate: 0, level: "pass" });
  });

  it("fails when a required column is missing", () => {
    const path = writeTempCsv(["id,name", "1,Alice"].join("\n"));
    const report = checkFileQuality(path, ["id", "name", "email"], ["name"]);
    expect(report.level).toBe("fail");
    expect(report.issues.some((i) => i.includes("Missing required column: email"))).toBe(
      true,
    );
  });

  it("warns when a key column has more than 40% nulls", () => {
    const rows = ["id,note", ...Array.from({ length: 10 }, (_, i) => `${i + 1},${i < 5 ? "x" : ""}`)];
    const path = writeTempCsv(rows.join("\n"));
    const report = checkFileQuality(path, ["id"], ["note"]);
    expect(report.level).toBe("warn");
    const note = report.columnChecks.find((c) => c.column === "note");
    expect(note?.level).toBe("warn");
    expect(note?.nullRate).toBeCloseTo(0.5, 5);
    expect(report.issues.some((i) => i === "High null rate on note: 50% (warn)")).toBe(true);
  });

  it("fails when a key column has more than 80% nulls", () => {
    const rows = [
      "id,note",
      ...Array.from({ length: 10 }, (_, i) => `${i + 1},${i === 0 ? "only" : ""}`),
    ];
    const path = writeTempCsv(rows.join("\n"));
    const report = checkFileQuality(path, ["id"], ["note"]);
    expect(report.level).toBe("fail");
    const note = report.columnChecks.find((c) => c.column === "note");
    expect(note?.level).toBe("fail");
    expect(note?.nullRate).toBeCloseTo(0.9, 5);
    expect(report.issues.some((i) => i.includes("fail") && i.includes("note"))).toBe(true);
  });

  it("warns and counts duplicate IDs correctly", () => {
    const path = writeTempCsv(
      ["Id,name", "1,A", "1,B", "2,C", "3,D", "3,E", "3,F"].join("\n"),
    );
    const report = checkFileQuality(path, ["Id", "name"], ["name"], "Id");
    expect(report.level).toBe("warn");
    expect(report.duplicateIds).toBe(3);
    expect(
      report.issues.some((i) => i.includes("3") && i.toLowerCase().includes("duplicate")),
    ).toBe(true);
  });

  it("passes on real Zoho CRM Deals CSV", () => {
    const root = getRepoRoot();
    const filePath = join(root, "data/zoho/Zoho - CRM - Deals.csv");
    const report = checkFileQuality(
      filePath,
      ["Id", "Deal Name", "Stage"],
      ["Amount", "Created Time", "Closing Date"],
      "Id",
    );
    expect(report.level).toBe("pass");
    expect(report.rowCount).toBeGreaterThan(0);
  });

  it("passes on real Zoho Desk Tickets with required ID, Status, Channel", () => {
    const root = getRepoRoot();
    const filePath = join(root, "data/zoho/Zoho-Desk-Tickets.csv");
    const report = checkFileQuality(filePath, ["ID", "Status", "Channel"], []);
    expect(report.level).toBe("pass");
    expect(report.rowCount).toBe(4645);
  });
});
