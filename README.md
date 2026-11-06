# Bachyl QA

[![PR checks](https://github.com/hkeper/bachyl-qa/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/hkeper/bachyl-qa/actions/workflows/pr-checks.yml)

Test management and automated tests for **[Bachyl](https://play.google.com/store/apps/details?id=com.bachyl.app)**, an Android and web app that identifies a movie, series or anime from a single frame with AI.

The app's code is private; this repository is public and shows how its quality is planned, tested and tracked.

## What's here

|                   |                                                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Test strategy** | [What we test at which level, and why some things are deliberately manual](docs/test-strategy.md)                                                           |
| **Risk analysis** | [13 risks scored by likelihood × impact, each linked to its tests](docs/risk-analysis.md)                                                                   |
| **Test plan**     | [Release 1.4, the first public Play release](docs/test-plan.md)                                                                                             |
| **Test cases**    | [Detailed P1 cases and checklists by area](docs/test-cases/), linked to the automated tests                                                                 |
| **API tests**     | ~70 Playwright tests: response contracts (Zod), refusals and edge cases, CORS for the Android WebView, access control on quota / Pro / rewards              |
| **Web UI tests**  | ~30 Playwright tests with Page Objects: every result state, every server error, limit dialog, feedback, three languages, 320 px layout, accessibility (axe) |
| **AI quality**    | [How recognition accuracy is measured](docs/ai-quality.md): top-1/top-3, confident errors, calibration; the scoring code is unit-tested                     |
| **Bugs**          | Found by these tests or in production, filed as [issues](https://github.com/hkeper/bachyl-qa/issues?q=label%3A%22type%3A+bug%22)                            |

## How the tests stay cheap and stable

- **No paid AI calls.** The server under test runs in demo mode (no AI key), which returns a fixed answer. Accuracy is measured separately, on a budget, on a fixed dataset.
- **The AI answer is mocked in UI tests**, so a test asks for exactly the state it checks ("a 55% answer with two candidates") and fails only when the UI is wrong.
- **Contracts are shared.** Mocks are typed by the same Zod schemas the API tests validate real responses against, so a mock can't silently drift from the real API.
- **Known bugs are executable.** A bug a test reproduces is marked `test.fail()` and tagged `@known-bug`; the test turns red when the bug is fixed.
- **No copyrighted frames.** Test images are generated in code; titles in mocks are made up.

## Stack

TypeScript (strict) · Playwright · Zod · axe-core · ESLint (typescript-eslint strict + eslint-plugin-playwright) · Prettier · GitHub Actions

```
docs/              strategy, risks, plan, test cases, AI quality
src/api-client/    typed client for the Bachyl API
src/schemas/       Zod contracts of the API responses
src/pages/         Page Objects
src/fixtures/      Playwright fixtures and network mocks
src/data/          generated images, result and error factories
src/ai-eval/       accuracy metrics for the nightly evaluation
tests/api/         API tests
tests/web/         browser tests
tests/ai-eval/     unit tests of the metrics, dataset manifest example
tests/mobile/      Android E2E (planned)
```

## Running the tests

Requires Node.js 22 and a running Bachyl server in demo mode (the app's private Docker image, or its source with `NODE_ENV=production npm start` and no `GEMINI_API_KEY`).

```bash
npm ci
npx playwright install chromium
cp .env.example .env          # BASE_URL=http://localhost:3000

npm run test:unit             # metrics, no server needed
npm run test:api
npm run test:web              # Chromium
npm run test:web:all          # Chromium, Firefox, WebKit, Pixel 7
npm run test:smoke            # @smoke only
npm run report                # open the HTML report
```

Tags: `@smoke`, `@regression`, `@negative`, `@security`, `@monetization`, `@i18n`, `@layout`, `@a11y`, `@known-bug`.

## CI

| Workflow         | When                                               | What                                                                   |
| ---------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `pr-checks.yml`  | every PR and push to `main`                        | format, lint, types, unit tests; API + web smoke against the app image |
| `regression.yml` | a new app build (`repository_dispatch`) or by hand | full suite, 5 projects in parallel                                     |
| `repo-setup.yml` | change to labels / milestones                      | syncs labels and sprint milestones                                     |

**CI and the private app.** The browser and API jobs start the app from a private image in GitHub Container Registry, in demo mode. They run once the repository variable `BACHYL_IMAGE` and the secret `GHCR_TOKEN` (a token with `read:packages` only) are set; until then only the static checks run.

## Project management

Work is tracked in [issues](https://github.com/hkeper/bachyl-qa/issues) with forms for bugs, test tasks and tasks, labels for type / severity / priority / area, and one milestone per sprint. Every change goes through a pull request.

## License

[MIT](LICENSE)
