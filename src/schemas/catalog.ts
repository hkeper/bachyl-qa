import { z } from "zod";

export const healthSchema = z.strictObject({
  status: z.literal("ok"),
  hasApiKey: z.boolean(),
  hasTraktKey: z.boolean(),
  hasTvdbKey: z.boolean(),
  hasEmailAuth: z.boolean(),
});

export const trendingItemSchema = z.looseObject({
  id: z.union([z.string(), z.number()]),
  title: z.string().min(1),
  original_title: z.string().optional(),
  media_type: z.enum(["movie", "tv", "anime"]),
  poster_url: z.string(),
  year: z.number().int(),
  vote_average: z.number().min(0).max(10),
  overview: z.string(),
  genres: z.array(z.string()),
  trending_rank: z.number().int().positive(),
});

export const trendingResponseSchema = z.looseObject({
  success: z.literal(true),
  source: z.enum(["trakt_live", "fallback"]),
  items: z.array(trendingItemSchema),
  total: z.number().int().min(0),
  updated_at: z.iso.datetime(),
});

export const metadataSchema = z.looseObject({
  title: z.string().min(1),
  year: z.number().int().optional(),
  runtime: z.string().optional(),
  genre: z.string().optional(),
  director: z.string().optional(),
  actors: z.string().optional(),
  plot: z.string().optional(),
});

/** GET /api/omdb (the name is kept for shipped app versions; the data comes from Trakt / TheTVDB / Wikidata). */
export const metadataResponseSchema = z.looseObject({
  success: z.literal(true),
  source: z.string(),
  data: metadataSchema.nullable(),
});

export const feedbackResponseSchema = z.strictObject({
  success: z.literal(true),
  stored: z.boolean(),
});
