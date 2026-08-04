/**
 * AFRIGOMBO ELITE - JSON UTILITIES
 * Provides safe serialization helpers to prevent circular reference crashes.
 */

export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  };
};

/**
 * Safely stringifies an object, handling circular references.
 * @param obj The object to stringify
 * @param space Optional spacing for indentation
 * @returns A JSON string or "null" on failure
 */
export const safeStringify = (obj: any, space?: string | number): string => {
  try {
    return JSON.stringify(obj, getCircularReplacer(), space);
  } catch (err) {
    console.error("Critical error during safeStringify:", err);
    return "null";
  }
};
