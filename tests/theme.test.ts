import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { NEUTRAL_TONE, accents, colors, statusTones } from "../src/theme/colors.ts";

// ---- WCAG 2.x contrast ----------------------------------------------------------------------------------------

const channel = (hex: string, index: number): number => {
  const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
};
const luminance = (hex: string): number => 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const AA_BODY = 4.5; // body text
const AA_LARGE = 3; // large text (18sp+ or 14sp bold) and icons

const check = (label: string, fg: string, bg: string, min: number) => {
  assert.match(fg, /^#[0-9A-Fa-f]{6}$/, `${label}: foreground is not a hex colour: ${fg}`);
  assert.match(bg, /^#[0-9A-Fa-f]{6}$/, `${label}: background is not a hex colour: ${bg}`);
  const ratio = contrast(fg, bg);
  assert.ok(ratio >= min, `${label}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1`);
};

test("the contrast function agrees with known WCAG values", () => {
  assert.equal(contrast("#000000", "#FFFFFF").toFixed(1), "21.0");
  assert.equal(contrast("#FFFFFF", "#FFFFFF").toFixed(1), "1.0");
  assert.equal(contrast("#777777", "#FFFFFF").toFixed(2), "4.48"); // the well-known just-failing grey
});

test("body text is readable (4.5:1) on every surface and tint it is used on", () => {
  const surfaces = ["background", "surface", "greenTint", "greenTintStrong", "goldTint", "goldTintStrong", "blueTint", "blueTintStrong"] as const;
  for (const surface of surfaces) {
    check(`textPrimary on ${surface}`, colors.textPrimary, colors[surface], AA_BODY);
  }
  for (const surface of ["background", "surface", "greenTint", "goldTint", "blueTint", "blueTintStrong"] as const) {
    check(`textSecondary on ${surface}`, colors.textSecondary, colors[surface], AA_BODY);
  }
});

test("white text on the deep colours (buttons, the green header, badges) and dark text on the gold", () => {
  for (const deep of ["primary", "primaryDark", "error", "success"] as const) {
    check(`white on ${deep}`, colors.primaryContrastText, colors[deep], AA_BODY);
  }
  check("onGold on secondary", colors.onGold, colors.secondary, AA_BODY);
  check("onGold on secondaryLight", colors.onGold, colors.secondaryLight, AA_BODY);
  check("gold on the deep green header", colors.secondary, colors.primaryDark, AA_BODY);
  check("white on the deep green header", colors.white, colors.primaryDark, AA_BODY);
});

test("brand colours used as text or icons on light backgrounds", () => {
  for (const surface of ["surface", "background", "greenTint"] as const) {
    check(`primary on ${surface}`, colors.primary, colors[surface], AA_BODY);
  }
  check("primaryDark on greenTint", colors.primaryDark, colors.greenTint, AA_BODY);
  for (const surface of ["surface", "background", "goldTint"] as const) {
    check(`secondaryDark (gold text) on ${surface}`, colors.secondaryDark, colors[surface], AA_BODY);
  }
  check("inactive tab icon/label on the tab bar", colors.tabInactive, colors.surface, AA_BODY);
  check("active tab icon (primary) on its green tint", colors.primary, colors.greenTint, AA_LARGE);
  check("error text on white", colors.error, colors.surface, AA_BODY);
  check("error text on the page background", colors.error, colors.background, AA_BODY);
  check("success text on white", colors.success, colors.surface, AA_BODY);
});

test("every accent: text reads at 4.5:1 and the icon at 3:1 on its tint", () => {
  for (const [name, accent] of Object.entries(accents)) {
    check(`${name} text on tint`, accent.text, accent.tint, AA_BODY);
    check(`${name} icon on tint`, accent.icon, accent.tint, AA_LARGE);
    check(`${name} dark text on tint`, colors.textPrimary, accent.tint, AA_BODY);
  }
});

test("every order status chip: the text colour reads at 4.5:1 on its tinted background", () => {
  assert.deepEqual(Object.keys(statusTones).sort(), ["CONFIRMED", "DELIVERED", "PAYMENT_FAILED", "PENDING_PAYMENT", "REFUNDED", "SHIPPED"]);
  for (const [status, tone] of Object.entries(statusTones)) {
    check(`${status} chip text`, tone.fg, tone.bg, AA_BODY);
    // the border is decoration (the chip is readable without it), but it must still be visibly deeper than the tint
    assert.ok(contrast(tone.border, tone.bg) > 1.2, `${status} border should stand out from its background`);
  }
  check("neutral chip text", NEUTRAL_TONE.fg, NEUTRAL_TONE.bg, AA_BODY);
});

test("the status colours are the agreed families: pending amber, confirmed blue, shipped teal, delivered green, failed red", () => {
  const hue = (hex: string): number => {
    const [r, g, b] = [0, 1, 2].map((i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (d === 0) return -1;
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };
  const near = (value: number, target: number, tolerance: number) => Math.min(Math.abs(value - target), 360 - Math.abs(value - target)) <= tolerance;
  assert.ok(near(hue(statusTones.PENDING_PAYMENT.fg), 35, 20), "pending is amber/orange");
  assert.ok(near(hue(statusTones.CONFIRMED.fg), 220, 25), "confirmed is blue");
  assert.ok(near(hue(statusTones.SHIPPED.fg), 172, 20), "shipped is teal");
  assert.ok(near(hue(statusTones.DELIVERED.fg), 122, 25), "delivered is green");
  assert.ok(near(hue(statusTones.PAYMENT_FAILED.fg), 4, 15), "failed is red");
  assert.equal(hue(statusTones.REFUNDED.fg) >= 0 && hue(statusTones.REFUNDED.fg) < 200, true);
});

// ---- tokens only ------------------------------------------------------------------------------------------------

const root = fileURLToPath(new URL("..", import.meta.url));
const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
};

test("no screen or component hard-codes a colour: they all come from src/theme/colors.ts", () => {
  const offenders: string[] = [];
  for (const file of walk(join(root, "src"))) {
    if (/[\\/]src[\\/]theme[\\/]colors\.ts$/.test(file)) continue;
    const code = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    code.split("\n").forEach((line, index) => {
      if (/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(line) && !/shadowColor/.test(line)) offenders.push(`${file.replace(root, "")}:${index + 1} ${line.trim().slice(0, 90)}`);
    });
  }
  assert.deepEqual(offenders, []);
});

test("sizes do not depend on colour: the chip and line-height maths are untouched by the palette", () => {
  // The Hindi layout tests (tests/chipLayout.test.ts, tests/i18nLayout.test.ts) measure heights; this file must never
  // be where those numbers live.
  const chipLayout = readFileSync(join(root, "src/theme/chipLayout.ts"), "utf8");
  assert.doesNotMatch(chipLayout, /colors|#[0-9a-fA-F]{6}/);
});
