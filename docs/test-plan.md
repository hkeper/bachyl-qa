# Test plan: release 1.4 (first public Play release)

Version under test: Android 1.4.17 (versionCode 26) and the matching web build · Period: November 2026

## Scope

**In scope**

| Area                | What changed in 1.4                                               | Test types                                                                  |
| ------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Quota on the server | Free 5/day, Pro 30/day + 300/month, reserve and refund per search | API (access control, refusals), UI (limit dialog), manual                   |
| Two search tiers    | Standard (one model) and deep (escalation + web search)           | API (deep without account refused), UI (unsure → deep offer), AI evaluation |
| Pro subscription    | Google Play via RevenueCat, Paddle on the web                     | API (webhook auth), manual purchase/restore/cancel                          |
| Rewarded ads        | +3 standard or +1 deep, max 3 videos a day                        | API (claim needs sign-in, unsigned callback refused), manual on device      |
| Streaming progress  | NDJSON stages while a scan runs                                   | API (format, final line, early refusals stay JSON)                          |
| Result candidates   | Alternates shown under an unsure answer                           | UI                                                                          |
| Quiz                | Daily challenge and Streak with leaderboards                      | Manual checklist; API tests planned                                         |
| Localization        | English, Russian, Belarusian                                      | UI (detection, switch, raw keys, 320 px)                                    |

**Out of scope:** recognition quality per frame (covered by the evaluation, not by pass/fail tests), store listing copy, backend load testing.

## Approach

See [test-strategy.md](test-strategy.md). Priorities come from [risk-analysis.md](risk-analysis.md): R1–R6 first.

## Schedule

| Week | Work                                                                                |
| ---- | ----------------------------------------------------------------------------------- |
| 1    | Test documentation, framework, API and web suites (this repository's first version) |
| 2    | CI on every PR; private app image + Firebase Emulator so CI runs the real server    |
| 3    | Nightly AI evaluation on a 40–60 frame dataset                                      |
| 4–5  | Android E2E on an emulator                                                          |

## Environments and data

Local demo-mode server for API and UI tests; a real phone (Android 14 and 15) for the manual checklist; generated images and made-up titles only.

## Deliverables

- Test cases in [test-cases/](test-cases/) with links to the automated tests
- Bug reports as GitHub issues
- CI report per run; a short release summary in the release PR

## Exit criteria

As in [test-strategy.md §5](test-strategy.md#5-entry-and-exit-criteria).

## Risks to the plan

- CI can't run the private server until the image and access token are set up: until then, the suites run locally before each release.
- The evaluation dataset needs frames the app got wrong before; collecting them takes time from real feedback.
