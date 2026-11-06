import { test as base, expect } from "@playwright/test";
import { BachylApi } from "@api/BachylApi";
import { FeedbackMock, ScanMock, blockThirdParty } from "./mocks";
import { HomePage } from "@pages/HomePage";
import { ResultPage } from "@pages/ResultPage";
import { Header } from "@pages/Header";

interface Fixtures {
  api: BachylApi;
  scan: ScanMock;
  feedback: FeedbackMock;
  home: HomePage;
  result: ResultPage;
  header: Header;
}

/**
 * One `test` for the whole suite. Page objects and mocks arrive as fixtures,
 * so a test states only what is particular to it.
 */
export const test = base.extend<Fixtures>({
  api: async ({ request }, use) => {
    await use(new BachylApi(request));
  },
  page: async ({ page, baseURL }, use) => {
    await blockThirdParty(page, baseURL ?? "http://localhost:3000");
    await use(page);
  },
  scan: async ({ page }, use) => {
    const mock = new ScanMock(page);
    await mock.install();
    await use(mock);
  },
  feedback: async ({ page }, use) => {
    const mock = new FeedbackMock(page);
    await mock.install();
    await use(mock);
  },
  home: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  result: async ({ page }, use) => {
    await use(new ResultPage(page));
  },
  header: async ({ page }, use) => {
    await use(new Header(page));
  },
});

export { expect };
