/// <reference types="node" />
// Run with: npm test   (Node's built-in test runner; needs Node 22.18 or newer for TypeScript files)
import assert from "node:assert/strict";
import { test } from "node:test";
import { MEDIA_WIDTH, resizedMediaUrl } from "../src/shared/media.ts";

const ORIGINAL = "https://res.cloudinary.com/zpu6rdhu/image/upload/v1790492555/a18bf279-2e1a-41b4-b3a1-abb5dda403d6.png";

test("a Cloudinary photo gets a width-limited, auto-format, auto-quality copy", () => {
  assert.equal(
    resizedMediaUrl(ORIGINAL, MEDIA_WIDTH.card),
    "https://res.cloudinary.com/zpu6rdhu/image/upload/f_auto,q_auto,c_limit,w_640/v1790492555/a18bf279-2e1a-41b4-b3a1-abb5dda403d6.png"
  );
  assert.ok(resizedMediaUrl(ORIGINAL, MEDIA_WIDTH.detail)?.includes(",w_1080/"));
  assert.ok(resizedMediaUrl(ORIGINAL, MEDIA_WIDTH.row)?.includes(",w_240/"));
  assert.ok(resizedMediaUrl(ORIGINAL, MEDIA_WIDTH.rail)?.includes(",w_400/"));
});

test("the same result as the website's helper for the same address", () => {
  // sg-krashi-client/src/shared/utils/resolveMediaUrl.ts builds exactly this path for the same input.
  const web = `https://res.cloudinary.com/zpu6rdhu/image/upload/f_auto,q_auto,c_limit,w_640/v1790492555/a18bf279-2e1a-41b4-b3a1-abb5dda403d6.png`;
  assert.equal(resizedMediaUrl(ORIGINAL, 640), web);
});

test("a folder path and a query string after the version are kept", () => {
  assert.equal(
    resizedMediaUrl("https://res.cloudinary.com/demo/image/upload/v12/folder/sub/pic.jpg?x=1", 240),
    "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_240/v12/folder/sub/pic.jpg?x=1"
  );
});

test("only Cloudinary photos are touched: every other address is returned unchanged", () => {
  const others = [
    "https://example.com/photo.png",
    "https://placehold.co/400x400?text=No+Image",
    "http://res.cloudinary.com/demo/image/upload/v1/a.png", // not https
    "https://res.cloudinary.com/demo/video/upload/v1/a.mp4", // not an image upload
    "https://res.cloudinary.com/demo/image/fetch/https://example.com/a.png",
    "/uploads/local-photo.jpg", // a relative address
    "file:///data/user/0/photo.jpg",
  ];
  for (const url of others) assert.equal(resizedMediaUrl(url, 640), url);
});

test("an address that already carries a transformation, or no version, is left alone (and a second pass changes nothing)", () => {
  const already = "https://res.cloudinary.com/demo/image/upload/c_fill,w_100/v1/a.png";
  assert.equal(resizedMediaUrl(already, 640), already);
  assert.equal(resizedMediaUrl("https://res.cloudinary.com/demo/image/upload/a.png", 640), "https://res.cloudinary.com/demo/image/upload/a.png");
  const once = resizedMediaUrl(ORIGINAL, 640);
  assert.equal(resizedMediaUrl(once, 240), once);
});

test("a missing or empty address is 'no image'", () => {
  assert.equal(resizedMediaUrl(null, 640), undefined);
  assert.equal(resizedMediaUrl(undefined, 640), undefined);
  assert.equal(resizedMediaUrl("", 640), undefined);
  assert.equal(resizedMediaUrl("   ", 640), undefined);
});

test("surrounding spaces are trimmed", () => {
  assert.equal(resizedMediaUrl(`  ${ORIGINAL}  `, 640), resizedMediaUrl(ORIGINAL, 640));
  assert.equal(resizedMediaUrl(" https://example.com/a.png ", 640), "https://example.com/a.png");
});

test("widths are the documented ones", () => {
  assert.deepEqual({ ...MEDIA_WIDTH }, { card: 640, rail: 400, detail: 1080, row: 240 });
});
