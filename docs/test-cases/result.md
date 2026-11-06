# Result

## TC-RES-01 · An unsure answer (< 75%) is labelled and offers candidates · P1

| #   | Step                                                           | Expected                                                                      |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Get an answer at 55% with two alternates                       | "Not sure · 55%", "Most likely" above the title                               |
| 2   | Look under the title                                           | "Or it might be:" with each candidate, its year and %, Trailer and IMDb links |
| 3   | Tap "That's it" on a candidate (when the answer has a scan id) | Feedback is sent as "Not it" with that title as the correction                |

Auto: `tests/web/scan-result.spec.ts` › below 75%…

## TC-RES-02 · Feedback reaches the server once · P1

| #   | Step                                                  | Expected                                                                                          |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | On a result with a scan id, tap "Correct"             | "Thanks!" replaces the buttons; one `POST /api/feedback` with this scan id and `verdict: correct` |
| 2   | On another result, tap "Not it", type a title, "Send" | One request with `verdict: wrong` and the typed `correction`                                      |
| 3   | Reopen either result from History                     | The buttons don't ask again                                                                       |
| 4   | A demo answer (no scan id)                            | No feedback block at all                                                                          |

Auto: `tests/web/feedback.spec.ts` (steps 1, 2, 4); step 3 manual.

## Checklist

| ID        | Check                                                                                                                | P   | Auto                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------- | --- | -------------------------------------------------- |
| TC-RES-03 | Unrecognized frame: "Unknown Match", no %, "Suggest the title"                                                       | P1  | `scan-result.spec.ts` › an unrecognized frame      |
| TC-RES-04 | Anime: native title shown under the English one                                                                      | P2  | `scan-result.spec.ts` › an anime answer            |
| TC-RES-05 | "Search again" returns to an empty home screen                                                                       | P2  | `scan-result.spec.ts` › 'Search again'             |
| TC-RES-06 | Alternates are always below the main answer's confidence                                                             | P2  | `identify-frame.spec.ts` › keeps alternates below… |
| TC-RES-07 | IMDb link opens the title page when an id is known, a search otherwise                                               | P2  | manual                                             |
| TC-RES-08 | Share result: a 1080×1350 card with frame, %, title; system share sheet on Android, Web Share or download on desktop | P2  | manual                                             |
| TC-RES-09 | Unsure result for a free user offers deep search ("with Pro" / "watch an ad")                                        | P1  | manual                                             |
| TC-RES-10 | Pro escalation: first answer shown with "Searching more precisely…", replaced in place by the final one              | P2  | manual                                             |
| TC-RES-11 | TheTVDB credit shown on results that came from TheTVDB                                                               | P3  | manual                                             |
