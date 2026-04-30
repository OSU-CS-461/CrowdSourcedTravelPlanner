import * as z from "zod";

export const LikeExperienceBodySchema = z.object({
  experienceId: z.coerce.number().int().positive(),
});

export const LikeTagBodySchema = z.object({
  tagId: z.coerce.number().int().positive(),
});

export const LikeTripBodySchema = z.object({
  tripId: z.coerce.number().int().positive(),
});

export type LikeExperienceBody = z.infer<typeof LikeExperienceBodySchema>;
export type LikeTagBody = z.infer<typeof LikeTagBodySchema>;
export type LikeTripBody = z.infer<typeof LikeTripBodySchema>;
