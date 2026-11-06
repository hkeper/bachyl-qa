import type { Page, Request } from "@playwright/test";
import type { RecognitionResult } from "@schemas/recognition";

type MockAnswer = { status: number; body: unknown };

/**
 * Mocks for the browser tests. Only the endpoints that would cost money or
 * depend on an AI answer are replaced; everything else hits the real server.
 * Each mock records the requests it received, so a test can assert on what
 * the app sent (locale, platform, verdict) and not only on what it shows.
 */
export class ScanMock {
  readonly requests: Record<string, unknown>[] = [];
  private queue: MockAnswer[] = [];

  constructor(private readonly page: Page) {}

  async install(): Promise<void> {
    await this.page.route("**/api/identify-frame", async (route) => {
      this.requests.push(parseJson(route.request()));
      const next = this.queue.length > 1 ? this.queue.shift() : this.queue[0];
      if (!next) throw new Error("ScanMock: no answer queued. Call answer() or fail() first.");
      await route.fulfill({
        status: next.status,
        contentType: "application/json",
        body: JSON.stringify(next.body),
      });
    });
  }

  /** The next scan returns this result (and every later one, until another is queued). */
  answer(result: RecognitionResult): this {
    this.queue.push({ status: 200, body: result });
    return this;
  }

  fail(error: { status: number; body: unknown }): this {
    this.queue.push({ status: error.status, body: error.body });
    return this;
  }
}

export class FeedbackMock {
  readonly requests: Record<string, unknown>[] = [];

  constructor(private readonly page: Page) {}

  async install(): Promise<void> {
    await this.page.route("**/api/feedback", async (route) => {
      this.requests.push(parseJson(route.request()));
      await route.fulfill({ json: { success: true, stored: true } });
    });
  }
}

/**
 * Third-party hosts (fonts, poster CDNs, analytics) are cut off in UI tests:
 * a slow CDN must not fail a test about our own UI, and CI must not depend on it.
 */
export async function blockThirdParty(page: Page, baseURL: string): Promise<void> {
  const ownHost = new URL(baseURL).host;
  await page.route(
    (url) => url.host !== ownHost,
    (route) => route.abort(),
  );
}

function parseJson(request: Request): Record<string, unknown> {
  try {
    return (request.postDataJSON() as Record<string, unknown> | null) ?? {};
  } catch {
    return {};
  }
}
