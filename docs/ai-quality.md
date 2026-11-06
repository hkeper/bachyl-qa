# AI quality evaluation

The recognition answer is not deterministic and costs money, so it isn't checked by pass/fail tests in the PR pipeline. It is measured on a fixed dataset, on a schedule, and tracked as a trend.

## Dataset

40–60 frames with known answers: title, year, IMDb id, type (movie / series / anime), difficulty (easy / medium / hard), source (screenshot or photo of a screen). Frames the app got wrong before (user feedback "Not it") are the most valuable ones.

The frames are copyrighted, so they stay in private storage. This repository holds only the manifest of expected answers ([example](../tests/ai-eval/dataset.example.json)).

## Metrics

| Metric                      | Why                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Top-1 accuracy**          | The answer the user sees first                                                                                                                                      |
| **Top-3 accuracy**          | The answer plus the first two candidates: what a user can still find on the result screen                                                                           |
| **Confident-error rate**    | Wrong answers at 75%+ confidence. The most harmful case: the user believes it. Watched separately from accuracy, because accuracy can improve while this gets worse |
| **Calibration error (ECE)** | Whether "80% sure" is right about 80% of the time. The app decides what to show from confidence, so it has to mean something                                        |
| **Latency p50 / p95**       | Users leave a slow scan; p95 shows the tail that averages hide                                                                                                      |
| **By type and difficulty**  | Anime and hard frames behave differently; an overall number can hide a drop in one group                                                                            |

Matching ignores case, accents, punctuation and a leading article, accepts the original title and aliases, and allows the year to be off by one (festival vs. release year, a series' first season).

The scoring code is in [`src/ai-eval/metrics.ts`](../src/ai-eval/metrics.ts) and is unit-tested on hand-made cases ([`tests/ai-eval/metrics.spec.ts`](../tests/ai-eval/metrics.spec.ts)): a metric computed wrong is worse than none.

## Regression rule

The nightly run turns red, and opens an issue, when top-1 drops more than 5 percentage points below the baseline. A smaller dataset makes this noisy: with 50 frames, one frame is 2 points, so the threshold is three frames.

## Cost control

- A separate API key with its own quota, never the production key
- Nightly and manual runs only, never on a PR
- At 2–5 cents a scan, 50 frames a night is about $1–2.50

## Limitations

- 50 frames are a sample, not the user population; the dataset leans to frames that were hard before.
- The models behind the app change without notice; the trend shows that, it doesn't explain it.
