// When may a failed token refresh end the session? Only when the server actually REJECTED the refresh token.
// Being offline, timing out, a rate limit (429) or a server error (5xx) says nothing about the token, so
// none of them may log the user out. Pure so it can be unit-tested with Node (tests/sessionPolicy.test.ts).

export interface RefreshFailure {
  status?: number;
  code?: string;
}

const REJECTED_STATUSES = new Set([400, 401, 403]);

export const shouldEndSession = (failure: RefreshFailure | null | undefined): boolean => {
  if (!failure || failure.code === "NETWORK_ERROR") return false;
  return failure.status !== undefined && REJECTED_STATUSES.has(failure.status);
};
