import type { Locator, Page } from "@playwright/test";

export type LanguageName = "English" | "Беларуская" | "Русский";

export class Header {
  readonly languageButton: Locator;
  readonly historyButton: Locator;
  readonly brand: Locator;

  constructor(private readonly page: Page) {
    this.languageButton = page.locator("#header-language-toggle-btn");
    this.historyButton = page.locator("#header-history-btn");
    this.brand = page.getByRole("banner").getByText("Bachyl", { exact: true });
  }

  async switchLanguage(language: LanguageName): Promise<void> {
    await this.languageButton.click();
    await this.page.getByRole("listbox").getByRole("option", { name: language }).click();
  }

  async openHistory(): Promise<void> {
    await this.historyButton.click();
  }
}
