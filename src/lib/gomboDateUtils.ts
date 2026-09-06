/**
 * gomboDateUtils.ts
 * Utilitaire centralisé de vérification de date/heure d'expiration des Gombos & Renforts.
 */

export interface GomboDateInfo {
  date?: string;
  time?: string;
  heure?: string;
  eventDate?: string;
  eventTime?: string;
  status?: string;
  statut?: string;
  [key: string]: any;
}

/**
 * Extrait un objet Date JS représentant la date/heure de prestation prévue.
 *
 * Supporte :
 * - date : "YYYY-MM-DD" ou "DD/MM/YYYY" ou ISO string
 * - time / heure : "HH:MM" ou "HHhMM" ou "HHh"
 */
export function getGomboEventDateTime(item: GomboDateInfo): Date | null {
  if (!item) return null;

  const rawDate = item.date || item.eventDate || "";
  if (!rawDate) return null;

  // Normalisation du string date
  let dateStr = "";
  if (typeof rawDate === "string") {
    dateStr = rawDate.trim();
  } else if (rawDate && typeof (rawDate as any).toDate === "function") {
    try {
      return (rawDate as any).toDate();
    } catch {
      return null;
    }
  }

  if (!dateStr) return null;

  // Extraction YYYY, MM, DD
  let year = 0;
  let month = 0; // 0-indexed
  let day = 0;

  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const parts = dateStr.slice(0, 10).split("-");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    const parts = dateStr.slice(0, 10).split("/");
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  } else {
    // Essai parsing standard Date
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      year = parsed.getFullYear();
      month = parsed.getMonth();
      day = parsed.getDate();
    } else {
      return null;
    }
  }

  // Extraction Heure (time ou heure)
  const rawTime = (item.time || item.heure || item.eventTime || "23:59").toString().trim();
  let hours = 23;
  let minutes = 59;

  if (rawTime) {
    // Format "18:30" ou "18h30" ou "18h" ou "18"
    const match = rawTime.match(/(\d{1,2})[:hH]?(\d{1,2})?/);
    if (match) {
      hours = parseInt(match[1], 10);
      if (match[2]) {
        minutes = parseInt(match[2], 10);
      } else {
        minutes = 0;
      }
    }
  }

  const resultDate = new Date(year, month, day, hours, minutes, 0, 0);
  return isNaN(resultDate.getTime()) ? null : resultDate;
}

/**
 * Vérifie si une opportunité Gombo/Renfort est expirée.
 * 
 * Un Gombo est expiré si :
 * 1. Son statut Firestore indique explicitement l'archivage ("archive", "archived", "expired", "termine", "completed").
 * 2. OU sa date/heure de prestation est strictement antérieure à la date/heure actuelle (now).
 */
export function isGomboExpired(item: GomboDateInfo, now: Date = new Date()): boolean {
  if (!item) return false;

  const st = (item.status || item.statut || "").toString().toLowerCase().trim();
  if (st === "archive" || st === "archived" || st === "expired" || st === "termine" || st === "completed" || st === "annule" || st === "cancelled") {
    return true;
  }

  const eventDateTime = getGomboEventDateTime(item);
  if (!eventDateTime) {
    // Si aucune date renseignée, la publication reste active par défaut
    return false;
  }

  return now.getTime() > eventDateTime.getTime();
}

/**
 * Filtre un tableau d'opportunités en excluant celles qui sont expirées.
 */
export function filterActiveGombos<T extends GomboDateInfo>(items: T[], now: Date = new Date()): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter(item => !isGomboExpired(item, now));
}

/**
 * Filtre un tableau d'opportunités pour ne garder QUE celles qui sont expirées ou archivées.
 */
export function filterArchivedGombos<T extends GomboDateInfo>(items: T[], now: Date = new Date()): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter(item => isGomboExpired(item, now));
}
