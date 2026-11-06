import { test, expect } from "@fixtures/test";
import { apiErrorSchema } from "@schemas/recognition";

/**
 * Quota, Pro and rewarded ads are decided on the server only. Every gated
 * endpoint must refuse a caller without a valid Firebase ID token, whatever
 * the body claims.
 */
test.describe("Gated endpoints refuse anonymous callers", () => {
  test("GET /api/quota → 401 auth_required", { tag: ["@smoke", "@security"] }, async ({ api }) => {
    const response = await api.quota();

    expect(response.status()).toBe(401);
    expect(apiErrorSchema.parse(await response.json()).code).toBe("auth_required");
  });

  test("GET /api/quota with a forged token → 401", { tag: "@security" }, async ({ api }) => {
    const response = await api.withToken("forged.token.value").quota();

    expect(response.status()).toBe(401);
  });

  test("POST /api/pro/sync → 401 auth_required", { tag: "@security" }, async ({ api }) => {
    const response = await api.proSync();

    expect(response.status()).toBe(401);
    expect(apiErrorSchema.parse(await response.json()).code).toBe("auth_required");
  });

  test("POST /api/rewarded/claim → 401 auth_required", { tag: "@security" }, async ({ api }) => {
    const response = await api.rewardedClaim("standard3");

    expect(response.status()).toBe(401);
  });

  test(
    "RevenueCat webhook without its secret → 401",
    { tag: ["@security", "@monetization"] },
    async ({ api }) => {
      const fakeRenewal = { event: { id: "evt_qa", type: "RENEWAL", app_user_id: "someone-else" } };

      expect((await api.revenueCatWebhook(fakeRenewal)).status()).toBe(401);
      expect((await api.revenueCatWebhook(fakeRenewal, "Bearer wrong")).status()).toBe(401);
    },
  );

  test(
    "AdMob SSV callback: an empty query passes the console's URL check",
    { tag: "@regression" },
    async ({ api }) => {
      const response = await api.rewardedSsv();

      expect(response.status()).toBe(200);
    },
  );

  test(
    "AdMob SSV callback: an unsigned reward is rejected",
    { tag: ["@security", "@monetization"] },
    async ({ api }) => {
      const response = await api.rewardedSsv("user_id=someone&custom_data=deep1&transaction_id=qa1");

      expect(response.status()).toBe(400);
    },
  );
});
