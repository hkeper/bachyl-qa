import type { APIRequestContext, APIResponse } from "@playwright/test";

export interface IdentifyFrameRequest {
  imageBase64?: string;
  mimeType?: string;
  userHint?: string;
  locale?: string;
  platform?: string;
  mode?: "standard" | "deep";
  progress?: boolean;
}

export interface FeedbackRequest {
  scanId: string;
  verdict: "correct" | "wrong" | (string & {});
  correction?: string;
}

/**
 * Thin typed wrapper over Bachyl's HTTP API. Tests call these methods instead of
 * building URLs and bodies by hand, so an endpoint change is fixed in one place.
 * Methods return the raw APIResponse: asserting on status and body stays in the test.
 */
export class BachylApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly authToken?: string,
  ) {}

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}`, ...extra } : extra;
  }

  /** The same client with an Authorization header (any string: tests use it for invalid tokens too). */
  withToken(token: string): BachylApi {
    return new BachylApi(this.request, token);
  }

  health(): Promise<APIResponse> {
    return this.request.get("/api/health");
  }

  identifyFrame(body: IdentifyFrameRequest): Promise<APIResponse> {
    return this.request.post("/api/identify-frame", { data: body, headers: this.headers() });
  }

  feedback(body: FeedbackRequest | Record<string, unknown>): Promise<APIResponse> {
    return this.request.post("/api/feedback", { data: body, headers: this.headers() });
  }

  trending(params: { type?: "all" | "movie" | "tv"; locale?: string } = {}): Promise<APIResponse> {
    return this.request.get("/api/trending", { params: { ...params } });
  }

  metadata(params: {
    title?: string;
    year?: string | number;
    imdbId?: string;
    locale?: string;
  }): Promise<APIResponse> {
    const query: Record<string, string> = {};
    if (params.title !== undefined) query.title = params.title;
    if (params.year !== undefined) query.year = String(params.year);
    if (params.imdbId !== undefined) query.imdbId = params.imdbId;
    if (params.locale !== undefined) query.locale = params.locale;
    return this.request.get("/api/omdb", { params: query });
  }

  requestEmailCode(email: string): Promise<APIResponse> {
    return this.request.post("/api/auth/request-code", { data: { email } });
  }

  verifyEmailCode(email: string, code: string): Promise<APIResponse> {
    return this.request.post("/api/auth/verify-code", { data: { email, code }, headers: this.headers() });
  }

  quota(platform = "web"): Promise<APIResponse> {
    return this.request.get("/api/quota", { params: { platform }, headers: this.headers() });
  }

  proSync(): Promise<APIResponse> {
    return this.request.post("/api/pro/sync", { data: { platform: "web" }, headers: this.headers() });
  }

  rewardedClaim(reward: string): Promise<APIResponse> {
    return this.request.post("/api/rewarded/claim", {
      data: { reward, platform: "android" },
      headers: this.headers(),
    });
  }

  rewardedSsv(rawQuery = ""): Promise<APIResponse> {
    return this.request.get(`/api/rewarded/ssv${rawQuery ? `?${rawQuery}` : ""}`);
  }

  revenueCatWebhook(body: unknown, authorization?: string): Promise<APIResponse> {
    return this.request.post("/api/revenuecat-webhook", {
      data: body,
      headers: authorization ? { Authorization: authorization } : {},
    });
  }

  preflight(path: string, origin: string): Promise<APIResponse> {
    return this.request.fetch(path, {
      method: "OPTIONS",
      headers: { Origin: origin, "Access-Control-Request-Method": "POST" },
    });
  }

  raw(): APIRequestContext {
    return this.request;
  }
}
