# Scan

## TC-SCAN-01 · Upload a frame and get a confident answer · P1

**Precondition:** home screen, free user with searches left.

| #   | Step                                  | Expected                                                                            |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | Tap "Upload Image" and pick a JPG/PNG | The preview appears; "Identify Movie / Show" is enabled                             |
| 2   | Tap "Identify Movie / Show"           | Progress steps appear (looking at the frame, searching, checking the database)      |
| 3   | Wait for the answer (90%+)            | Result screen: title, year, director/studio, type, "NN% match"; no "Not sure" label |
| 4   | Check the request (devtools / proxy)  | Body has the image as base64, `locale` = UI language, the hint if typed             |

Auto: `tests/web/scan-result.spec.ts` › a confident answer…, the app sends the image…, the hint…

## TC-SCAN-02 · Every server error ends with a message and a retry · P1

For each response: 503 `ai_overloaded`, 400 `unsafe_content`, 429 `ip_limit`, 401 `auth_required`, 500 with no code.

| #   | Step                                                | Expected                                                                                                                   |
| --- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | Upload a frame and start a scan that fails as above | The app stays on the home screen                                                                                           |
| 2   | Read the message                                    | A translated sentence for the code (generic "Recognition error (code 500)" for an unknown one), no stack trace or raw JSON |
| 3   | Tap "Identify" again                                | The frame is still selected and the button is enabled                                                                      |

Auto: `tests/web/scan-result.spec.ts` › errors stay on the home screen…

## TC-SCAN-03 · The server refuses bad input without a crash · P1

| Input                                         | Expected               |
| --------------------------------------------- | ---------------------- |
| No image / empty string                       | 400 with `error`       |
| Body not JSON                                 | 400                    |
| Body above 25 MB                              | 413                    |
| Bytes that aren't an image, unknown mime type | Below 500 (no crash)   |
| `mode: "deep"` without an account             | 403 `deep_not_allowed` |

Auto: `tests/api/identify-frame.spec.ts` › refusals

## Checklist

| ID         | Check                                                                                      | P   | Auto                                         |
| ---------- | ------------------------------------------------------------------------------------------ | --- | -------------------------------------------- |
| TC-SCAN-04 | Drag & drop an image onto the zone starts the same flow (desktop)                          | P2  | manual                                       |
| TC-SCAN-05 | Ctrl/Cmd+V pastes an image from the clipboard and shows "Pasted from clipboard"            | P2  | manual                                       |
| TC-SCAN-06 | A non-image file is refused before upload                                                  | P2  | manual                                       |
| TC-SCAN-07 | A 4000 px phone photo is downscaled before upload (request < 2 MB)                         | P2  | manual                                       |
| TC-SCAN-08 | Live camera on the web: permission granted → viewfinder; denied → instruction to re-enable | P2  | manual                                       |
| TC-SCAN-09 | Streamed progress: NDJSON stages, exactly one final line, early refusals stay plain JSON   | P1  | `identify-frame.spec.ts` › streamed progress |
| TC-SCAN-10 | Starting a second scan while one runs is refused with "A search is already running"        | P2  | manual                                       |
| TC-SCAN-11 | The progress sheet can be minimised; a finished scan waits as "Result ready · Open"        | P2  | manual                                       |
| TC-SCAN-12 | No network: a translated "no connection" message, not "Failed to fetch"                    | P1  | manual                                       |
