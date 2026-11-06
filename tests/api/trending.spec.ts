import { test, expect } from "@fixtures/test";
import { trendingResponseSchema } from "@schemas/catalog";

test.describe("GET /api/trending", () => {
  test("returns a ranked catalog that matches the contract", { tag: ["@smoke", "@api"] }, async ({ api }) => {
    const response = await api.trending({ type: "all" });

    expect(response.status()).toBe(200);
    const body = trendingResponseSchema.parse(await response.json());
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.total).toBe(body.items.length);
  });

  test("ranks are unique and ascending", { tag: "@regression" }, async ({ api }) => {
    const { items } = trendingResponseSchema.parse(await (await api.trending()).json());
    const ranks = items.map((item) => item.trending_rank);

    expect(new Set(ranks).size).toBe(ranks.length);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  test("type=movie returns only movies", { tag: "@regression" }, async ({ api }) => {
    const { items } = trendingResponseSchema.parse(await (await api.trending({ type: "movie" })).json());

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.media_type === "movie")).toBe(true);
  });

  test("type=tv returns series and anime, no movies", { tag: "@regression" }, async ({ api }) => {
    const { items } = trendingResponseSchema.parse(await (await api.trending({ type: "tv" })).json());

    expect(items.length).toBeGreaterThan(0);
    expect(items.some((item) => item.media_type === "movie")).toBe(false);
  });

  test("filtering keeps the global rank, it doesn't renumber", { tag: "@regression" }, async ({ api }) => {
    const all = trendingResponseSchema.parse(await (await api.trending()).json()).items;
    const shows = trendingResponseSchema.parse(await (await api.trending({ type: "tv" })).json()).items;
    const rankById = new Map(all.map((item) => [String(item.id), item.trending_rank]));

    for (const show of shows) {
      expect(show.trending_rank).toBe(rankById.get(String(show.id)));
    }
  });

  for (const locale of ["en", "ru", "be"]) {
    test(`locale=${locale} answers the same contract`, { tag: "@i18n" }, async ({ api }) => {
      const response = await api.trending({ locale });

      expect(response.status()).toBe(200);
      trendingResponseSchema.parse(await response.json());
    });
  }

  test("an unknown type falls back to the full list", { tag: "@negative" }, async ({ api }) => {
    const all = trendingResponseSchema.parse(await (await api.trending()).json());
    const response = await api.raw().get("/api/trending", { params: { type: "documentary" } });

    expect(response.status()).toBe(200);
    expect(trendingResponseSchema.parse(await response.json()).total).toBe(all.total);
  });

  test("is cacheable by browsers and proxies", { tag: "@regression" }, async ({ api }) => {
    const response = await api.trending();

    expect(response.headers()["cache-control"]).toMatch(/max-age=\d+/);
  });
});
