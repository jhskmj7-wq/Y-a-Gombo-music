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
    if (val instanceof Error) return `${val.name}: ${val.message}${val.stack ? `\n${val.stack}` : ""}`;

    const tag = Object.prototype.toString.call(val);
    
    // Safely extract primitive fields for DOM Event objects (like beforeinstallprompt)
    if (tag.includes("Event") || (val.type && (val.preventDefault || val.stopPropagation))) {
      return {
        type: String(val.type || "event"),
        timeStamp: typeof val.timeStamp === "number" ? val.timeStamp : Date.now(),
        defaultPrevented: Boolean(val.defaultPrevented),
      };
    }

    // Check for DOM elements, Audio/Video/Media objects, ServiceWorkers, Windows, React Fibers, AudioContext, Promises, etc.
    const isDomOrMedia =
      tag.startsWith("[object HTML") ||
      tag.startsWith("[object SVG") ||
      tag.includes("Audio") ||
      tag.includes("Media") ||
      tag.includes("Video") ||
      tag.includes("Canvas") ||
      tag.includes("Element") ||
      tag.includes("Event") ||
      tag.includes("Window") ||
      tag.includes("Document") ||
      tag.includes("Node") ||
      tag.includes("Context") ||
      tag.includes("Stream") ||
      tag.includes("Track") ||
      tag.includes("Source") ||
      tag.includes("Buffer") ||
      tag.includes("Reader") ||
      tag.includes("Request") ||
      tag.includes("Response") ||
      tag.includes("Channel") ||
      tag.includes("Port") ||
      tag.includes("Worker") ||
      tag.includes("Fiber") ||
      tag.includes("Synthetic") ||
      tag.includes("Promise") ||
      tag.includes("Registration") ||
      val.nodeType !== undefined ||
      val.tagName !== undefined ||
      val.nodeName !== undefined ||
      val.ownerDocument !== undefined ||
      val.addEventListener !== undefined ||
      val.removeEventListener !== undefined ||
      val.dispatchEvent !== undefined ||
      val.$$typeof !== undefined ||
      val._reactInternals !== undefined ||
      val._reactFiber !== undefined ||
      typeof val.play === "function" ||
      typeof val.pause === "function" ||
      typeof val.load === "function" ||
      typeof val.getContext === "function" ||
      typeof val.then === "function";

    if (isDomOrMedia) {
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
    const keys = Object.keys(val);
    for (const key of keys) {
      if (key === "toJSON") continue; // Never pass un-sanitized toJSON function onto plain objects
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
    if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint" || key === "toJSON") {
      return undefined;
    }

    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);

      const tag = Object.prototype.toString.call(value);
      const isDomOrMedia =
        tag.startsWith("[object HTML") ||
        tag.startsWith("[object SVG") ||
        tag.includes("Audio") ||
        tag.includes("Media") ||
        tag.includes("Video") ||
        tag.includes("Canvas") ||
        tag.includes("Element") ||
        tag.includes("Event") ||
        tag.includes("Window") ||
        tag.includes("Document") ||
        tag.includes("Node") ||
        tag.includes("Context") ||
        tag.includes("Stream") ||
        tag.includes("Track") ||
        tag.includes("Source") ||
        tag.includes("Buffer") ||
        tag.includes("Reader") ||
        tag.includes("Request") ||
        tag.includes("Response") ||
        tag.includes("Channel") ||
        tag.includes("Port") ||
        tag.includes("Worker") ||
        tag.includes("Fiber") ||
        tag.includes("Synthetic") ||
        tag.includes("Promise") ||
        tag.includes("Registration") ||
        value.nodeType !== undefined ||
        value.tagName !== undefined ||
        value.nodeName !== undefined ||
        value.ownerDocument !== undefined ||
        value.addEventListener !== undefined ||
        value.removeEventListener !== undefined ||
        value.dispatchEvent !== undefined ||
        value.$$typeof !== undefined ||
        value._reactInternals !== undefined ||
        value._reactFiber !== undefined ||
        typeof value.play === "function" ||
        typeof value.pause === "function" ||
        typeof value.load === "function" ||
        typeof value.getContext === "function" ||
        typeof value.then === "function";

      if (isDomOrMedia) {
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
  if (typeof obj === "string") return obj;
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);

  try {
    const clean = deepSanitize(obj);
    return JSON.stringify(clean, null, space);
  } catch (_) {
    try {
      if (obj instanceof Error) return `${obj.name}: ${obj.message}`;
      if (typeof obj === "object") {
        return `[Object ${obj.constructor ? obj.constructor.name : "Unknown"}]`;
      }
      return String(obj);
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


