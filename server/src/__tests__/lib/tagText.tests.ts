import { describe, expect, it } from "vitest";
import { normalizeTagText, sanitizeTagLabel, slugFromTagText } from "../../lib/tagText";

describe("tag text helpers", () => {
  it("normalizes separators/punctuation/spacing consistently", () => {
    expect(normalizeTagText("Lake / Lagoon")).toBe("lake lagoon");
    expect(normalizeTagText("lake-lagoon")).toBe("lake lagoon");
    expect(normalizeTagText(" lake   lagoon ")).toBe("lake lagoon");
    expect(normalizeTagText("lake___lagoon!!")).toBe("lake lagoon");
  });

  it("sanitizes labels without removing user-facing punctuation", () => {
    expect(sanitizeTagLabel("  Lake   / Lagoon  ")).toBe("Lake / Lagoon");
  });

  it("slugifies using normalized tokens", () => {
    expect(slugFromTagText("Lake / Lagoon")).toBe("lake-lagoon");
  });
});
