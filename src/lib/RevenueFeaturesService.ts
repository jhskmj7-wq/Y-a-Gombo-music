import { db } from "./firebase";
import { 
  collection, doc, onSnapshot, setDoc, updateDoc, getDocs 
} from "firebase/firestore";
import { RevenueFeatureItem } from "../types";

const COLLECTION_NAME = "revenueFeatures";

export const DEFAULT_REVENUE_FEATURES: RevenueFeatureItem[] = [
  // A. ROUE AFRIGOMBO
  {
    id: "wheel_main",
    type: "wheel",
    category: "Roue AFRIGOMBO",
    name: "Roue de la Fortune AFRIGOMBO",
    description: "Système de récompenses interactif distribuant des avantages aux membres",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com",
    stats: {
      participations: 142,
      rewardsDistributed: 89
    },
    allowedAccountTypes: ["standard", "premium", "vip", "all"],
    config: {
      maxDailySpins: 1,
      costPerSpin: 0,
      activeRewards: ["Code Premium 24h", "Boost Gombo 48h", "Badge VIP Éphémère", "Pack Jetons"]
    }
  },

  // B. RÉCOMPENSES PREMIUM
  {
    id: "reward_code_premium",
    type: "premium_rewards",
    category: "Code Premium",
    name: "Codes Activation Premium",
    description: "Génération et distribution de codes promo et pass d'accès Premium",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "reward_temp_premium",
    type: "premium_rewards",
    category: "Premium temporaire",
    name: "Accès Premium Temporaire",
    description: "Attribution automatique d'accès Premium pour 24h, 3 jours ou 7 jours",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "reward_boost_premium",
    type: "premium_rewards",
    category: "Premium Boost",
    name: "Multiplicateur & Boosts Réservés",
    description: "Multiplicateur de portée et avantages d'amplification exclusifs aux abonnés",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "reward_badge_temp",
    type: "premium_rewards",
    category: "Badge Premium temporaire",
    name: "Badges V.I.P / Élite Éphémères",
    description: "Badges de prestige temporaires accordés aux vainqueurs de concours et tirages",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "reward_other_privileges",
    type: "premium_rewards",
    category: "Autres privilèges Premium",
    name: "Accès Prioritaire & Privilèges Exclusifs",
    description: "Accès prioritaire aux castings, renforts express et support dédié",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },

  // C. BOOSTS
  {
    id: "boost_visibility",
    type: "boosts",
    category: "Boost de visibilité",
    name: "Boost de Visibilité Radar",
    description: "Élargit le rayon d'exposition géographique sur la carte et l'annuaire",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "boost_gombo",
    type: "boosts",
    category: "Boost de Gombo",
    name: "Mise en Avant Gombo Express",
    description: "Surlignage or et positionnement en tête du fil des opportunités",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "boost_profile",
    type: "boosts",
    category: "Boost de profil",
    name: "Boost de Profil Artiste / Organisateur",
    description: "Met en valeur le profil dans l'annuaire des compétences",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "boost_publication",
    type: "boosts",
    category: "Boost de publication",
    name: "Sponsoring de Publication",
    description: "Amplifie l'interaction et la portée des démos, vidéos et posts",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "boost_other",
    type: "boosts",
    category: "Autres futurs boosts",
    name: "Packs de Boost Événementiels",
    description: "Amplificateurs sur-mesure pour concerts, festivals et grandes soirées",
    enabled: false,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },

  // D. AUTRES REVENUS / PROMOTIONS
  {
    id: "promo_offers",
    type: "promotions",
    category: "Offres promotionnelles",
    name: "Campagnes & Ventes Flash",
    description: "Offres promotionnelles temporaires et réductions de saison",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "promo_packs",
    type: "other_revenue",
    category: "Packs",
    name: "Packs Combinés Services & Crédits",
    description: "Packs groupés regroupant crédits de publication, boosts et accès VIP",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "promo_tickets",
    type: "other_revenue",
    category: "Tickets",
    name: "Billetterie Événements & Concours",
    description: "Tickets d'entrée numériques pour masterclasses et galas AFRIGOMBO",
    enabled: false,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "promo_digital_gifts",
    type: "other_revenue",
    category: "Cadeaux numériques",
    name: "Pourboires & Gratifications Virtuelles",
    description: "Envoi de jetons de soutien et cadeaux interactifs lors des démos",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "promo_paid_services",
    type: "other_revenue",
    category: "Services payants",
    name: "Rédaction Contrat Sécurisé & Audit Profil",
    description: "Services sur-mesure d'accompagnement juridique et de certification",
    enabled: true,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  },
  {
    id: "promo_future_revenue",
    type: "other_revenue",
    category: "Futures sources de revenus",
    name: "Extensions Commerciales R&D",
    description: "Module réservé aux intégrations de monétisation futures",
    enabled: false,
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "jhs.kmj7@gmail.com"
  }
];

export class RevenueFeaturesService {
  /**
   * Subscribe to real-time changes in revenueFeatures collection
   */
  static subscribeFeatures(callback: (features: RevenueFeatureItem[]) => void): () => void {
    const colRef = collection(db, COLLECTION_NAME);

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          // Initialize defaults if collection is empty
          this.initializeDefaultFeatures().catch(console.error);
          callback(DEFAULT_REVENUE_FEATURES);
          return;
        }

        const items: RevenueFeatureItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as RevenueFeatureItem);
        });

        callback(items);
      },
      (error) => {
        console.warn("Firestore subscription error for revenueFeatures, using defaults:", error);
        callback(DEFAULT_REVENUE_FEATURES);
      }
    );

    return unsubscribe;
  }

  /**
   * Seed Firestore with default feature documents
   */
  static async initializeDefaultFeatures(): Promise<void> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) return;

      for (const feat of DEFAULT_REVENUE_FEATURES) {
        const docRef = doc(db, COLLECTION_NAME, feat.id);
        await setDoc(docRef, feat, { merge: true });
      }
    } catch (err) {
      console.error("Error initializing default revenueFeatures:", err);
    }
  }

  /**
   * Toggle enabled status for a feature
   */
  static async toggleFeatureEnabled(featureId: string, enabled: boolean, updatedBy = "jhs.kmj7@gmail.com"): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, featureId);
    await setDoc(docRef, {
      enabled,
      updatedAt: new Date().toISOString(),
      updatedBy
    }, { merge: true });
  }

  /**
   * Toggle visibility status for a feature
   */
  static async toggleFeatureVisible(featureId: string, visible: boolean, updatedBy = "jhs.kmj7@gmail.com"): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, featureId);
    await setDoc(docRef, {
      visible,
      updatedAt: new Date().toISOString(),
      updatedBy
    }, { merge: true });
  }

  /**
   * Update arbitrary feature fields/config
   */
  static async updateFeatureConfig(featureId: string, updates: Partial<RevenueFeatureItem>, updatedBy = "jhs.kmj7@gmail.com"): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, featureId);
    await setDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy
    }, { merge: true });
  }
}
