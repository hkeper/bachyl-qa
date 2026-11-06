# Languages and layout

## TC-I18N-01 · Language follows the device, a choice overrides it · P1

| #   | Step                                         | Expected                      |
| --- | -------------------------------------------- | ----------------------------- |
| 1   | Open with the browser/phone in Russian       | Russian UI, header shows RU   |
| 2   | Open with an unsupported language (Japanese) | English                       |
| 3   | Pick Беларуская in the header menu           | Belarusian UI, BE             |
| 4   | Reload                                       | Still Belarusian              |
| 5   | Look over the screen                         | No raw keys like `home.title` |

Auto: `tests/web/i18n.spec.ts`

## TC-LAY-01 · Every screen fits a 320 px phone in all three languages · P1

Nothing sticks out to the right except content inside a scroller (Trending) and decoration. Checked on the home and result screens (with a very long title and director) in EN, RU, BE.

Auto: `tests/web/layout.spec.ts`

## Checklist

| ID         | Check                                                              | P   | Auto                    |
| ---------- | ------------------------------------------------------------------ | --- | ----------------------- |
| TC-I18N-02 | Scan answers come in the UI language (genre, scene)                | P2  | manual                  |
| TC-I18N-03 | Dates in Belarusian use Belarusian month names, not Russian        | P2  | manual                  |
| TC-I18N-04 | Plural forms in Russian/Belarusian (1 поиск, 2 поиска, 5 поисков)  | P3  | manual                  |
| TC-LAY-02  | Header: "History" word hides below 420 px, brand word below 340 px | P3  | manual                  |
| TC-LAY-03  | Phone text size at maximum: buttons wrap, nothing cut to a stump   | P2  | manual                  |
| TC-A11Y-01 | No new serious axe violations on home and result screens           | P2  | `accessibility.spec.ts` |
