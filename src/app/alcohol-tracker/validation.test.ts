import { describe, expect, it } from "vitest";
import { validateDrinkInput } from "./validation";

const valid = {
  consumedAt: "2026-06-13T18:00:00.000Z",
  type: "wine",
  quantity: 2,
  setting: "Home",
  category: "family",
  note: "dinner",
};

describe("validateDrinkInput", () => {
  it("accepts a well-formed payload", () => {
    const r = validateDrinkInput(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.type).toBe("wine");
      expect(r.value.quantity).toBe(2);
      expect(r.value.note).toBe("dinner");
    }
  });

  it("defaults consumedAt to now when missing", () => {
    const { consumedAt: _omit, ...rest } = valid;
    void _omit;
    const r = validateDrinkInput(rest);
    expect(r.ok).toBe(true);
    if (r.ok) expect(Number.isNaN(Date.parse(r.value.consumedAt))).toBe(false);
  });

  it("rejects an unknown alcohol type", () => {
    expect(validateDrinkInput({ ...valid, type: "moonshine" }).ok).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(validateDrinkInput({ ...valid, category: "gym" }).ok).toBe(false);
  });

  it("rejects non-positive or absurd quantities", () => {
    expect(validateDrinkInput({ ...valid, quantity: 0 }).ok).toBe(false);
    expect(validateDrinkInput({ ...valid, quantity: -1 }).ok).toBe(false);
    expect(validateDrinkInput({ ...valid, quantity: 999 }).ok).toBe(false);
  });

  it("rejects an empty setting", () => {
    expect(validateDrinkInput({ ...valid, setting: "  " }).ok).toBe(false);
  });

  it("rejects a non-object body", () => {
    expect(validateDrinkInput(null).ok).toBe(false);
    expect(validateDrinkInput("nope").ok).toBe(false);
  });
});
