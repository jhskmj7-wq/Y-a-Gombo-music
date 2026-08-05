/**
 * AFRIGOMBO - JSON UTILITIES
 * Provides safe serialization helpers to prevent circular reference crashes and non-serializable DOM/Firebase errors.
 */

export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    // Strip out functions which can hold closures with circular references
    if (typeof value === "function") {
      return undefined;
    }

    if (typeof value === "object" && value !== null) {
      // 1. Filter out DOM Nodes, Window, Event, HTMLMediaElement/Audio/Image, AudioContext
      if (
        (typeof window !== "undefined" && (value === window || value === document)) ||
        (typeof Node !== "undefined" && value instanceof Node) ||
        (typeof Event !== "undefined" && value instanceof Event) ||
        (typeof HTMLMediaElement !== "undefined" && value instanceof HTMLMediaElement) ||
        (typeof HTMLAudioElement !== "undefined" && value instanceof HTMLAudioElement) ||
        (typeof HTMLImageElement !== "undefined" && value instanceof HTMLImageElement) ||
        value.nodeType !== undefined ||
        value.$$typeof !== undefined || // React Element
        value._reactInternals !== undefined || // React Fiber
        value._reactFiber !== undefined
      ) {
        return undefined;
      }

      // 2. Filter out Firestore / Firebase internal instances with circular references
      if (
        value._firestore !== undefined ||
        value._db !== undefined ||
        (value.constructor && (
          value.constructor.name === "Firestore" ||
          value.constructor.name === "DocumentReference" ||
          value.constructor.name === "QuerySnapshot"
        ))
      ) {
        return value.id || value.path || "[FirebaseRef]";
      }

      // 3. Cycle detection
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }

    return value;
  };
};

/**
 * Safely stringifies an object, handling circular references and non-serializable objects.
 * @param obj The object to stringify
 * @param space Optional spacing for indentation
 * @returns A JSON string or "{}" on failure
 */
export const safeStringify = (obj: any, space?: string | number): string => {
  if (obj === undefined) return "undefined";
  if (obj === null) return "null";
  try {
    return JSON.stringify(obj, getCircularReplacer(), space);
  } catch (err) {
    console.error("Critical error during safeStringify:", err);
    try {
      // Fallback: simple sanitized clone keeping only primitives
      const sanitized: Record<string, any> = {};
      if (obj && typeof obj === "object") {
        for (const k of Object.keys(obj)) {
          const val = obj[k];
          const t = typeof val;
          if (t === "string" || t === "number" || t === "boolean" || val === null) {
            sanitized[k] = val;
          }
        }
      }
      return JSON.stringify(sanitized, null, space);
    } catch {
      return "{}";
    }
  }
};

/**
 * Safely clones an object by serializing and deserializing with circular protection
 */
export const safeJsonClone = <T = any>(data: T): T => {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;
  try {
    const jsonStr = safeStringify(data);
    return JSON.parse(jsonStr) as T;
  } catch {
    return data;
  }
};

/**
 * Safely parses JSON string or returns fallback
 */
export const safeJsonParse = <T = any>(str: string | null | undefined, fallback: T): T => {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
};

