import { useState, useEffect } from "react";

export function useDynamicPlaceholder(placeholders: string[], interval: number = 3000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % placeholders.length);
    }, interval);
    return () => clearInterval(timer);
  }, [placeholders, interval]);
  return placeholders[index];
}
