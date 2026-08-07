/**
 * AFRIGOMBO - JSON UTILITIES
 * Provides safe serialization helpers to prevent circular reference crashes and non-serializable DOM/Firebase errors.
 */

export function deepSanitize(val: any, seen = new WeakSet()): any {
  if (val === null || val === undefined) return val;
  const t = typeof val;
  if (t === "number" || t === "string" || t === "boolean") return val;
  if (t === "function" || t === "symbol" || t === "bigint") return undefined;

  if (t === "object") {
    if (seen.has(val)) return "[Circular]";
    seen.add(val);

    if (val instanceof Date) return val.toISOString();

    const tag = Object.prototype.toString.call(val);
    if (
      tag.startsWith("[object HTML") ||
      tag.startsWith("[object SVG") ||
      tag === "[object Window]" ||
      tag === "[object Document]" ||
      tag === "[object Event]" ||
      tag === "[object AudioContext]" ||
      tag === "[object MediaStream]" ||
      tag === "[object CanvasRenderingContext2D]" ||
      tag === "[object Node]" ||
      val.nodeType !== undefined ||
      val.tagName !== undefined ||
      val.nodeName !== undefined ||
      val.ownerDocument !== undefined ||
      val.addEventListener !== undefined ||
      val.$$typeof !== undefined ||
      val._reactInternals !== undefined ||
      val._reactFiber !== undefined ||
      (val.src !== undefined && (
        typeof val.src !== "string" ||
        typeof val.play === "function" ||
        val.naturalWidth !== undefined ||
        val.complete !== undefined ||
        val.currentSrc !== undefined
      ))
    ) {
      return undefined;
    }

    if (
      val._firestore !== undefined ||
      val._db !== undefined ||
      val._delegate !== undefined ||
      (val.constructor && (
        val.constructor.name === "Firestore" ||
        val.constructor.name === "DocumentReference" ||
        val.constructor.name === "QuerySnapshot" ||
        val.constructor.name === "ResourcePath" ||
        val.constructor.name === "FieldPath"
      ))
    ) {
      return typeof val.id === "string" ? val.id : (typeof val.path === "string" ? val.path : "[FirebaseRef]");
    }

    if (Array.isArray(val)) {
      return val
        .map((item) => deepSanitize(item, seen))
        .filter((item) => item !== undefined);
    }

    const out: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      try {
        const child = val[key];
        const cleaned = deepSanitize(child, seen);
        if (cleaned !== undefined) {
          out[key] = cleaned;
        }
      } catch {
        // Ignore getters that throw errors
      }
    }
    return out;
  }

  return undefined;
}

export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === "function" || typeof value === "symbol") {
      return undefined;
    }

    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);

      const tag = Object.prototype.toString.call(value);
      if (
        tag.startsWith("[object HTML") ||
        tag.startsWith("[object SVG") ||
        tag === "[object Window]" ||
        tag === "[object Document]" ||
        tag === "[object Event]" ||
        tag === "[object AudioContext]" ||
        tag === "[object MediaStream]" ||
        tag === "[object CanvasRenderingContext2D]" ||
        tag === "[object Node]" ||
        value.nodeType !== undefined ||
        value.tagName !== undefined ||
        value.nodeName !== undefined ||
        value.ownerDocument !== undefined ||
        value.addEventListener !== undefined ||
        value.$$typeof !== undefined ||
        value._reactInternals !== undefined ||
        value._reactFiber !== undefined ||
        (value.src !== undefined && (
          typeof value.src !== "string" ||
          typeof value.play === "function" ||
          value.naturalWidth !== undefined ||
          value.complete !== undefined ||
          value.currentSrc !== undefined
        ))
      ) {
        return undefined;
      }

      if (
        value._firestore !== undefined ||
        value._db !== undefined ||
        value._delegate !== undefined ||
        (value.constructor && (
          value.constructor.name === "Firestore" ||
          value.constructor.name === "DocumentReference" ||
          value.constructor.name === "QuerySnapshot" ||
          value.constructor.name === "ResourcePath" ||
          value.constructor.name === "FieldPath"
        ))
      ) {
        const idStr = typeof value.id === "string" ? value.id : (typeof value.path === "string" ? value.path : null);
        return idStr || "[FirebaseRef]";
      }
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
    const clean = deepSanitize(obj);
    return JSON.stringify(clean, null, space);
  } catch (err) {
    console.error("Critical error during safeStringify:", err);
    try {
      return JSON.stringify(obj, getCircularReplacer(), space);
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
    const clean = deepSanitize(data);
    return clean as T;
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


