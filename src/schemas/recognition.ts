import { z } from "zod";

/**
 * Public contract of POST /api/identify-frame, as the app reads it.
 * Written from the client's point of view: what the UI needs to render a result.
 * Unknown extra fields are allowed (the server may add more), so these are
 * loose objects; a missing or mistyped known field fails the test.
 */
export const mediaTypeSchema = z.enum(["movie", "series", "tv", "anime", "animation", "clip", "unknown"]);

export const alternateSchema = z.looseObject({
  title: z.string().min(1),
  original_title: z.string().optional(),
  year: z.number().int().optional(),
  confidence: z.number().min(0).max(100).optional(),
  note: z.string().optional(),
});

export const quotaSchema = z.looseObject({
  isPro: z.boolean(),
  standardLeft: z.number().int().min(0),
  dailyLimit: z.number().int().min(0),
  usedToday: z.number().int().min(0),
  deepTokens: z.number().int().min(0),
  rewardedLeftToday: z.number().int().min(0),
  resetsAt: z.iso.datetime({ offset: true }),
  monthLeft: z.number().int().nullable(),
});

export const recognitionResultSchema = z
  .looseObject({
    recognized: z.boolean(),
    title: z.string().optional(),
    original_title: z.string().optional(),
    native_title: z.string().optional(),
    year: z.number().int().min(1870).max(2100).optional(),
    type: mediaTypeSchema.optional(),
    genre: z.string().optional(),
    director_or_studio: z.string().optional(),
    confidence: z.number().min(0).max(100),
    reasoning_hint: z.string().optional(),
    scene_description: z.string().optional(),
    timestamp_estimate: z.string().optional(),
    alternates: z.array(alternateSchema).max(5).optional(),
    isDemo: z.boolean().optional(),
    scan_id: z.uuid().optional(),
    tier: z.enum(["standard", "deep"]).optional(),
    deep_available: z.boolean().optional(),
    quota: quotaSchema.optional(),
  })
  // A recognized answer must name something.
  .refine((r) => !r.recognized || Boolean(r.title), { message: "recognized result without a title" });

export type RecognitionResult = z.infer<typeof recognitionResultSchema>;

/** Every refusal carries a stable machine-readable code the app maps to a translated message. */
export const apiErrorSchema = z.looseObject({
  error: z.string().min(1),
  code: z.string().min(1).optional(),
});

/** NDJSON lines of a streamed scan (`progress: true`). */
export const scanStreamLineSchema = z.discriminatedUnion("type", [
  z.looseObject({ type: z.literal("stage"), stage: z.string() }),
  z.looseObject({ type: z.literal("found") }),
  z.looseObject({ type: z.literal("preview"), body: z.unknown() }),
  z.looseObject({ type: z.literal("final"), status: z.number().int(), body: z.unknown() }),
]);
