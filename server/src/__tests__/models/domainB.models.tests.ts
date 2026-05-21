import { describe, expect, it } from "vitest";
import { InterestPutPostBodySchema } from "../../models/interest";
import { SettingsPatchBodySchema } from "../../models/settings";
import { TripPutPostBodySchema } from "../../models/trip";
import { LikeTripBodySchema } from "../../models/userLikes";

/** Domain B: Trips, Interests, Settings, Likes — Zod validation smoke tests */
describe("Domain B models", () => {
  it("TripPutPostBodySchema accepts valid trip", () => {
    expect(TripPutPostBodySchema.safeParse({ title: "Weekend trip" }).success).toBe(true);
    expect(TripPutPostBodySchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("InterestPutPostBodySchema enforces name length", () => {
    expect(InterestPutPostBodySchema.safeParse({ name: "Hiking" }).success).toBe(true);
    expect(InterestPutPostBodySchema.safeParse({ name: "A" }).success).toBe(false);
  });

  it("SettingsPatchBodySchema accepts valid enums", () => {
    expect(
      SettingsPatchBodySchema.safeParse({
        preferredFeedSort: "highestRated",
        themePreference: "dark",
      }).success
    ).toBe(true);
    expect(SettingsPatchBodySchema.safeParse({ themePreference: "neon" }).success).toBe(false);
  });

  it("LikeTripBodySchema coerces tripId", () => {
    const parsed = LikeTripBodySchema.safeParse({ tripId: "3" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.tripId).toBe(3);
  });
});
