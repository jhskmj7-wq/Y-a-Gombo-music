/**
 * AFRIGOMBO Publication Engine
 * Manages normalized status, expiration, and active feed filters.
 */

export type NormalizedStatus = "draft" | "active" | "expired" | "archived" | "deleted" | "suspended";

export interface PublicationBase {
  id?: string;
  status?: string;
  statut?: string;
  visible?: boolean;
  adminValidated?: boolean;
  isArchived?: boolean;
  expiresAt?: string | number;
  expiresAtTimestamp?: number;
  date?: string;
  createdAt?: string | number;
  [key: string]: any;
}

/**
 * Compute the canonical status of a publication
 */
export function getPublicationStatus(data: PublicationBase): NormalizedStatus {
  const rawSt = String(data.status || data.statut || "").toLowerCase();
  
  if (rawSt === "deleted" || data.isDeleted) {
    return "deleted";
  }
  if (rawSt === "archived" || rawSt === "archivee" || rawSt === "archivée" || data.isArchived) {
    return "archived";
  }
  if (rawSt === "suspended" || rawSt === "suspendue" || data.visible === false) {
    return "suspended";
  }
  if (rawSt === "draft" || rawSt === "brouillon") {
    return "draft";
  }

  // Check expiration time
  const now = Date.now();
  let expTime: number | null = null;

  if (data.expiresAt) {
    expTime = typeof data.expiresAt === "number" ? data.expiresAt : new Date(data.expiresAt).getTime();
  } else if (data.expiresAtTimestamp) {
    expTime = Number(data.expiresAtTimestamp);
  } else if (data.date) {
    const d = new Date(`${data.date}T23:59:59.999Z`);
    if (!isNaN(d.getTime())) {
      expTime = d.getTime();
    }
  }

  if (expTime && !isNaN(expTime) && expTime <= now) {
    return "expired";
  }

  if (rawSt === "expired" || rawSt === "expiree" || rawSt === "expirée") {
    return "expired";
  }

  return "active";
}

/**
 * Determine if a publication is active and eligible for active public feeds
 */
export function isPublicationActive(data: PublicationBase): boolean {
  if (data.visible === false || data.adminValidated === false) {
    return false;
  }

  const computedStatus = getPublicationStatus(data);
  return computedStatus === "active";
}

/**
 * Filter an array of publications for active public feeds
 */
export function filterActivePublications<T extends PublicationBase>(items: T[]): T[] {
  return items.filter(isPublicationActive);
}
