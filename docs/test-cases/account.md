# Account and history

## TC-ACC-01 · Email one-time-code sign-in refuses bad input · P1

| Input                                          | Expected                                            |
| ---------------------------------------------- | --------------------------------------------------- |
| Invalid email (empty, no @, no domain, spaces) | 400 `invalid_email`                                 |
| Code not 6 digits (5, 7, letters, space)       | 400 `invalid_code_format`                           |
| A code nobody requested                        | 400 `not_found`, no token in the body               |
| Second code request within 45 s                | 429 `resend_cooldown` with `retryAfterSeconds` ≤ 45 |
| Email sending not configured on the server     | 501 `email_auth_not_configured`, a readable message |

Auto: `tests/api/email-auth.spec.ts` (cooldown runs only where email sending is configured)

## Checklist

| ID        | Check                                                                                           | P   | Auto                              |
| --------- | ----------------------------------------------------------------------------------------------- | --- | --------------------------------- |
| TC-ACC-02 | First launch signs in anonymously; no prompt                                                    | P1  | manual                            |
| TC-ACC-03 | Google sign-in links the anonymous user: today's usage and history stay                         | P1  | manual (Google blocks automation) |
| TC-ACC-04 | Email code: wrong code 5 times → "Too many attempts", new code needed                           | P2  | manual                            |
| TC-ACC-05 | Expired code (10 min) → "That code expired"                                                     | P3  | manual                            |
| TC-ACC-06 | History needs an account: History for an anonymous user opens sign-in                           | P1  | manual                            |
| TC-ACC-07 | History syncs between two signed-in devices without re-signing in                               | P2  | manual                            |
| TC-ACC-08 | A brand-new account starts with empty history (not this device's anonymous history from before) | P1  | manual                            |
| TC-ACC-09 | 25+ history items: oldest drop, thumbnails stay small, no storage error                         | P2  | manual                            |
| TC-ACC-10 | Delete account: data gone, signed out, device no longer locked to sign in                       | P1  | manual                            |
| TC-ACC-11 | `/delete-account.html`, `/privacy.html`, `/terms.html` open without JavaScript                  | P1  | `cors-and-routing.spec.ts`        |
