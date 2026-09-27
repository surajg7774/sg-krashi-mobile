import { useEffect, useState } from "react";

// Same pattern as sg-krashi-client's useDebounce hook (src/shared/hooks/useDebounce.ts)
// — delays updating the returned value until `value` has stopped changing
// for `delayMs`, so a fast typist doesn't fire one search request per
// keystroke.
export const useDebouncedValue = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
};
