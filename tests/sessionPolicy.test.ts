import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { shouldEndSession } from "../src/api/sessionPolicy.ts";

test("only a refresh the server rejected ends the session", () => {
  assert.equal(shouldEndSession({ status: 401, code: "INVALID_TOKEN" }), true);
  assert.equal(shouldEndSession({ status: 400 }), true);
  assert.equal(shouldEndSession({ status: 403 }), true);
});

test("NETWORK_ERROR never ends the session", () => {
  assert.equal(shouldEndSession({ code: "NETWORK_ERROR", message: "Network Error", status: undefined } as never), false);
  assert.equal(shouldEndSession({ code: "NETWORK_ERROR", status: 401 }), false);
});

test("timeouts, rate limits, server errors and unknown failures never end the session", () => {
  for (const status of [408, 429, 500, 502, 503, 504]) {
    assert.equal(shouldEndSession({ status }), false, String(status));
  }
  assert.equal(shouldEndSession({}), false);
  assert.equal(shouldEndSession(null), false);
  assert.equal(shouldEndSession(undefined), false);
  assert.equal(shouldEndSession(new Error("SecureStore failed") as never), false);
});

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");

test("the refresh handler rethrows what shouldEndSession says is not a rejection, and the interceptor only logs out on null", () => {
  const auth = read("../src/context/AuthContext.tsx");
  assert.match(auth, /if \(shouldEndSession\(error as RefreshFailure\)\) \{\s*return null;\s*\}\s*throw error;/);
  const client = read("../src/api/client.ts");
  assert.match(client, /newAccessToken = undefined;/);
  assert.match(client, /if \(newAccessToken === null && !isNonCritical\) \{\s*onAuthFailure\(\);/);
});
