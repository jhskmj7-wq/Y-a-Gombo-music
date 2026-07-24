import { useState, useEffect, useRef } from "react";

export function useDynamicPlaceholder(placeholders: string[] = [], interval: number = 3000): string {
  const [index, setIndex] = useState<number>(0);
  const placeholdersRef = useRef<string[]>(placeholders);

  useEffect(() => {
    if (Array.isArray(placeholders) && placeholders.length > 0) {
      placeholdersRef.current = placeholders;
    }
  }, [placeholders]);

  useEffect(() => {
    const timer = setInterval(() => {
      const list = placeholdersRef.current;
      if (list && list.length > 0) {
        setIndex((prev) => (prev + 1) % list.length);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  const list = placeholdersRef.current && placeholdersRef.current.length > 0 ? placeholdersRef.current : placeholders;
  if (!list || list.length === 0) {
    return "";
  }

  return list[index % list.length] || list[0] || "";
}

