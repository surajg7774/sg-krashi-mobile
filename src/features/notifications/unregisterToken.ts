// Logout unregisters this device's push token. The new endpoint takes the token in a request BODY (a token in the
// query string ends up in server and proxy logs): POST /notifications/device-tokens/unregister {token}. An older
// server doesn't have it and answers 404/405, so ONLY then the old DELETE ?token= is used instead; any other failure
// (offline, 5xx, 401...) is rethrown to the caller, which treats unregistering as best-effort and never blocks logout.
// Pure (the HTTP client is passed in) so it can be unit-tested with Node (tests/unregisterToken.test.ts).

export interface UnregisterHttp {
  post: (url: string, body: { token: string }) => Promise<unknown>;
  delete: (url: string, config: { params: { token: string } }) => Promise<unknown>;
}

const URL = "/notifications/device-tokens";

export const unregisterWithFallback = async (http: UnregisterHttp, token: string): Promise<void> => {
  try {
    await http.post(`${URL}/unregister`, { token });
  } catch (error) {
    const status = (error as { status?: unknown } | null)?.status;
    if (status === 404 || status === 405) {
      await http.delete(URL, { params: { token } });
      return;
    }
    throw error;
  }
};
