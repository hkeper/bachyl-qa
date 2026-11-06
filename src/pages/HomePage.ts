import type { Locator, Page } from "@playwright/test";

type FilePayload = { name: string; mimeType: string; buffer: Buffer };

export class HomePage {
  readonly heading: Locator;
  readonly fileInput: Locator;
  readonly identifyButton: Locator;
  readonly liveCameraTab: Locator;
  readonly hintInput: Locator;
  readonly errorMessage: Locator;
  readonly trendingHeading: Locator;
  readonly quizCard: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { level: 1 });
    // The input is visually hidden behind the drop zone; setInputFiles works on it directly.
    this.fileInput = page.locator('input[type="file"]').first();
    this.identifyButton = page.getByRole("button", { name: /Identify Movie \/ Show|Определить|Вызначыць/ });
    this.liveCameraTab = page.getByRole("button", { name: /Live Camera/ });
    this.hintInput = page.getByPlaceholder(/hint|подсказ/i);
    this.errorMessage = page.getByText(
      /high traffic|inappropriate content|Too many searches|Couldn't verify|Recognition error/,
    );
    this.trendingHeading = page.getByRole("heading", { name: /Trending|В тренде|У трэндзе/ });
    this.quizCard = page.locator("#home-quiz-card");
  }

  async open(): Promise<void> {
    await this.page.goto("/");
    await this.heading.waitFor();
  }

  async chooseFrame(file: FilePayload): Promise<void> {
    await this.fileInput.setInputFiles(file);
  }

  /** Upload a frame and start a scan. The scan's answer comes from whatever mock the test queued. */
  async identify(file: FilePayload): Promise<void> {
    await this.chooseFrame(file);
    await this.identifyButton.click();
  }
}
