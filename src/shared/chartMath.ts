// Pure geometry for the hand-drawn react-native-svg charts (no chart library
// is installed) — kept free of React so it can be checked on its own.

/** Maps `value` from [domainMin, domainMax] onto [rangeStart, rangeEnd]; a zero-width domain lands mid-range. */
export const scaleLinear = (
  value: number,
  domainMin: number,
  domainMax: number,
  rangeStart: number,
  rangeEnd: number
): number => {
  if (domainMax === domainMin) {
    return (rangeStart + rangeEnd) / 2;
  }
  return rangeStart + ((value - domainMin) / (domainMax - domainMin)) * (rangeEnd - rangeStart);
};

/** Centers of `count` equal-width columns across `width` — where bars sit and where day labels center. */
export const columnCenters = (count: number, width: number): number[] =>
  Array.from({ length: count }, (_, i) => ((i + 0.5) * width) / count);

/** `count` x positions from `pad` to `width - pad` inclusive — the points of a plain line. */
export const evenlySpaced = (count: number, width: number, pad: number): number[] => {
  if (count <= 1) {
    return [width / 2];
  }
  const step = (width - 2 * pad) / (count - 1);
  return Array.from({ length: count }, (_, i) => pad + i * step);
};

/** SVG `<Polyline points>` string. */
export const toPolylinePoints = (xs: number[], ys: number[]): string =>
  xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");

/** Percent change first -> last, or null when it's undefined (first is 0). */
export const percentChange = (first: number, last: number): number | null =>
  first === 0 ? null : ((last - first) / first) * 100;
