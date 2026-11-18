This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Project context

SchoolOS is a school planner app built as a "Selbständige Projektarbeit" (SPA, school year 2026/27). Communicate in German.

- Planning, deadlines and school documents live in Trilium under "Schule & Lehre › Selbständige Projektarbeit (SchoolOS)" (noteId `uyKzXfOgdObK`). Read them via the Trilium connector before planning work; they are the source of truth.
- The app's spec sheet is the Trilium note "SchoolOS – Product Specification" (noteId `pbKcQMNPvn4N`). Keep it in sync with the app: whenever a change adds, removes or alters a feature, screen, data field or technical choice, update the spec sheet in the same task.
- Avoid duplicate information in Trilium: link to the note that owns a piece of information (e.g. the goals live in "Vereinbarung Projektarbeit", noteId `kKKz7CpJRN3G`) instead of copying it.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch <https://docs.expo.dev/llms.txt> — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: <https://docs.expo.dev/router/introduction.md>

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as the globally installed `eas <command>`, never through `bunx` or `npx`.
Docs: <https://docs.expo.dev/eas/index.md>

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: <https://docs.expo.dev/versions/latest/index.md>
- **Texts** the user sees or hears live in the catalog `src/i18n/de/` (one file per area) and are used as `t.<area>.<key>` from `@/i18n`. A text with values is a catalog function that owns the whole sentence; plurals use `countOf` from `@/i18n/plural` inside the catalog. ESLint flags literal texts in JSX and in text props.
