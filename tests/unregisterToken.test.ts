import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { unregisterWithFallback, type UnregisterHttp } from "../src/features/notifications/unregisterToken.ts";

const fakeHttp = (postError?: unknown, deleteError?: unknown) => {
  const calls: Array<{ method: string; url: string; payload: unknown }> = [];
  const http: UnregisterHttp = {
    post: async (url, body) => {
      calls.push({ method: "POST", url, payload: body });
      if (postError) throw postError;
    },
    delete: async (url, config) => {
      calls.push({ method: "DELETE", url, payload: config });
      if (deleteError) throw deleteError;
    },
  };
  return { http, calls };
};

test("the token goes in the request body of POST /notifications/device-tokens/unregister, never in a URL", async () => {
  const { http, calls } = fakeHttp();
  await unregisterWithFallback(http, "abc:secret-token");
  assert.deepEqual(calls, [{ method: "POST", url: "/notifications/device-tokens/unregister", payload: { token: "abc:secret-token" } }]);
  assert.equal(calls[0].url.includes("secret"), false);
});

test("an older server (404 or 405) gets the old DELETE ?token= as a fallback", async () => {
  for (const status of [404, 405]) {
    const { http, calls } = fakeHttp({ status, code: "NOT_FOUND" });
    await unregisterWithFallback(http, "tok");
    assert.deepEqual(calls.map((c) => c.method), ["POST", "DELETE"], String(status));
    assert.deepEqual(calls[1], { method: "DELETE", url: "/notifications/device-tokens", payload: { params: { token: "tok" } } });
  }
});

test("any other failure is rethrown without a fallback (offline, 5xx, 401, 429)", async () => {
  for (const error of [{ code: "NETWORK_ERROR" }, { status: 500 }, { status: 401 }, { status: 429 }, new Error("boom")]) {
    const { http, calls } = fakeHttp(error);
    await assert.rejects(unregisterWithFallback(http, "tok"));
    assert.deepEqual(calls.map((c) => c.method), ["POST"], "no DELETE fallback");
  }
});

test("if the fallback also fails, that failure is what the caller sees", async () => {
  const { http } = fakeHttp({ status: 404 }, { status: 500 });
  await assert.rejects(unregisterWithFallback(http, "tok"), { status: 500 });
});

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");

test("wiring: the service uses the helper, and logout still caps the wait and swallows the failure", () => {
  assert.match(read("../src/features/notifications/notificationService.ts"), /unregisterWithFallback\(apiClient, token\)/);
  // pushNotifications.unregisterPushToken swallows every failure
  assert.match(read("../src/notifications/pushNotifications.ts"), /catch \(error\) \{\s*console\.warn\("Push token unregistration failed:"/);
  // and logout waits at most 4 s for it
  const auth = read("../src/context/AuthContext.tsx");
  assert.match(auth, /PUSH_UNREGISTER_WAIT_MS = 4000/);
  assert.match(auth, /Promise\.race\(\[unregisterPushToken\(\)/);
});
