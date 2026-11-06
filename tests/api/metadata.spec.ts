import { test, expect } from "@fixtures/test";
import { metadataResponseSchema } from "@schemas/catalog";

/**
 * GET /api/omdb — the metadata lookup behind a result card. The route kept its
 * old name for app versions already on phones; the data comes from Trakt,
 * TheTVDB and Wikidata, with a curated catalog when no key is configured.
 */
test.describe("GET /api/omdb (metadata lookup)", () => {
  test("finds a well-known film from the catalog", { tag: ["@smoke", "@api"] }, async ({ api }) => {
    const response = await api.metadata({ title: "Interstellar", year: 2014 });

    expect(response.status()).toBe(200);
    const body = metadataResponseSchema.parse(await response.json());
    expect(body.data?.title).toBe("Interstellar");
    expect(body.data?.year).toBe(2014);
  });

  test("an unknown title returns data: null, not an error", { tag: "@negative" }, async ({ api }) => {
    const response = await api.metadata({ title: "Zzqx Nonexistent Picture", year: 1901 });

    expect(response.status()).toBe(200);
    expect(metadataResponseSchema.parse(await response.json()).data).toBeNull();
  });

  test("is cached for a week", { tag: "@regression" }, async ({ api }) => {
    const response = await api.metadata({ title: "Interstellar", year: 2014 });

    expect(response.headers()["cache-control"]).toContain("max-age=604800");
  });

  test("a non-English locale keeps the same contract", { tag: "@i18n" }, async ({ api }) => {
    const response = await api.metadata({ title: "Interstellar", year: 2014, locale: "ru" });

    expect(response.status()).toBe(200);
    metadataResponseSchema.parse(await response.json());
  });

  test(
    "a request with no title is rejected as a bad request",
    { tag: ["@negative", "@known-bug"] },
    async ({ api }) => {
      // Known bug: the route answers 200 { data: null } instead of 400. See the issue
      // "GET /api/omdb without a title answers 200 instead of 400". When it's fixed,
      // this test starts passing and Playwright reports it, so the annotation is removed.
      test.fail();
      const response = await api.raw().get("/api/omdb");

      expect(response.status()).toBe(400);
    },
  );
});
