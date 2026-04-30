import * as z from "zod";

export const LikeExperienceBodySchema = z.object({
  experienceId: z.coerce.number().int().positive(),
});

export const LikeTagBodySchema = z.object({
  tagId: z.coerce.number().int().positive(),
});

export type LikeExperienceBody = z.infer<typeof LikeExperienceBodySchema>;
export type LikeTagBody = z.infer<typeof LikeTagBodySchema>;
