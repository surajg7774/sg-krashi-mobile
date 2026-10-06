// Smaller copies of photos, for the sizes the app actually shows them at.
// Import-free on purpose: it is unit-tested with Node directly (tests/media.test.ts).

/**
 * Display widths in pixels (about 3x the point size of a phone screen, so photos stay sharp) for each place a
 * photo appears. A copy is never enlarged: Cloudinary's c_limit only shrinks.
 */
export const MEDIA_WIDTH = {
  /** two-column catalogue cards (about 170 pt wide) */
  card: 640,
  /** horizontal recommendation rails (130 pt wide cards) */
  rail: 400,
  /** the main photo on a detail screen (full screen width) */
  detail: 1080,
  /** small thumbnails in list rows: cart, orders, farmer listings (about 56 pt) */
  row: 240,
} as const;

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;

/**
 * For a plain Cloudinary photo, the address of a copy at most `width` px wide, in the best format the phone
 * accepts (f_auto) and automatic quality (q_auto). The stored original is untouched.
 *
 * Anything else is returned exactly as it came: another host, a relative path, a placeholder, or a Cloudinary
 * address that already carries a transformation (so calling this twice changes nothing the second time).
 * A missing or empty address gives undefined, which is what expo-image takes for "no image".
 */
export const resizedMediaUrl = (url: string | null | undefined, width: number): string | undefined => {
  if (typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (trimmed === "") return undefined;
  const match = CLOUDINARY_UPLOAD.exec(trimmed);
  return match ? `${match[1]}f_auto,q_auto,c_limit,w_${width}/${match[2]}` : trimmed;
};
