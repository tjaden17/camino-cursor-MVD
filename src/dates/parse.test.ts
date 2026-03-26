import { describe, expect, it } from "vitest";
import { inRangeInclusive, parseAuSlashDateTime, parseShiftDate } from "./parse.js";

describe("parseAuSlashDateTime", () => {
  it("parses AU day-first date", () => {
    const d = parseAuSlashDateTime("20/10/2025 09:08 PM");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2025);
    expect(d!.getMonth()).toBe(9);
    expect(d!.getDate()).toBe(20);
  });
});

describe("parseShiftDate", () => {
  it("parses 13-Sep-25", () => {
    const d = parseShiftDate("13-Sep-25");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2025);
    expect(d!.getMonth()).toBe(8);
    expect(d!.getDate()).toBe(13);
  });
});

describe("inRangeInclusive", () => {
  it("returns true inside range", () => {
    const a = new Date(2025, 0, 1);
    const b = new Date(2025, 0, 15);
    expect(inRangeInclusive(new Date(2025, 0, 10), a, b)).toBe(true);
  });
});
