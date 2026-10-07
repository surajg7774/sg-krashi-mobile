// Weather is looked up for a place, not a point: two GPS fixes a few metres apart must hit the same cached forecast
// (otherwise the offline copy would almost never match the key). Two decimals is about 1 km, finer than the forecast grid.
// Pure so it can be unit-tested with Node (tests/offlineScreenState.test.ts).
export const roundCoordinate = (value: number): number => Math.round(value * 100) / 100;
