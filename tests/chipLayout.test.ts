import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  CHIP_BORDER,
  CHIP_FONT_SIZE,
  CHIP_PADDING_VERTICAL,
  CHIP_ROW_PADDING_VERTICAL,
  chipHeight,
  chipLineHeight,
  chipRowMinHeight,
} from "../src/theme/chipLayout.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");

test("a chip row is always at least as tall as one chip plus the row's own padding", () => {
  for (const lang of ["en", "hi"] as const) {
    for (const scale of [1, 1.15, 1.3, 1.5, 2]) {
      assert.equal(chipRowMinHeight(scale, lang), chipHeight(scale, lang) + 2 * CHIP_ROW_PADDING_VERTICAL);
      assert.ok(chipRowMinHeight(scale, lang) > chipHeight(scale, lang));
    }
  }
});

test("the row grows with the system font size and is taller for Devanagari than for English", () => {
  assert.ok(chipRowMinHeight(1.3, "en") > chipRowMinHeight(1, "en"));
  assert.ok(chipRowMinHeight(2, "hi") > chipRowMinHeight(1.3, "hi"));
  assert.ok(chipRowMinHeight(1, "hi") > chipRowMinHeight(1, "en"));
});

test("the default-size English chip is the ~31 dp pill the app always had, and the row fits it with room to spare", () => {
  // 13sp text at 1.4 -> 19 dp line + 12 padding + 2 border = 33 dp (the old 48 dp fixed bar fitted it with 15 to spare).
  assert.equal(chipHeight(1, "en"), Math.ceil(CHIP_FONT_SIZE * 1.4) + 2 * CHIP_PADDING_VERTICAL + 2 * CHIP_BORDER);
  assert.ok(chipRowMinHeight(1, "en") <= 48);
});

test("the old fixed 48 dp bar would have clipped a large-font Hindi chip - the computed height does not", () => {
  const clipped = chipHeight(1.3, "hi") + 2 * CHIP_ROW_PADDING_VERTICAL;
  assert.ok(clipped > 48, `${clipped} should exceed the old fixed height of 48`);
  assert.equal(chipRowMinHeight(1.3, "hi"), clipped);
});

test("bad font scales (0, NaN, negative, below 1) fall back to a sane height", () => {
  for (const bad of [0, Number.NaN, -2, 0.5]) assert.equal(chipHeight(bad, "en"), chipHeight(1, "en"));
});

test("the explicit chip line height gives Devanagari more room than English", () => {
  assert.ok(chipLineHeight("hi") > chipLineHeight("en"));
  assert.equal(chipLineHeight("hi"), Math.ceil(CHIP_FONT_SIZE * 1.6));
});

// ---- wiring: every horizontal filter row goes through ChipRow, and no screen keeps a fixed or squeezable row --------

test("Store, Crop Marketplace and Mandi use ChipRow and no longer define their own horizontal chip lists", () => {
  for (const path of [
    "../src/features/store/StoreScreen.tsx",
    "../src/features/crop-marketplace/CropMarketplaceScreen.tsx",
    "../src/features/mandi/MandiScreen.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /<ChipRow\b/, path);
    assert.doesNotMatch(source, /\bhorizontal\b/, `${path} still has its own horizontal list`);
    assert.doesNotMatch(source, /chipBar|styles\.chip\b/, `${path} still has its own chip styles`);
  }
});

test("ChipRow cannot be squeezed: it never shrinks and has a computed minimum height (no fixed height)", () => {
  const source = read("../src/components/ChipRow.tsx");
  assert.match(source, /flexShrink: 0/);
  assert.match(source, /minHeight: chipRowMinHeight\(fontScale, lang\)/);
  assert.doesNotMatch(source, /\bheight: \d+/, "a fixed height would clip larger fonts");
});
