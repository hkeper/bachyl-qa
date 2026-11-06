# Mobile tests (planned, Sprint 5)

Android smoke tests with **Appium 2 + WebdriverIO (TypeScript)** on an emulator in GitHub Actions. They cover only what the browser suites can't: native screens and intents.

| Scenario                                                                                                    | Context              |
| ----------------------------------------------------------------------------------------------------------- | -------------------- |
| Cold start with no white flash, home screen visible                                                         | WEBVIEW              |
| Pick a photo from the gallery (pushed with `adb push` beforehand)                                           | NATIVE_APP → WEBVIEW |
| "Share → Bachyl" from another app, cold and warm start (`adb shell am start -a android.intent.action.SEND`) | NATIVE_APP           |
| Camera permission: grant / deny                                                                             | NATIVE_APP           |
| "Share result" opens the system share sheet                                                                 | NATIVE_APP           |
| Back button, rotation, airplane mode                                                                        | both                 |

Needs a test APK from the private repository built with `VITE_API_BASE_URL=http://10.0.2.2:3000` (the emulator's address for the CI host) and Google's test ad units. Until then these scenarios are in the manual checklist: [docs/test-cases/android.md](../../docs/test-cases/android.md).
