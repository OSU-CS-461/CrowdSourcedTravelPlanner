import { describe, expect, it } from "vitest";
import {
  ExpListQuerySchema,
  ExpPutPostBody,
  ExpPutPostBodySchema,
} from "../../models/experience";

const BASE_VALID_EXP = (): ExpPutPostBody => ({
  title: "Bright Angel Trail",
  description: "A beautiful hike with incredible views of the Grand Canyon.",
  categoryId: 1,
  country: "US",
  latitude: 36.057,
  longitude: -112.143,
});

describe("Experience generic validation", () => {
  it("passes a correct baseline experience object", () => {
    const parsed = ExpPutPostBodySchema.safeParse(BASE_VALID_EXP());
    expect(parsed.success).toBeTruthy();
  });

  // ---- TITLE ----

  it("fails if title is missing", () => {
    const { title: _title, ...data } = BASE_VALID_EXP();
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeFalsy();
  });

  it("fails if title is too short", () => {
    const data = { ...BASE_VALID_EXP(), title: "Hi" };
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeFalsy();
  });

  it("fails if title is too long", () => {
    const data = { ...BASE_VALID_EXP(), title: "A".repeat(201) };
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeFalsy();
  });

  // ---- DESCRIPTION ----

  it("fails if description is missing", () => {
    const { description: _description, ...data } = BASE_VALID_EXP();
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeFalsy();
  });

  it("fails if description is too short", () => {
    const data = { ...BASE_VALID_EXP(), description: "Short desc" };
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeFalsy();
  });

  // ---- CATEGORY ----

  it("fails if categoryId is missing", () => {
    const { categoryId: _categoryId, ...data } = BASE_VALID_EXP();
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeFalsy();
  });

  it("fails if categoryId is not positive", () => {
    const data = { ...BASE_VALID_EXP(), categoryId: 0 };
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeFalsy();
  });

  // ---- COUNTRY ----

  it("fails if country is missing", () => {
    const { country: _country, ...data } = BASE_VALID_EXP();
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeFalsy();
  });

  // ---- TAG IDS ----

  it("passes with valid tagIds", () => {
    const data = { ...BASE_VALID_EXP(), tagIds: [1, 2, 3] };
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeTruthy();
  });

  it("fails when tagIds has duplicate values", () => {
    const data = { ...BASE_VALID_EXP(), tagIds: [1, 1] };
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeFalsy();
  });

  it("fails when tagIds includes non-positive values", () => {
    const data = { ...BASE_VALID_EXP(), tagIds: [1, 0] };
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeFalsy();
  });
});

describe("Experience location validation", () => {
  it("fails when latitude is missing", () => {
    const { latitude: _latitude, ...data } = BASE_VALID_EXP();
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeFalsy();
  });

  it("fails when longitude is missing", () => {
    const { longitude: _longitude, ...data } = BASE_VALID_EXP();
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeFalsy();
  });

  it("passes with optional location fields omitted", () => {
    const parsed = ExpPutPostBodySchema.safeParse(BASE_VALID_EXP());
    expect(parsed.success).toBeTruthy();
  });

  it("passes with partial optional location fields", () => {
    const data = { ...BASE_VALID_EXP(), city: "Springfield" };
    const parsed = ExpPutPostBodySchema.safeParse(data);
    expect(parsed.success).toBeTruthy();
  });
});

describe("Experience list query validation", () => {
  it("parses tagMode case-insensitively", () => {
    const parsed = ExpListQuerySchema.safeParse({
      tags: "beach,sunset",
      tagMode: "AND",
    });
    expect(parsed.success).toBeTruthy();
    if (parsed.success) {
      expect(parsed.data.tagMode).toBe("and");
    }
  });

  it("fails for invalid tagMode", () => {
    const parsed = ExpListQuerySchema.safeParse({
      tags: "beach,sunset",
      tagMode: "all",
    });
    expect(parsed.success).toBeFalsy();
  });
});
