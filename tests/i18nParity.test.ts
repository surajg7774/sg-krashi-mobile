import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { en } from "../src/i18n/en.ts";
import { hi } from "../src/i18n/hi.ts";

type Leaf = string | { one: string; other: string };
const leaves = (node: unknown, prefix = ""): [string, string][] =>
  Object.entries(node as Record<string, unknown>).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") return [[path, value]] as [string, string][];
    const v = value as Leaf & Record<string, unknown>;
    if (typeof v === "object" && typeof v.one === "string" && typeof v.other === "string") {
      return [[path, v.one], [`${path}#other`, v.other]] as [string, string][];
    }
    return leaves(value, path);
  });

const EN = new Map(leaves(en));
const HI = new Map(leaves(hi));

// ---- Hindi quality --------------------------------------------------------------------------------------------

// Hindi values that are allowed to equal the English one: a language's own name, and a template that is only
// placeholders and punctuation (nothing to translate).
const SAME_AS_ENGLISH_ALLOWED = new Set(["language.english", "language.hindi", "crops.farmer.listingRow"]);

test("no Hindi text is just the English text, except a short allow-list", () => {
  const same = [...EN].filter(([key, value]) => HI.get(key) === value && !SAME_AS_ENGLISH_ALLOWED.has(key)).map(([key]) => key);
  assert.deepEqual(same, [], `untranslated: ${same.join(", ")}`);
});

test("every Hindi text contains Devanagari (so it is Hindi, not left in Latin letters), with the same allow-list", () => {
  const latinOnly = [...HI].filter(([key, value]) => !/[ऀ-ॿ]/.test(value) && !SAME_AS_ENGLISH_ALLOWED.has(key.replace(/#other$/, ""))).map(([key]) => key);
  assert.deepEqual(latinOnly, [], `no Devanagari: ${latinOnly.join(", ")}`);
});

test("Hindi text has no stray spaces at either end and no doubled spaces", () => {
  for (const [key, value] of HI) {
    assert.equal(value, value.trim(), `leading/trailing space: ${key}`);
    assert.ok(!/ {2,}/.test(value), `doubled spaces: ${key}`);
  }
});

test("a sentence that ends with punctuation in English ends the Hindi way (danda or the same mark)", () => {
  // English full stops become the Hindi danda; question and exclamation marks stay. Texts that are labels or join with
  // a placeholder are unaffected.
  for (const [key, english] of EN) {
    const hindi = HI.get(key)!;
    if (/\.$/.test(english) && /[ऀ-ॿ]/.test(hindi)) {
      assert.ok(/[।.]$/.test(hindi), `"${key}" ends without a full stop: ${hindi}`);
    }
    if (/\?$/.test(english)) assert.ok(/[?]$/.test(hindi), `"${key}" lost its question mark: ${hindi}`);
  }
});

// ---- no dead or missing keys ----------------------------------------------------------------------------------

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
};
const root = fileURLToPath(new URL("..", import.meta.url));
const sources = [...walk(join(root, "src")), join(root, "App.tsx")]
  .filter((file) => !/[\\/]src[\\/]i18n[\\/](en|hi)\.ts$/.test(file))
  .map((file) => readFileSync(file, "utf8"));
const allSource = sources.join("\n");

// Keys the code builds at run time from a server code (an order status, a payout status ...): checked by group.
const DYNAMIC_GROUPS = [
  "orders.status.",
  "orders.title.",
  "orders.step.",
  "farmer.payouts.status.",
  "farmer.payouts.lineType.",
  "cropDoctor.health.",
  "cropDoctor.confidence.",
  "profile.roles.",
];

test("every English key is used by the app (no dead text left behind)", () => {
  const baseKeys = [...EN.keys()].map((key) => key.replace(/#other$/, ""));
  const unused = [...new Set(baseKeys)].filter((key) => {
    if (DYNAMIC_GROUPS.some((group) => key.startsWith(group))) return !allSource.includes(`"${key.slice(0, key.lastIndexOf(".") + 1)}`) && !allSource.includes(`"${key}"`);
    return !allSource.includes(`"${key}"`) && !allSource.includes(`'${key}'`);
  });
  assert.deepEqual(unused, [], `unused keys: ${unused.join(", ")}`);
});

test("every key the code names exists (checked at compile time for t(), and here for the strings kept in tables)", () => {
  const known = new Set([...EN.keys()].map((key) => key.replace(/#other$/, "")));
  const groups = ["auth", "onboarding", "home", "weather", "crops", "store", "cart", "address", "checkout", "payment", "orders", "profile", "account", "notifications", "cropDoctor", "chat", "farmer", "mandi", "nav", "offline", "common", "language", "errors"];
  const pattern = new RegExp(`"((?:${groups.join("|")})\\.[A-Za-z0-9_.]+)"`, "g");
  const missing = new Set<string>();
  for (const match of allSource.matchAll(pattern)) {
    if (!known.has(match[1])) missing.add(match[1]);
  }
  assert.deepEqual([...missing], [], `keys used but not defined: ${[...missing].join(", ")}`);
});

// ---- no hard-coded English left in the screens ----------------------------------------------------------------

test("the scanner finds no hard-coded user-facing English text left in src/ (lines marked i18n-ignore are exempt)", () => {
  const output = execFileSync("node", [join(root, "scripts", "i18n-scan.cjs"), "--json"], { encoding: "utf8", maxBuffer: 1 << 26 });
  const findings = JSON.parse(output) as { file: string; line: number; text: string }[];
  assert.deepEqual(
    findings.map((f) => `${f.file}:${f.line} ${f.text}`),
    []
  );
});
