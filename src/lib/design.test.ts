import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const CSS = readFileSync("src/app/globals.css", "utf8");

function readColors(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6});/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}

const LIGHT = readColors(CSS.match(/:root \{([\s\S]*?)\n\}/)?.[1] ?? "");
const DARK = readColors(
  CSS.match(/prefers-color-scheme: dark\) \{\s*:root \{([\s\S]*?)\n {2}\}/)?.[1] ??
    "",
);

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/** Text and its background, which need at least 4.5:1. */
const TEXT_PAIRS = [
  ["ink", "page"],
  ["ink", "card"],
  ["muted", "page"],
  ["muted", "card"],
  ["action-ink", "action"],
  ["action-ink", "action-hover"],
  ["highlight", "card"],
  ["highlight", "page"],
  ["band-ink", "band-from"],
  ["band-ink", "band-to"],
  ["band-to", "band-ink"],
  ["notice-ink", "notice"],
  ["chip-teal-ink", "chip-teal"],
  ["chip-teal-ink", "card"],
  ["chip-coral-ink", "chip-coral"],
  ["ink", "chip-teal"],
] as const;

/** Icons, control outlines and focus rings, which need at least 3:1. */
const GRAPHIC_PAIRS = [
  ["control", "card"],
  ["control", "page"],
  ["focus", "card"],
  ["focus", "page"],
  ["action", "card"],
  ["band-ink", "band-from"],
  ["accent", "band-from"],
  ["accent", "band-to"],
] as const;

test("the contrast check catches a planted failure", () => {
  expect(contrast("#777777", "#888888")).toBeLessThan(3);
  expect(contrast("#000000", "#ffffff")).toBeCloseTo(21);
});

test("both modes have the same named colors", () => {
  expect(Object.keys(LIGHT).length).toBeGreaterThan(15);
  expect(Object.keys(DARK).sort()).toEqual(Object.keys(LIGHT).sort());
});

describe.each([
  ["light", LIGHT],
  ["dark", DARK],
])("%s mode", (_mode, colors) => {
  test.each(TEXT_PAIRS)("%s on %s is at least 4.5:1", (text, background) => {
    expect(contrast(colors[text], colors[background])).toBeGreaterThanOrEqual(4.5);
  });

  test.each(GRAPHIC_PAIRS)("%s on %s is at least 3:1", (graphic, background) => {
    expect(contrast(colors[graphic], colors[background])).toBeGreaterThanOrEqual(3);
  });
});

test.each([
  ["page", "#F6FBF9"],
  ["card", "#FFFFFF"],
  ["ink", "#12302B"],
  ["muted", "#3F5F59"],
  ["action", "#0F766E"],
  ["highlight", "#C2410C"],
  ["accent", "#FACC15"],
  ["band-from", "#0F766E"],
  ["band-to", "#065F46"],
  ["notice", "#FFF4E5"],
  ["notice-ink", "#7C2D12"],
])("the light %s color is the approved %s", (name, value) => {
  expect(LIGHT[name].toUpperCase()).toBe(value);
});

function sourceFiles(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts") ? [path] : [];
  });
}

const SOURCES = sourceFiles("src").map((path) => ({
  path,
  text: readFileSync(path, "utf8"),
}));

describe("the design rules", () => {
  test("tick boxes and radio buttons use the shared style, not the browser's", () => {
    const controls = SOURCES.flatMap(({ text }) =>
      [...text.matchAll(/type="(checkbox|radio)"[\s\S]*?className="([^"]*)"/g)].map(
        (match) => match[2],
      ),
    );
    expect(controls.length).toBeGreaterThanOrEqual(2);
    expect(controls.filter((classes) => !/\btick\b/.test(classes))).toEqual([]);
    expect(SOURCES.filter(({ text }) => /\baccent-action\b/.test(text))).toEqual([]);
  });

  test("the marks inside ticks match the text on the main action color", () => {
    const encoded = (color: string) => color.replace("#", "%23");
    const light = CSS.split("@media (prefers-color-scheme: dark)")[0];
    const dark = CSS.split("@media (prefers-color-scheme: dark)")[1].split(
      "@theme inline",
    )[0];
    for (const mark of ["--tick-mark", "--dot-mark"]) {
      expect(light.match(new RegExp(`${mark}:[^\\n]*`))?.[0]).toContain(
        encoded(LIGHT["action-ink"]),
      );
      expect(dark.match(new RegExp(`${mark}:[^\\n]*`))?.[0]).toContain(
        encoded(DARK["action-ink"]),
      );
    }
  });

  test("the small accent color is never used for text", () => {
    expect(
      SOURCES.filter(({ text }) => /\btext-accent\b/.test(text)).map(
        ({ path }) => path,
      ),
    ).toEqual([]);
  });

  test("pages use named colors, not faded text or raw colors", () => {
    const pattern = /\bopacity-80\b|\b(text|bg|border)-foreground\b|\bbg-background\b/;
    expect(pattern.test("text-foreground")).toBe(true);
    expect(
      SOURCES.filter(({ text }) => pattern.test(text)).map(({ path }) => path),
    ).toEqual([]);
  });

  test("the site has no images, so it has no photos of people", () => {
    const pattern = /<img\b|next\/image|\.(png|jpe?g|webp|gif|avif)\b/i;
    expect(pattern.test("<img src=x>")).toBe(true);
    expect(
      SOURCES.filter(({ text }) => pattern.test(text)).map(({ path }) => path),
    ).toEqual([]);
  });

  test("no icon shows a person", () => {
    const person = /User|Person|Baby|Accessibility|Contact|Smile|Hand|Footprints/;
    const icons = SOURCES.flatMap(({ text }) =>
      [...text.matchAll(/import \{([^}]+)\} from "lucide-react"/g)].flatMap((match) =>
        match[1].split(",").map((name) => name.trim()),
      ),
    );

    expect(person.test("UserRound")).toBe(true);
    expect(icons.length).toBeGreaterThan(5);
    expect(icons.filter((name) => person.test(name))).toEqual([]);
  });
});
