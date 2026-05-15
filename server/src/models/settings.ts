import * as z from "zod";

export const PREFERRED_FEED_SORT_VALUES = ["newest", "highestRated", "recommended"] as const;

export const THEME_PREFERENCE_VALUES = ["light", "dark"] as const;

export const SettingsPatchBodySchema = z.object({
  preferredFeedSort: z.enum(PREFERRED_FEED_SORT_VALUES).optional(),
  themePreference: z.enum(THEME_PREFERENCE_VALUES).optional(),
});

export type SettingsPatchBody = z.infer<typeof SettingsPatchBodySchema>;
