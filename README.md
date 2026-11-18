# SchoolOS

A school planner for iOS and Android that replaces the "Semesterheft": timetable, homework, exams and grades in one app.

## Tech stack

- [Expo](https://expo.dev) SDK 58 with React Native and TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) with native tabs
- [`@expo/ui`](https://docs.expo.dev/versions/v58.0.0/sdk/ui/) for native controls (SwiftUI and Jetpack Compose)
- `expo-sqlite` with [Drizzle ORM](https://orm.drizzle.team) for local storage
- `expo-notifications` for local reminders (planned on the device, no push server)
- [bun](https://bun.sh) as package manager, ESLint and Prettier for code quality

## Getting started

Requirements: [bun](https://bun.sh), [Node.js](https://nodejs.org) LTS (EAS CLI runs the project's Expo CLI with `node`, even when installed with bun) and a device or simulator with a development build of the app.

```bash
bun install
bun start
```

| Command               | Purpose                                                |
| --------------------- | ------------------------------------------------------ |
| `bun start`           | Start the Metro dev server                             |
| `bun run lint`        | Lint with ESLint and Prettier                          |
| `bun run typecheck`   | Type-check with TypeScript                             |
| `bun run format`      | Format all files with Prettier                         |
| `bun run db:generate` | Generate a migration after changing `src/db/schema.ts` |

## Releases

A release starts on GitHub: draft a new release with a new tag of the form `vX.Y.Z` (e.g. `v1.3.0`), write what changed for the testers, untick "Set as the latest release", then publish it. Publishing creates the tag, which runs `.eas/workflows/release.yml`:

- it reads the text of the release and stops if there is none,
- builds iOS and uploads it to App Store Connect; once Apple reports the upload as complete, `.eas/workflows/testflight-notes.yml` sets the text of the release as "What to Test" (adding the build to the external TestFlight group stays a step in App Store Connect),
- builds the Android APK, attaches it to the release as `SchoolOS.apk` and only then makes the release the latest one (unless a newer release already is).

`schoolos.jarox.dev/apk` downloads the `SchoolOS.apk` of the latest release, so it keeps the previous APK until the new one is attached, or for good if the Android build fails. A release published with "Set as the latest release" ticked has no APK until its build is done: `/apk` fails in the meantime.

The tag becomes the app version, so only plain `vX.Y.Z` tags give a valid release; suffixes like `-beta` do not. Attaching the APK needs the Expo environment variable `GITHUB_RELEASE_TOKEN` (production, secret): a fine-grained GitHub token for this repository with "Contents: Read and write".

JavaScript-only changes can ship as an OTA update (`.eas/workflows/update.yml`). Adding or upgrading a native module needs a new tag and build instead, since an update cannot change native code.

## Tester pages

`landing/` is a separate [Astro](https://astro.build) project with the static pages at [schoolos.jarox.dev](https://schoolos.jarox.dev).

```bash
cd landing
bun install
bun run dev     # http://localhost:4321
bun run build   # static site in landing/dist
bun run check   # type-check the Astro files
```

It is deployed as the Cloudflare Worker `schoolos-landing` (static assets, config in `landing/wrangler.jsonc`). Workers Builds builds and deploys every push to `master`. The redirects `/beta` (TestFlight) and `/apk` and `/android` (the `SchoolOS.apk` of the latest GitHub release) are Cloudflare Redirect Rules on the `jarox.dev` zone, not part of this project.
