# Android (native parts)

Run on a real phone before each release: one on Android 15 (edge-to-edge) and one on 14 or older. Emulator automation is planned with Appium (see `tests/mobile`).

| ID        | Check                                                                                                | P   |
| --------- | ---------------------------------------------------------------------------------------------------- | --- |
| TC-AND-01 | Cold start: no white flash; dark background from the first frame                                     | P1  |
| TC-AND-02 | Upload a photo: the native photo picker opens; a 4000 px photo doesn't freeze the screen             | P1  |
| TC-AND-03 | Share an image from Google Photos to Bachyl (app closed): the app opens and scans it                 | P1  |
| TC-AND-04 | Same with the app already open in the background                                                     | P1  |
| TC-AND-05 | Camera permission: grant → camera; deny forever → instruction to enable it in Settings               | P1  |
| TC-AND-06 | Share result: the system share sheet with the card image and a Play link                             | P2  |
| TC-AND-07 | Back button: result → home → app exits; modals close first                                           | P2  |
| TC-AND-08 | Rotate during a scan: the scan isn't lost                                                            | P2  |
| TC-AND-09 | Airplane mode: a translated "no connection" message                                                  | P1  |
| TC-AND-10 | Light-mode phone with 3-button navigation: no light bar under the app                                | P3  |
| TC-AND-11 | Interstitial ad only when leaving the 5th/10th result of the day, never during a scan; never for Pro | P1  |
| TC-AND-12 | EEA consent form appears before the first ad (debug geography EEA)                                   | P1  |
| TC-AND-13 | In-app review prompt after the 2nd "Correct", at most once per 60 days                               | P3  |
| TC-AND-14 | Crash reporting: a forced JS error appears in Crashlytics as non-fatal                               | P3  |
