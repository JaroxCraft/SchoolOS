// Builds every app icon asset from one definition: Mon, Thu and Fri, periods 1–4 of the
// S3a timetable 2026/27, double lessons drawn as one block.
// Run with `bun run icons`. Validate the .icon package afterwards with the compose-app-icon skill.

import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { Resvg } from "@resvg/resvg-js";
import { PNG } from "pngjs";

const ROOT = join(import.meta.dirname, "..", "..");
const ICON_PACKAGE = join(ROOT, "assets", "schoolos.icon");
const IMAGES = join(ROOT, "assets", "images");
const EXPORT = join(import.meta.dirname, "export");
// Icons rendered by Apple (Liquid Glass), downloaded from App Store Connect; not generated here
const RENDERED = join(import.meta.dirname, "rendered");

const APP_STORE_ICON_SIZE = 1024;

// iOS system colors of the subjects, light and dark
const SUBJECTS = {
  deutsch: { light: "#007AFF", dark: "#0A84FF" },
  rzg: { light: "#FF2D55", dark: "#FF375F" },
  englisch: { light: "#AF52DE", dark: "#BF5AF2" },
  nt: { light: "#34C759", dark: "#30D158" },
} as const;
type Subject = keyof typeof SUBJECTS;

const FREE = { light: "#DFE3EA", dark: "#FFFFFF1F" };
// iOS renders the gradient itself (Icon Composer), so the icon keeps it there
const IOS_BACKGROUND = {
  light: ["#FFFFFF", "#E9EDF3"],
  dark: ["#2C2C2E", "#0B0B0C"],
} as const;
// The PNGs get a plain color: a subtle gradient shows visible bands as an 8-bit PNG on Android
const BACKGROUND = { light: "#F4F6F9", dark: "#1C1C1E" } as const;
type Mode = "light" | "dark";

const WEEKDAY_COLUMNS = 3;
const PERIOD_ROWS = 4;
const CELL_W = 184;
const CELL_H = 136;
const GAP = 32;
const RADIUS = 46;
const GRID_W = WEEKDAY_COLUMNS * CELL_W + (WEEKDAY_COLUMNS - 1) * GAP;
const GRID_H = PERIOD_ROWS * CELL_H + (PERIOD_ROWS - 1) * GAP;

type Block = { column: number; firstRow: number; rowCount: number };
const LESSONS: Record<Subject, Block[]> = {
  deutsch: [
    { column: 0, firstRow: 0, rowCount: 2 },
    { column: 1, firstRow: 2, rowCount: 2 },
  ],
  rzg: [{ column: 0, firstRow: 2, rowCount: 2 }],
  englisch: [{ column: 1, firstRow: 0, rowCount: 2 }],
  nt: [{ column: 2, firstRow: 0, rowCount: 2 }],
};
const FREE_PERIODS: Block[] = [
  { column: 2, firstRow: 2, rowCount: 1 },
  { column: 2, firstRow: 3, rowCount: 1 },
];

// Android masks the adaptive icon to a circle of 72/108 and keeps 66/108 safe:
// the whole grid has to fit into that circle.
const ANDROID_SCALE = (0.6 * APP_STORE_ICON_SIZE) / Math.hypot(GRID_W, GRID_H);
// The notification icon (24 dp) keeps a margin of 2 dp, so the grid fills 20/24 of it
const NOTIFICATION_SCALE = ((20 / 24) * APP_STORE_ICON_SIZE) / Math.max(GRID_W, GRID_H);

function rects(blocks: Block[], fill: string, scale = 1) {
  const x0 = (APP_STORE_ICON_SIZE - GRID_W * scale) / 2;
  const y0 = (APP_STORE_ICON_SIZE - GRID_H * scale) / 2;
  return blocks
    .map(({ column, firstRow, rowCount }) => {
      const x = x0 + column * (CELL_W + GAP) * scale;
      const y = y0 + firstRow * (CELL_H + GAP) * scale;
      const h = (rowCount * CELL_H + (rowCount - 1) * GAP) * scale;
      return `<rect x="${x}" y="${y}" width="${CELL_W * scale}" height="${h}" rx="${RADIUS * scale}" fill="${fill}"/>`;
    })
    .join("");
}

function grid(mode: Mode, scale = 1) {
  const lessons = (Object.keys(LESSONS) as Subject[])
    .map((subject) => rects(LESSONS[subject], SUBJECTS[subject][mode], scale))
    .join("");
  return rects(FREE_PERIODS, FREE[mode], scale) + lessons;
}

// White on transparent, free periods dimmed: Android tints it and only uses the alpha
function silhouette(scale: number) {
  return (
    rects(FREE_PERIODS, "#FFFFFF59", scale) + rects(Object.values(LESSONS).flat(), "#FFFFFF", scale)
  );
}

function background(mode: Mode) {
  return `<rect width="${APP_STORE_ICON_SIZE}" height="${APP_STORE_ICON_SIZE}" fill="${BACKGROUND[mode]}"/>`;
}
function svg(content: string, clipRadius?: number) {
  const clip =
    clipRadius === undefined
      ? content
      : `<clipPath id="mask"><rect width="${APP_STORE_ICON_SIZE}" height="${APP_STORE_ICON_SIZE}" rx="${clipRadius}"/></clipPath><g clip-path="url(#mask)">${content}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${APP_STORE_ICON_SIZE}" height="${APP_STORE_ICON_SIZE}" viewBox="0 0 ${APP_STORE_ICON_SIZE} ${APP_STORE_ICON_SIZE}">${clip}</svg>\n`;
}

function png(svgSource: string, size = APP_STORE_ICON_SIZE) {
  return new Resvg(svgSource, { fitTo: { mode: "width", value: size } }).render().asPng();
}

// The App Store rejects icons with an alpha channel
function opaquePng(svgSource: string, size = APP_STORE_ICON_SIZE) {
  const image = PNG.sync.read(png(svgSource, size));
  return PNG.sync.write(image, { colorType: 2 });
}

// Icon Composer colors: "extended-srgb:r,g,b,a"
function icColor(hex: string) {
  const [r, g, b, a = 255] = (hex.slice(1).match(/../g) ?? []).map((part) => parseInt(part, 16));
  return `extended-srgb:${[r, g, b, a].map((value) => (value / 255).toFixed(5)).join(",")}`;
}

function write(path: string, data: string | Uint8Array) {
  writeFileSync(path, data);
  console.log(`  ${path.slice(ROOT.length + 1)}`);
}

// iOS: Icon Composer package, one layer per subject so Liquid Glass treats each as its own piece.
// The layers are drawn in the light color; icon.json sets the color for each appearance.
function buildIconPackage() {
  rmSync(ICON_PACKAGE, { recursive: true, force: true });
  mkdirSync(join(ICON_PACKAGE, "Assets"), { recursive: true });

  const layer = (name: string, blocks: Block[], colors: { light: string; dark: string }) => {
    write(join(ICON_PACKAGE, "Assets", `${name}.svg`), svg(rects(blocks, colors.light)));
    return {
      name,
      "image-name": `${name}.svg`,
      glass: true,
      "fill-specializations": [
        { value: { solid: icColor(colors.light) } },
        { appearance: "dark", value: { solid: icColor(colors.dark) } },
      ],
    };
  };

  const document = {
    "fill-specializations": [
      { value: { "linear-gradient": IOS_BACKGROUND.light.map(icColor) } },
      { appearance: "dark", value: { "linear-gradient": IOS_BACKGROUND.dark.map(icColor) } },
    ],
    groups: [
      {
        name: "Lektionen",
        layers: (Object.keys(LESSONS) as Subject[]).map((subject) =>
          layer(subject, LESSONS[subject], SUBJECTS[subject])
        ),
        lighting: "individual",
        specular: true,
        shadow: { kind: "neutral", opacity: 0.5 },
        translucency: { enabled: true, value: 0.4 },
      },
      {
        name: "Freistunden",
        layers: [{ ...layer("frei", FREE_PERIODS, FREE), glass: false }],
        shadow: { kind: "none", opacity: 0 },
        translucency: { enabled: false, value: 0 },
      },
    ],
    "supported-platforms": { circles: ["watchOS"], squares: "shared" },
  };
  write(join(ICON_PACKAGE, "icon.json"), JSON.stringify(document, null, 2) + "\n");
}

// Returns the opaque light icon, which the App Store export uses unchanged
function buildAppImages() {
  // Fallback icon (Expo Go, older Android without adaptive icons)
  const lightIcon = opaquePng(svg(background("light") + grid("light")));
  write(join(IMAGES, "icon.png"), lightIcon);
  // Dark variant for the about screen in dark mode
  write(join(IMAGES, "icon-dark.png"), opaquePng(svg(background("dark") + grid("dark"))));
  // The about screen on iOS shows the icon as the home screen does, rendered by Apple
  copyFileSync(join(RENDERED, "icon-ios-light.png"), join(IMAGES, "icon-ios.png"));
  console.log("  assets/images/icon-ios.png (copied from design/icon/rendered)");

  // Android adaptive icon
  write(join(IMAGES, "android-icon-background.png"), png(svg(background("light"))));
  write(join(IMAGES, "android-icon-foreground.png"), png(svg(grid("light", ANDROID_SCALE))));
  write(join(IMAGES, "android-icon-monochrome.png"), png(svg(silhouette(ANDROID_SCALE))));
  // Status bar and notifications; the config plugin of expo-notifications wants 96×96 px
  write(join(IMAGES, "notification-icon.png"), png(svg(silhouette(NOTIFICATION_SCALE)), 96));

  // Splash screen: Android shows the image in a circle like the adaptive icon
  write(join(IMAGES, "splash-icon.png"), png(svg(grid("light", ANDROID_SCALE))));
  write(join(IMAGES, "splash-icon-dark.png"), png(svg(grid("dark", ANDROID_SCALE))));
  return lightIcon;
}

// Stores, documentation and everything outside the app
function buildExports(lightIcon: Uint8Array) {
  rmSync(EXPORT, { recursive: true, force: true });
  mkdirSync(EXPORT, { recursive: true });
  // Corner radius of an iOS icon, for documents (the system draws the real shape)
  const corner = APP_STORE_ICON_SIZE * 0.2237;

  for (const mode of ["light", "dark"] as const) {
    const suffix = mode === "light" ? "" : "-dark";
    const square = svg(background(mode) + grid(mode));
    const rounded = svg(background(mode) + grid(mode), corner);
    write(join(EXPORT, `schoolos-icon${suffix}.svg`), square);
    write(join(EXPORT, `schoolos-icon${suffix}-1024.png`), png(square));
    write(join(EXPORT, `schoolos-icon-rounded${suffix}.svg`), rounded);
    write(join(EXPORT, `schoolos-icon-rounded${suffix}-1024.png`), png(rounded));
    write(join(EXPORT, `schoolos-icon-rounded${suffix}-256.png`), png(rounded, 256));
  }

  const square = svg(background("light") + grid("light"));
  write(join(EXPORT, "app-store-1024.png"), lightIcon);
  write(join(EXPORT, "play-store-512.png"), png(square, 512));
}

console.log("Icon Composer package");
buildIconPackage();
console.log("App images");
const lightIcon = buildAppImages();
console.log("Exports");
buildExports(lightIcon);
