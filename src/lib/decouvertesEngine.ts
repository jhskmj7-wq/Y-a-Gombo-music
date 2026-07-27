import { db } from "./firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";

export interface FeaturedContentDoc {
  id: string;
  type: "market" | "academy";
  sourceId: string;
  title: string;
  description: string;
  price: number;
  priceText?: string;
  city: string; // Commune or location e.g. "Cocody, Abidjan"
  duration?: string; // e.g. "4h 30m" for courses
  level?: string; // e.g. "Débutant", "Intermédiaire", "Masterclass"
  category?: "instruments" | "studio" | "sonorisation" | "services" | "accessoires" | "mao" | "mixage" | "burida" | "vocal" | "business";
  imageUrl: string;
  priority: number; // Higher number = higher priority
  pinned: boolean;
  hidden: boolean;
  viewsCount?: number;
  clicksCount?: number;
  createdAt: number;
  updatedAt?: number;
}

// User local preference tracking key
const USER_PREF_KEY = "afrigombo_decouvertes_prefs_v1";

export interface UserPreferences {
  marketCount: number;
  academyCount: number;
  lastCategoryClicked?: string;
}

export function getUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(USER_PREF_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}
  return { marketCount: 0, academyCount: 0 };
}

export function recordUserPreferenceClick(type: "market" | "academy", category?: string) {
  try {
    const prefs = getUserPreferences();
    if (type === "market") {
      prefs.marketCount = (prefs.marketCount || 0) + 1;
    } else {
      prefs.academyCount = (prefs.academyCount || 0) + 1;
    }
    if (category) prefs.lastCategoryClicked = category;
    localStorage.setItem(USER_PREF_KEY, JSON.stringify(prefs));
  } catch (_) {}
}

/**
 * DEFAULT SEED ITEMS FOR DISCOVERY FEED
 * These ensure immediate rich content if Firestore collection is empty
 */
export const DEFAULT_FEATURED_ITEMS: FeaturedContentDoc[] = [
  {
    id: "feat_yamaha_xf8",
    type: "market",
    sourceId: "item-1",
    title: "Synthétiseur Yamaha Motif XF8",
    description: "Clavier professionnel 88 touches touché lourd, idéal studio climatisé & live.",
    price: 850000,
    priceText: "850 000 FCFA",
    city: "Cocody, Abidjan",
    category: "instruments",
    imageUrl: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600",
    priority: 10,
    pinned: true,
    hidden: false,
    viewsCount: 340,
    clicksCount: 88,
    createdAt: Date.now() - 3600000 * 24
  },
  {
    id: "feat_masterclass_mao",
    type: "academy",
    sourceId: "course-1",
    title: "Masterclass M.A.O : Composition Afrobeats",
    description: "FL Studio 21 & Ableton : créez vos drumskits et synthés Afrobeats de A à Z.",
    price: 15000,
    priceText: "15 000 FCFA",
    city: "Abidjan / En ligne",
    duration: "4h 30m",
    level: "Intermédiaire",
    category: "mao",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
    priority: 9,
    pinned: true,
    hidden: false,
    viewsCount: 520,
    clicksCount: 142,
    createdAt: Date.now() - 3600000 * 12
  },
  {
    id: "feat_shure_sm7b",
    type: "market",
    sourceId: "item-2",
    title: "Microphone Shure SM7B + Focusrite 2i2",
    description: "Pack studio complet vocal & podcast avec câbles XLR Mogami offerts.",
    price: 280000,
    priceText: "280 000 FCFA",
    city: "Marcory Zone 4, Abidjan",
    category: "studio",
    imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600",
    priority: 8,
    pinned: false,
    hidden: false,
    viewsCount: 290,
    clicksCount: 64,
    createdAt: Date.now() - 3600000 * 36
  },
  {
    id: "feat_burida_guide",
    type: "academy",
    sourceId: "course-2",
    title: "Guide Juridique BURIDA & Droits d'Auteur",
    description: "Protéger vos œuvres en Côte d'Ivoire & percevoir vos redevances streaming.",
    price: 0,
    priceText: "GRATUIT",
    city: "Plateau, Abidjan",
    duration: "2h 15m",
    level: "Débutant",
    category: "burida",
    imageUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800",
    priority: 7,
    pinned: false,
    hidden: false,
    viewsCount: 1280,
    clicksCount: 310,
    createdAt: Date.now() - 3600000 * 5
  },
  {
    id: "feat_behringer_x32",
    type: "market",
    sourceId: "item-3",
    title: "Behringer X32 Compact Numérique",
    description: "Console de mixage 40 canaux pour concert live & enregistrement studio.",
    price: 1250000,
    priceText: "1 250 000 FCFA",
    city: "Yopougon, Abidjan",
    category: "sonorisation",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600",
    priority: 6,
    pinned: false,
    hidden: false,
    viewsCount: 190,
    clicksCount: 45,
    createdAt: Date.now() - 3600000 * 48
  },
  {
    id: "feat_mixage_vocal",
    type: "academy",
    sourceId: "course-3",
    title: "Techniques de Mixage Vocal Afropop",
    description: "Égalisation chirurgicale, compression parallèle et clarté radio studio.",
    price: 25000,
    priceText: "25 000 FCFA",
    city: "Riviera, Abidjan",
    duration: "3h 45m",
    level: "Avancé",
    category: "mixage",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800",
    priority: 5,
    pinned: false,
    hidden: false,
    viewsCount: 410,
    clicksCount: 95,
    createdAt: Date.now() - 3600000 * 18
  }
];

/**
 * Calculate Recommendation Score for Fil Découvertes
 * Priority Order:
 * 1. Pinned (forces top)
 * 2. Location match (+30 pts)
 * 3. Personalized user preference bias (+20 pts)
 * 4. Popularity (views/clicks)
 * 5. Nouveauté (recency)
 * 6. Explicit priority set by Admin
 */
export function calculateDecouvertesScore(
  item: FeaturedContentDoc,
  userLocation: string = "Abidjan"
): number {
  let score = item.priority * 10;

  // 1. Pinned bonus
  if (item.pinned) score += 500;

  // 2. Proximity match
  const locLower = userLocation.toLowerCase().trim();
  const cityLower = item.city.toLowerCase().trim();
  if (locLower && cityLower.includes(locLower)) {
    score += 40;
  } else if (cityLower.includes("abidjan")) {
    score += 15;
  }

  // 3. Personalized user preferences
  const prefs = getUserPreferences();
  if (prefs.marketCount > prefs.academyCount && item.type === "market") {
    score += 25;
  } else if (prefs.academyCount > prefs.marketCount && item.type === "academy") {
    score += 25;
  }

  // 4. Popularity
  score += Math.min(100, ((item.viewsCount || 0) * 0.1) + ((item.clicksCount || 0) * 0.5));

  // 5. Nouveauté / Recency decay
  const hoursOld = Math.max(0, (Date.now() - item.createdAt) / 3600000);
  const recencyBonus = Math.max(0, 30 - hoursOld * 0.5);
  score += recencyBonus;

  return Math.round(score);
}

/**
 * Firestore Helper Functions
 */
export async function saveOrUpdateFeaturedDoc(docData: Partial<FeaturedContentDoc> & { id: string }) {
  try {
    const docRef = doc(db, "featuredContent", docData.id);
    const payload = {
      ...docData,
      updatedAt: Date.now()
    };
    await setDoc(docRef, payload, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.error("Error saving featured doc:", err);
    return { success: false, message: err.message };
  }
}

export async function togglePinFeaturedDoc(docId: string, currentPinned: boolean) {
  try {
    const docRef = doc(db, "featuredContent", docId);
    await setDoc(docRef, { pinned: !currentPinned, updatedAt: Date.now() }, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.error("Error toggling pin:", err);
    return { success: false, message: err.message };
  }
}

export async function toggleHideFeaturedDoc(docId: string, currentHidden: boolean) {
  try {
    const docRef = doc(db, "featuredContent", docId);
    await setDoc(docRef, { hidden: !currentHidden, updatedAt: Date.now() }, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.error("Error toggling hide:", err);
    return { success: false, message: err.message };
  }
}

export async function removeFeaturedDoc(docId: string) {
  try {
    const docRef = doc(db, "featuredContent", docId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    console.error("Error removing featured doc:", err);
    return { success: false, message: err.message };
  }
}

export async function updatePriorityFeaturedDoc(docId: string, newPriority: number) {
  try {
    const docRef = doc(db, "featuredContent", docId);
    await setDoc(docRef, { priority: newPriority, updatedAt: Date.now() }, { merge: true });
    return { success: true };
  } catch (err: any) {
    console.error("Error updating priority:", err);
    return { success: false, message: err.message };
  }
}

/**
 * Seed initial documents if Firestore `featuredContent/` collection is empty
 */
export async function seedInitialFeaturedContentIfEmpty() {
  try {
    const colRef = collection(db, "featuredContent");
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      for (const item of DEFAULT_FEATURED_ITEMS) {
        await setDoc(doc(db, "featuredContent", item.id), item);
      }
      console.log("Seeded initial featuredContent collection.");
    }
  } catch (err) {
    console.warn("Could not seed initial featuredContent:", err);
  }
}
