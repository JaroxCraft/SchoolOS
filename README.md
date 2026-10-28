# SchoolOS

A school planner for iOS and Android that replaces the "Semesterheft": timetable, homework, exams and grades in one app.

## Tech stack

- [Expo](https://expo.dev) SDK 58 with React Native and TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) with native tabs
- [`@expo/ui`](https://docs.expo.dev/versions/v58.0.0/sdk/ui/) for native controls (SwiftUI and Jetpack Compose)
- `expo-sqlite` with [Drizzle ORM](https://orm.drizzle.team) for local storage
- `expo-notifications` for local notifications (planned)
- [bun](https://bun.sh) as package manager, ESLint and Prettier for code quality

## Getting started

Requirements: [bun](https://bun.sh) and a device or simulator with a development build of the app.

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
