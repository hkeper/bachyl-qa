import { test, expect } from "@fixtures/test";

/** The Android app's WebView calls the API from https://localhost, a different origin. */
const androidOrigin = "https://localhost";

test.describe("CORS for the Android client", () => {
  for (const path of ["/api/identify-frame", "/api/trending", "/api/feedback", "/api/quota"]) {
    test(
      `preflight to ${path} allows the app's origin and the auth header`,
      { tag: ["@smoke", "@android"] },
      async ({ api }) => {
        const response = await api.preflight(path, androidOrigin);
        const headers = response.headers();

        expect(response.status()).toBe(204);
        expect(headers["access-control-allow-origin"]).toBe(androidOrigin);
        expect(headers["access-control-allow-methods"]).toContain("POST");
        expect(headers["access-control-allow-headers"]?.toLowerCase()).toContain("authorization");
        expect(headers["vary"]).toContain("Origin");
      },
    );
  }

  test("a plain GET echoes the caller's origin", { tag: "@regression" }, async ({ api }) => {
    const response = await api.raw().get("/api/health", { headers: { Origin: androidOrigin } });

    expect(response.headers()["access-control-allow-origin"]).toBe(androidOrigin);
  });
});

test.describe("Routing", () => {
  test("the web app is served at /", { tag: "@smoke" }, async ({ api }) => {
    const response = await api.raw().get("/", { headers: { Accept: "text/html" } });

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('<div id="root">');
  });

  for (const page of ["/privacy.html", "/terms.html", "/delete-account.html"]) {
    test(`store listing page ${page} opens without JavaScript`, { tag: "@regression" }, async ({ api }) => {
      const response = await api.raw().get(page, { headers: { Accept: "text/html" } });

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("text/html");
      expect(await response.text()).not.toContain('<div id="root">');
    });
  }

  test(
    "an unknown /api route answers 404 JSON, not the web app",
    { tag: ["@negative", "@known-bug"] },
    async ({ api }) => {
      // Known bug (production build only): unknown /api/* paths fall through to the SPA
      // catch-all and answer 200 with index.html. A client that expects JSON gets a parse
      // error instead of a 404. The dev server (Vite) happens to answer 404.
      test.fail();
      const response = await api.raw().get("/api/does-not-exist");

      expect(response.status()).toBe(404);
    },
  );

  test(
    "the poster proxy refuses hosts other than Trakt's",
    { tag: ["@negative", "@security"] },
    async ({ api }) => {
      const response = await api.raw().get("/api/poster/example.com/images/poster.webp");

      // Must never fetch from an arbitrary host (SSRF). Today it falls through to the
      // web app (same bug as above); what matters here is that no image comes back.
      expect(response.headers()["content-type"] ?? "").not.toContain("image/");
    },
  );

  test("the poster proxy refuses path traversal", { tag: ["@negative", "@security"] }, async ({ api }) => {
    const response = await api.raw().get("/api/poster/walter-r2.trakt.tv/images/..%2F..%2Fetc%2Fpasswd.webp");

    expect(response.headers()["content-type"] ?? "").not.toContain("image/");
    expect(await response.text()).not.toContain("root:");
  });
});
