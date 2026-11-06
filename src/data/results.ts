import type { RecognitionResult } from "@schemas/recognition";

/**
 * Factories for /api/identify-frame answers, used to mock the scan in UI tests.
 * The titles are made up on purpose: UI tests check rendering, not recognition.
 * Recognition quality is measured separately (tests/ai-eval, docs/ai-quality.md).
 */

let counter = 0;
const uuid = () => {
  counter += 1;
  return `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`;
};

const base = (overrides: Partial<RecognitionResult>): RecognitionResult => ({
  recognized: true,
  title: "The Quiet Harbour",
  year: 2019,
  type: "movie",
  genre: "Drama, Mystery",
  director_or_studio: "dir. Ana Reyes",
  confidence: 93,
  scene_description: "Two people talk on a pier at dusk while a ferry leaves.",
  alternates: [],
  scan_id: uuid(),
  tier: "standard",
  deep_available: false,
  ...overrides,
});

export const results = {
  /** 90%+: a confident answer, no candidates block. */
  confident: (o: Partial<RecognitionResult> = {}) => base({ confidence: 93, ...o }),

  /** Below 75: "Not sure", with competing candidates under the title. */
  unsure: (o: Partial<RecognitionResult> = {}) =>
    base({
      title: "Night Shift Diaries",
      confidence: 55,
      deep_available: true,
      alternates: [
        { title: "Graveyard Hours", year: 2018, confidence: 30 },
        { title: "The Last Tram", year: 2020, confidence: 20 },
      ],
      ...o,
    }),

  /** Nothing matched. */
  unrecognized: (o: Partial<RecognitionResult> = {}) =>
    base({
      recognized: false,
      title: undefined,
      year: undefined,
      genre: undefined,
      director_or_studio: undefined,
      scene_description: undefined,
      confidence: 8,
      ...o,
    }),

  anime: (o: Partial<RecognitionResult> = {}) =>
    base({
      title: "Skyward Lanterns",
      native_title: "空の灯籠",
      type: "anime",
      director_or_studio: "Studio Fennec",
      confidence: 97,
      timestamp_estimate: "S1E04 · 12:31",
      ...o,
    }),
};

/** Error bodies exactly as the server sends them; the app maps `code` to a translated message. */
export const errors = {
  aiOverloaded: { status: 503, body: { error: "The AI model is overloaded.", code: "ai_overloaded" } },
  unsafeContent: {
    status: 400,
    body: {
      error: "This image can't be processed — it was flagged as inappropriate content.",
      code: "unsafe_content",
      recognized: false,
      confidence: 0,
    },
  },
  ipLimit: { status: 429, body: { error: "Too many searches from this network today.", code: "ip_limit" } },
  authRequired: { status: 401, body: { error: "Sign-in required.", code: "auth_required" } },
  limitReached: {
    status: 429,
    body: {
      error: "Daily search limit reached.",
      code: "limit_reached",
      quota: {
        isPro: false,
        standardLeft: 0,
        dailyLimit: 5,
        usedToday: 5,
        deepTokens: 0,
        rewardedLeftToday: 3,
        resetsAt: new Date(Date.UTC(2030, 0, 2)).toISOString(),
        monthLeft: null,
      },
    },
  },
} as const;
