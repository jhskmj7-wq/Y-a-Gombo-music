/**
 * AFRIGOMBO ELITE - FIRESTORE SANITIZER UTILITY
 * Prevents "Unsupported field value: undefined" errors by sanitizing
 * objects before sending them to Firestore (setDoc, updateDoc, writeBatch, runTransaction, addDoc).
 */

export function sanitizeForFirestore<T>(obj: T, seen = new WeakSet()): T {
  if (obj === undefined) {
    return null as any;
  }
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (seen.has(obj)) {
    return null as any;
  }
  seen.add(obj);

  if (obj instanceof Date) {
    return obj;
  }

  // Preserve Firestore FieldValues (arrayUnion, arrayRemove, increment, serverTimestamp, deleteField)
  if (
    (obj as any)._methodName ||
    (obj as any).isEqual ||
    (obj as any).constructor?.name === "FieldValue" ||
    (obj as any).constructor?.name === "FieldValueImpl"
  ) {
    return obj;
  }

  // Filter out DOM Nodes, Window, Event, HTML elements, functions, React objects
  if (
    (typeof window !== "undefined" && (obj === (window as any) || obj === (document as any))) ||
    (typeof Node !== "undefined" && obj instanceof Node) ||
    (typeof Event !== "undefined" && obj instanceof Event) ||
    (obj as any).nodeType !== undefined ||
    (obj as any).tagName !== undefined ||
    (obj as any).ownerDocument !== undefined ||
    (obj as any).addEventListener !== undefined ||
    (obj as any).$$typeof !== undefined
  ) {
    return null as any;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item, seen)) as any;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && typeof value !== "function") {
      cleaned[key] = sanitizeForFirestore(value, seen);
    }
  }
  return cleaned as T;
}
