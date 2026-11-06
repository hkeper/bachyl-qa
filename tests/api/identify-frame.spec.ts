import { test, expect } from "@fixtures/test";
import { apiErrorSchema, recognitionResultSchema, scanStreamLineSchema } from "@schemas/recognition";
import { frames } from "@data/frames";

/**
 * The suite runs against a server in demo mode (no GEMINI_API_KEY): a scan
 * returns a fixed answer and costs nothing. These tests check the contract
 * and the refusals, not whether the AI is right (see tests/ai-eval).
 */
test.describe("POST /api/identify-frame", () => {
  test("returns a result that matches the contract", { tag: ["@smoke", "@api"] }, async ({ api }) => {
    const response = await api.identifyFrame({ imageBase64: frames.pngBase64(), mimeType: "image/png" });

    expect(response.status()).toBe(200);
    const result = recognitionResultSchema.parse(await response.json());
    expect(result.recognized).toBe(true);
    expect(result.tier).toBe("standard");
  });

  test("accepts a data: URL as well as bare base64", { tag: "@regression" }, async ({ api }) => {
    const response = await api.identifyFrame({ imageBase64: frames.pngDataUrl(1) });

    expect(response.status()).toBe(200);
    recognitionResultSchema.parse(await response.json());
  });

  test("marks a demo answer as demo and gives it no scan id", { tag: "@regression" }, async ({ api }) => {
    const health = (await (await api.health()).json()) as { hasApiKey: boolean };
    test.skip(health.hasApiKey, "Only meaningful against a server in demo mode");

    const result = recognitionResultSchema.parse(
      await (await api.identifyFrame({ imageBase64: frames.pngBase64(2) })).json(),
    );

    // No scan id means no feedback buttons: demo answers must never reach the scan log.
    expect(result.isDemo).toBe(true);
    expect(result.scan_id).toBeUndefined();
  });

  test("keeps alternates below the main answer", { tag: "@regression" }, async ({ api }) => {
    const result = recognitionResultSchema.parse(
      await (await api.identifyFrame({ imageBase64: frames.pngBase64(3), locale: "en" })).json(),
    );

    for (const alternate of result.alternates ?? []) {
      expect(alternate.confidence ?? 0).toBeLessThan(result.confidence);
    }
  });

  test.describe("refusals", () => {
    test("400 when the image is missing", { tag: ["@smoke", "@negative"] }, async ({ api }) => {
      const response = await api.identifyFrame({ mimeType: "image/png" });

      expect(response.status()).toBe(400);
      apiErrorSchema.parse(await response.json());
    });

    test("400 when the image is an empty string", { tag: "@negative" }, async ({ api }) => {
      const response = await api.identifyFrame({ imageBase64: "" });

      expect(response.status()).toBe(400);
    });

    test("400 on a body that is not JSON", { tag: "@negative" }, async ({ api }) => {
      const response = await api.raw().post("/api/identify-frame", {
        headers: { "Content-Type": "application/json" },
        data: "{not json",
      });

      expect(response.status()).toBe(400);
    });

    test("413 on a body above the 25 MB limit", { tag: "@negative" }, async ({ api }) => {
      const response = await api.identifyFrame({ imageBase64: "A".repeat(26 * 1024 * 1024) });

      expect(response.status()).toBe(413);
    });

    test(
      "403 for a deep search without an account",
      { tag: ["@negative", "@monetization"] },
      async ({ api }) => {
        const response = await api.identifyFrame({ imageBase64: frames.pngBase64(4), mode: "deep" });

        expect(response.status()).toBe(403);
        expect(apiErrorSchema.parse(await response.json()).code).toBe("deep_not_allowed");
      },
    );

    test("never answers 5xx to bytes that aren't an image", { tag: "@negative" }, async ({ api }) => {
      const response = await api.identifyFrame({
        imageBase64: frames.notAnImageBase64,
        mimeType: "image/png",
      });

      expect(response.status()).toBeLessThan(500);
    });

    test("never answers 5xx to an unknown mime type", { tag: "@negative" }, async ({ api }) => {
      const response = await api.identifyFrame({
        imageBase64: frames.pngBase64(5),
        mimeType: "application/x-msdownload",
      });

      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe("streamed progress (progress: true)", () => {
    test("sends NDJSON stages and ends with one final line", { tag: "@regression" }, async ({ api }) => {
      const response = await api.identifyFrame({ imageBase64: frames.pngBase64(6), progress: true });

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/x-ndjson");
      const lines = (await response.text())
        .split("\n")
        .filter(Boolean)
        .map((line) => scanStreamLineSchema.parse(JSON.parse(line)));

      expect(lines.length).toBeGreaterThan(1);
      expect(lines.filter((line) => line.type === "final")).toHaveLength(1);
      const final = lines.at(-1);
      expect(final).toMatchObject({ type: "final", status: 200 });
      recognitionResultSchema.parse((final as { body: unknown }).body);
    });

    test(
      "a refusal before the first stage stays plain JSON with its real status",
      { tag: "@negative" },
      async ({ api }) => {
        const response = await api.identifyFrame({ progress: true });

        expect(response.status()).toBe(400);
        expect(response.headers()["content-type"]).toContain("application/json");
      },
    );
  });
});
