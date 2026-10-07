// What to show when a request fails. Pure, so it is unit-tested with Node (tests/i18n.test.ts).
//
// Server messages are server data and are shown as sent (docs/I18N_DECISIONS.md, D2): the field-level `details` when
// there are any, else the server's `message`, else the app's own (translated) fallback - exactly what every screen
// did before. The one exception: a network failure carries the HTTP library's English ("Network Error"), not a server
// message, so outside English it becomes the translated "no connection" text. English output is unchanged.
import type { Lang } from "./index.ts";

interface ErrorLike {
  code?: unknown;
  message?: unknown;
  details?: unknown;
}

export interface ErrorTextOptions {
  /** Use the server's per-field `details` when present (default true; some screens only ever showed `message`). */
  details?: boolean;
}

export const errorText = (
  error: unknown,
  fallback: string,
  context: { lang: Lang; networkText: string },
  options: ErrorTextOptions = {}
): string => {
  const e: ErrorLike = typeof error === "object" && error !== null ? (error as ErrorLike) : {};
  if (context.lang !== "en" && e.code === "NETWORK_ERROR") return context.networkText;
  const details =
    options.details !== false && Array.isArray(e.details) && e.details.length > 0 ? e.details.join("\n") : null;
  const message = typeof e.message === "string" ? e.message : "";
  return details || message || fallback;
};
