import { useEffect, useState } from "react";

/**
 * Debounce a value with a specified delay.
 * Useful for reducing re-renders on frequently changing values like streaming text.
 */
export function useDebouncedValue<T>(value: T, delay: number = 150): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
