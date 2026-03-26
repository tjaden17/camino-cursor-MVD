import { describe, expect, it } from "vitest";
import { diffNumeric } from "./numeric-diff.js";

describe("diffNumeric", () => {
  it("passes exact integer match", () => {
    const r = diffNumeric(42, 42, { isInteger: true });
    expect(r.pass).toBe(true);
  });

  it("fails outside tolerance", () => {
    const r = diffNumeric(10, 12, { isInteger: true });
    expect(r.pass).toBe(false);
  });
});
