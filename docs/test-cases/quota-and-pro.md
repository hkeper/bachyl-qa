# Quota, deep search, Pro, rewarded ads

The server is the only authority on all of these. Most checks are API checks: the UI can't be trusted to enforce anything.

## TC-QUO-01 · Gated endpoints refuse a caller without a valid token · P1

| Endpoint                                       | No token                                            | Forged token |
| ---------------------------------------------- | --------------------------------------------------- | ------------ |
| `GET /api/quota`                               | 401 `auth_required`                                 | 401          |
| `POST /api/pro/sync`                           | 401 `auth_required`                                 | —            |
| `POST /api/rewarded/claim`                     | 401                                                 | —            |
| `POST /api/identify-frame` with `mode: deep`   | 403 `deep_not_allowed`                              | —            |
| `POST /api/revenuecat-webhook`                 | 401 without the shared secret, 401 with a wrong one | —            |
| `GET /api/rewarded/ssv` with an unsigned query | 400                                                 | —            |

Auto: `tests/api/access-control.spec.ts`, `identify-frame.spec.ts`

## TC-QUO-02 · Reaching the daily limit opens the limit dialog · P1

| #   | Step                                                                           | Expected                                                                                  |
| --- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 1   | Free user makes the 6th search of the day (server answers 429 `limit_reached`) | The limit dialog opens instead of an error message                                        |
| 2   | Read it                                                                        | "You've used all 5 free searches for today", offers: rewarded ad, Pro, invite, reset time |
| 3   | Close it                                                                       | Back on the home screen, usable                                                           |

Auto: `tests/web/limits.spec.ts`

## Checklist (manual, real device and test accounts)

| ID        | Check                                                                                                                               | P   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------- | --- |
| TC-QUO-03 | A failed scan (overload, unsafe image) gives the search back: the counter doesn't move                                              | P1  |
| TC-QUO-04 | Counter resets at UTC midnight; the dialog shows the local reset time                                                               | P2  |
| TC-QUO-05 | Rewarded ad: +3 standard or +1 deep, at most 3 videos a day, reward only after the ad completes                                     | P1  |
| TC-QUO-06 | Buy Pro (Play test card): Pro within seconds, 30/day                                                                                | P1  |
| TC-QUO-07 | Restore on a second device with the same account                                                                                    | P1  |
| TC-QUO-08 | Sign out → the Bachyl account loses Pro on this device; the Google account still has the subscription → "move my subscription here" | P1  |
| TC-QUO-09 | Cancel in Play: Pro stays until the period ends, then Free                                                                          | P2  |
| TC-QUO-10 | Web: Paddle checkout needs a signed-in account; Pro bought on the web works in the app                                              | P2  |
| TC-QUO-11 | The Android app never shows web prices or a web checkout link                                                                       | P1  |
| TC-QUO-12 | Signed-in user signs out: the device asks to sign in, it doesn't give anonymous free searches                                       | P1  |
