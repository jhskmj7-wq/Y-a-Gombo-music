import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  addDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { AfriGomboLocation, LocationProposal, LocationType } from "../types";

const LOCATIONS_COLLECTION = "locations";
const PROPOSALS_COLLECTION = "location_proposals";

export const DEFAULT_INITIAL_LOCATIONS: Omit<AfriGomboLocation, "id">[] = [
  // Country
  { name: "Côte d'Ivoire", type: "Pays", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  
  // Villes Principales
  { name: "Abidjan", type: "Ville", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Yamoussoukro", type: "Ville", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Bouaké", type: "Ville", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "San-Pédro", type: "Ville", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Korhogo", type: "Ville", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Daloa", type: "Ville", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Man", type: "Ville", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Dabou", type: "Ville", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },

  // Communes d'Abidjan
  { name: "Cocody", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Yopougon", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Marcory", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Plateau", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Treichville", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Abobo", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Adjamé", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Koumassi", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Port-Bouët", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Attécoubé", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Bingerville", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Grand-Bassam", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Songon", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { name: "Anyama", type: "Commune", cityName: "Abidjan", countryName: "Côte d'Ivoire", status: "ACTIF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export class LocationService {
  /**
   * Seed initial locations if Firestore `locations` collection is empty
   */
  static async seedIfEmpty(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, LOCATIONS_COLLECTION));
      if (snap.empty) {
        console.log("Seeding default AfriGombo locations into Firestore...");
        const batch = writeBatch(db);
        DEFAULT_INITIAL_LOCATIONS.forEach((loc) => {
          const docRef = doc(collection(db, LOCATIONS_COLLECTION));
          batch.set(docRef, loc);
        });
        await batch.commit();
        console.log("Default locations successfully seeded!");
      }
    } catch (err) {
      console.warn("Could not seed initial locations:", err);
    }
  }

  /**
   * Real-time listener to ACTIVE locations for user components & dropdowns
   */
  static subscribeActiveLocations(callback: (locations: AfriGomboLocation[]) => void) {
    // Also trigger seed check in background
    this.seedIfEmpty();

    const q = query(
      collection(db, LOCATIONS_COLLECTION),
      where("status", "==", "ACTIF")
    );

    return onSnapshot(q, (snap) => {
      const list: AfriGomboLocation[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as AfriGomboLocation);
      });
      // Sort alphabetically by name
      list.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
      callback(list);
    }, (err) => {
      console.error("Error subscribing to active locations:", err);
      // Fallback: pass default locations if firestore error
      callback(DEFAULT_INITIAL_LOCATIONS.map((l, idx) => ({ id: `default_${idx}`, ...l })));
    });
  }

  /**
   * Real-time listener to ALL locations (for Super Founder dashboard)
   */
  static subscribeAllLocations(callback: (locations: AfriGomboLocation[]) => void) {
    this.seedIfEmpty();

    const q = query(
      collection(db, LOCATIONS_COLLECTION),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      const list: AfriGomboLocation[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as AfriGomboLocation);
      });
      callback(list);
    }, (err) => {
      console.error("Error subscribing to all locations:", err);
    });
  }

  /**
   * Real-time listener to User Proposals
   */
  static subscribeProposals(callback: (proposals: LocationProposal[]) => void) {
    const q = query(
      collection(db, PROPOSALS_COLLECTION),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      const list: LocationProposal[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as LocationProposal);
      });
      callback(list);
    }, (err) => {
      console.error("Error subscribing to location proposals:", err);
    });
  }

  /**
   * Add a new official location (Super Founder)
   */
  static async addLocation(data: Omit<AfriGomboLocation, "id">): Promise<string> {
    const now = new Date().toISOString();
    const docRef = doc(collection(db, LOCATIONS_COLLECTION));
    const payload: AfriGomboLocation = {
      id: docRef.id,
      name: data.name.trim(),
      type: data.type,
      countryId: data.countryId || "",
      countryName: data.countryName || "Côte d'Ivoire",
      regionId: data.regionId || "",
      regionName: data.regionName || "",
      districtId: data.districtId || "",
      districtName: data.districtName || "",
      cityId: data.cityId || "",
      cityName: data.cityName || "",
      communeId: data.communeId || "",
      communeName: data.communeName || "",
      parentId: data.parentId || "",
      parentName: data.parentName || "",
      description: data.description || "",
      status: data.status || "ACTIF",
      createdAt: data.createdAt || now,
      updatedAt: now,
      createdBy: data.createdBy || "Super Founder"
    };

    await setDoc(docRef, payload);
    return docRef.id;
  }

  /**
   * Update an existing location (Super Founder)
   */
  static async updateLocation(id: string, updates: Partial<AfriGomboLocation>): Promise<void> {
    const docRef = doc(db, LOCATIONS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Toggle location status (ACTIF / INACTIF)
   */
  static async toggleStatus(id: string, currentStatus: "ACTIF" | "INACTIF"): Promise<void> {
    const newStatus = currentStatus === "ACTIF" ? "INACTIF" : "ACTIF";
    await this.updateLocation(id, { status: newStatus });
  }

  /**
   * Submit user location proposal (User feature)
   */
  static async submitProposal(proposal: Omit<LocationProposal, "id" | "status" | "createdAt">): Promise<string> {
    const docRef = doc(collection(db, PROPOSALS_COLLECTION));
    const payload: LocationProposal = {
      id: docRef.id,
      name: proposal.name.trim(),
      type: proposal.type,
      countryName: proposal.countryName || "Côte d'Ivoire",
      regionName: proposal.regionName || "",
      cityName: proposal.cityName || "",
      communeName: proposal.communeName || "",
      parentName: proposal.parentName || "",
      details: proposal.details || "",
      submittedByUid: proposal.submittedByUid || "",
      submittedByName: proposal.submittedByName || "Utilisateur",
      submittedByEmail: proposal.submittedByEmail || "",
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    await setDoc(docRef, payload);
    return docRef.id;
  }

  /**
   * Approve proposal -> Add to official locations & mark proposal approved
   */
  static async approveProposal(
    proposal: LocationProposal, 
    founderUid: string,
    customLocationData?: Partial<AfriGomboLocation>
  ): Promise<void> {
    const propRef = doc(db, PROPOSALS_COLLECTION, proposal.id);
    const snap = await getDoc(propRef);
    if (!snap.exists()) {
      throw new Error("La proposition n'existe pas.");
    }
    const currentData = snap.data() as LocationProposal;
    if (currentData.status !== "PENDING") {
      throw new Error("Cette proposition a déjà été traitée.");
    }

    // Check if the place already exists in the official collection
    const officialSnap = await getDocs(collection(db, LOCATIONS_COLLECTION));
    let existingLocationId = "";
    const nameToCompare = (customLocationData?.name || proposal.name).trim().toLowerCase();
    const typeToCompare = customLocationData?.type || proposal.type;

    officialSnap.forEach((d) => {
      const loc = d.data() as AfriGomboLocation;
      if (loc.name.trim().toLowerCase() === nameToCompare && loc.type === typeToCompare) {
        existingLocationId = d.id;
      }
    });

    let officialPlaceId = existingLocationId;
    if (!existingLocationId) {
      // Create official location if not duplicate
      officialPlaceId = await this.addLocation({
        name: customLocationData?.name || proposal.name,
        type: customLocationData?.type || proposal.type,
        countryName: customLocationData?.countryName || proposal.countryName || "Côte d'Ivoire",
        regionName: customLocationData?.regionName || proposal.regionName || "",
        cityName: customLocationData?.cityName || proposal.cityName || "",
        communeName: customLocationData?.communeName || proposal.communeName || "",
        parentName: customLocationData?.parentName || proposal.parentName || "",
        description: customLocationData?.description || `Proposé par ${proposal.submittedByName} (${proposal.details || ""})`,
        status: "ACTIF",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: `Proposal:${proposal.submittedByName}`
      });
    }

    // Update proposal status
    await updateDoc(propRef, {
      status: "APPROVED",
      approvedBy: founderUid,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(officialPlaceId ? { officialPlaceId } : {})
    });
  }

  /**
   * Reject proposal
   */
  static async rejectProposal(proposalId: string, founderUid: string): Promise<void> {
    const propRef = doc(db, PROPOSALS_COLLECTION, proposalId);
    const snap = await getDoc(propRef);
    if (!snap.exists()) {
      throw new Error("La proposition n'existe pas.");
    }
    const currentData = snap.data() as LocationProposal;
    if (currentData.status !== "PENDING") {
      throw new Error("Cette proposition a déjà été traitée.");
    }

    await updateDoc(propRef, {
      status: "REJECTED",
      rejectedBy: founderUid,
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}
