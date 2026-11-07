// Builds every app icon asset from one definition: Mon, Thu and Fri, periods 1–4 of the
// S3a timetable 2026/27, double lessons drawn as one block.
// Run with `bun run icons`. Validate the .icon package afterwards with the compose-app-icon skill.

import { Resvg } from "@resvg/resvg-js";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";

const ROOT = join(import.meta.dirname, "..", "..");
const ICON_PACKAGE = join(ROOT, "assets", "schoolos.icon");
const IMAGES = join(ROOT, "assets", "images");
const EXPORT = join(import.meta.dirname, "export");
// Icons rendered by Apple (Liquid Glass), downloaded from App Store Connect; not generated here
const RENDERED = join(import.meta.dirname, "rendered");

// Canvas of Icon Composer and the App Store
const CANVAS = 1024;

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

// Grid: columns are weekdays, rows are periods
const COLS = 3;
const ROWS = 4;
const CELL_W = 184;
const CELL_H = 136;
const GAP = 32;
const RADIUS = 46;
const GRID_W = COLS * CELL_W + (COLS - 1) * GAP;
const GRID_H = ROWS * CELL_H + (ROWS - 1) * GAP;

// [column, first row, rows]
type Block = [number, number, number];
const LESSONS: Record<Subject, Block[]> = {
  deutsch: [
    [0, 0, 2],
    [1, 2, 2],
  ],
  rzg: [[0, 2, 2]],
  englisch: [[1, 0, 2]],
  nt: [[2, 0, 2]],
};
const FREE_PERIODS: Block[] = [
  [2, 2, 1],
  [2, 3, 1],
];

// Android masks the adaptive icon to a circle of 72/108 and keeps 66/108 safe:
// the whole grid has to fit into that circle.
const ANDROID_SCALE = (0.6 * CANVAS) / Math.hypot(GRID_W, GRID_H);

function rects(blocks: Block[], fill: string, scale = 1) {
  const x0 = (CANVAS - GRID_W * scale) / 2;
  const y0 = (CANVAS - GRID_H * scale) / 2;
  return blocks
    .map(([col, row, span]) => {
      const x = x0 + col * (CELL_W + GAP) * scale;
      const y = y0 + row * (CELL_H + GAP) * scale;
      const h = (span * CELL_H + (span - 1) * GAP) * scale;
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

function background(mode: Mode) {
  return `<rect width="${CANVAS}" height="${CANVAS}" fill="${BACKGROUND[mode]}"/>`;
}
function svg(content: string, clipRadius?: number) {
  const clip =
    clipRadius === undefined
      ? content
      : `<clipPath id="mask"><rect width="${CANVAS}" height="${CANVAS}" rx="${clipRadius}"/></clipPath><g clip-path="url(#mask)">${content}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">${clip}</svg>\n`;
}

function png(svgSource: string, size = CANVAS) {
  return new Resvg(svgSource, { fitTo: { mode: "width", value: size } }).render().asPng();
}

// The App Store rejects icons with an alpha channel
function opaquePng(svgSource: string, size = CANVAS) {
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

function buildAppImages() {
  // Fallback icon (Expo Go, older Android without adaptive icons)
  write(join(IMAGES, "icon.png"), opaquePng(svg(background("light") + grid("light"))));
  // Dark variant for the about screen in dark mode
  write(join(IMAGES, "icon-dark.png"), opaquePng(svg(background("dark") + grid("dark"))));
  // The about screen on iOS shows the icon as the home screen does, rendered by Apple
  copyFileSync(join(RENDERED, "icon-ios-light.png"), join(IMAGES, "icon-ios.png"));
  console.log("  assets/images/icon-ios.png (copied from design/icon/rendered)");

  // Android adaptive icon
  write(join(IMAGES, "android-icon-background.png"), png(svg(background("light"))));
  write(join(IMAGES, "android-icon-foreground.png"), png(svg(grid("light", ANDROID_SCALE))));
  write(
    join(IMAGES, "android-icon-monochrome.png"),
    png(
      svg(
        rects(FREE_PERIODS, "#FFFFFF59", ANDROID_SCALE) +
          rects(Object.values(LESSONS).flat(), "#FFFFFF", ANDROID_SCALE)
      )
    )
  );

  // Splash screen: Android shows the image in a circle like the adaptive icon
  write(join(IMAGES, "splash-icon.png"), png(svg(grid("light", ANDROID_SCALE))));
  write(join(IMAGES, "splash-icon-dark.png"), png(svg(grid("dark", ANDROID_SCALE))));
}

// Stores, documentation and everything outside the app
function buildExports() {
  rmSync(EXPORT, { recursive: true, force: true });
  mkdirSync(EXPORT, { recursive: true });
  // Corner radius of an iOS icon, for documents (the system draws the real shape)
  const corner = CANVAS * 0.2237;

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
  write(join(EXPORT, "app-store-1024.png"), opaquePng(square));
  write(join(EXPORT, "play-store-512.png"), png(square, 512));
}

console.log("Icon Composer package");
buildIconPackage();
console.log("App images");
buildAppImages();
console.log("Exports");
buildExports();
