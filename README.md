# Smart Campus Room Availability Checker — Practice 12

Two implementations check a fictional Study Room A101 for a future interval without making a reservation. This repository contains the React/Vite source, tests, [report](Practice_12_Sebelev_David.docx), and [evidence screenshots](evidence/).

## Run the React version

Use Node.js 20+ and npm:

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run dev
```

Open the local URL printed by Vite. `src/practice12.ts` contains the Practice 12 availability logic; `src/practice12.test.ts` contains the shared T1–T8 cases. The full suite passed 121/121 checks on 26 November 2026. The earlier Practice 11 explanation feature remains in this application and uses a local mock, not a live AI API.

## Appsmith version

The [deployed Appsmith checker](https://app.appsmith.com/app/smart-campus-room-checker-practice-12/page1-6b080721ac6b328c4f872bf6) uses DatePicker, number input, switch, result text, and `JSObject1.check`. Its `JSObject1.testCases()` returned `pass: true` for T1–T8. Screenshots are in `evidence/`.

The Appsmith application has **Make application public** enabled, as shown in [the access screenshot](evidence/appsmith-public-access.png). Check the link from a signed-out browser before submission. Appsmith reported a successful export, but its downloaded JSON has not been added to this repository. A running React screenshot is also still pending. See the report for the shared requirements, test table, comparison, security review, and limitations.
