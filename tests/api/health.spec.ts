import { test, expect } from "@fixtures/test";
import { healthSchema } from "@schemas/catalog";

test.describe("GET /api/health", () => {
  test("answers ok with the configuration flags", { tag: ["@smoke", "@api"] }, async ({ api }) => {
    const response = await api.health();

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    healthSchema.parse(await response.json());
  });

  test("exposes no secret values, only booleans", { tag: "@regression" }, async ({ api }) => {
    const { status, ...flags } = (await (await api.health()).json()) as Record<string, unknown>;

    expect(status).toBe("ok");
    for (const [key, value] of Object.entries(flags)) {
      expect(typeof value, `${key} must be a flag`).toBe("boolean");
    }
  });
});
