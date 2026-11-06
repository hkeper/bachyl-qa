import { test, expect } from "@fixtures/test";
import { apiErrorSchema } from "@schemas/recognition";
import { emails } from "@data/users";

test.describe("Email one-time-code sign-in", () => {
  test.describe("POST /api/auth/request-code", () => {
    for (const email of emails.invalid) {
      test(`400 invalid_email for ${JSON.stringify(email)}`, { tag: "@negative" }, async ({ api }) => {
        const response = await api.requestEmailCode(email);

        expect(response.status()).toBe(400);
        expect(apiErrorSchema.parse(await response.json()).code).toBe("invalid_email");
      });
    }

    test(
      "without email sending configured, a valid address gets 501 and a clear code",
      { tag: "@regression" },
      async ({ api }) => {
        const health = (await (await api.health()).json()) as { hasEmailAuth: boolean };
        test.skip(health.hasEmailAuth, "The server under test sends real emails");

        const response = await api.requestEmailCode(emails.valid());

        // The client shows `error` to the user as is, so it must be a sentence, not a stack trace.
        expect(response.status()).toBe(501);
        expect(apiErrorSchema.parse(await response.json()).code).toBe("email_auth_not_configured");
      },
    );

    test(
      "a second request inside 45 s is refused with retryAfterSeconds",
      { tag: "@regression" },
      async ({ api }) => {
        const health = (await (await api.health()).json()) as { hasEmailAuth: boolean };
        test.skip(!health.hasEmailAuth, "Needs email sending configured on the server");

        const email = emails.valid("cooldown");
        expect((await api.requestEmailCode(email)).status()).toBe(200);
        const second = await api.requestEmailCode(email);

        expect(second.status()).toBe(429);
        const body = (await second.json()) as { code: string; retryAfterSeconds: number };
        expect(body.code).toBe("resend_cooldown");
        expect(body.retryAfterSeconds).toBeGreaterThan(0);
        expect(body.retryAfterSeconds).toBeLessThanOrEqual(45);
      },
    );
  });

  test.describe("POST /api/auth/verify-code", () => {
    const badCodes = ["", "12345", "1234567", "abcdef", "12 456"];
    for (const code of badCodes) {
      test(`400 invalid_code_format for ${JSON.stringify(code)}`, { tag: "@negative" }, async ({ api }) => {
        const response = await api.verifyEmailCode(emails.valid(), code);

        expect(response.status()).toBe(400);
        expect(apiErrorSchema.parse(await response.json()).code).toBe("invalid_code_format");
      });
    }

    test(
      "a code nobody requested is refused with not_found",
      { tag: ["@smoke", "@negative"] },
      async ({ api }) => {
        const response = await api.verifyEmailCode(emails.valid("never-requested"), "123456");

        expect(response.status()).toBe(400);
        const body = apiErrorSchema.parse(await response.json());
        expect(body.code).toBe("not_found");
        // The refusal must not hand out a token.
        expect(body).not.toHaveProperty("customToken");
      },
    );
  });
});
