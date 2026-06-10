export type AdminMenu =
  | "dashboard"
  | "gombos"
  | "renforts"
  | "kyc"
  | "revision"
  | "alertes"
  | "caisse"
  | "analytics";

export interface UserPerformance {
  level: number;
  score: number; // 0 - 100
  artisticName: string;
  commune: string;
  specialties: string[];
  groups: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  artisticName: string;
  commune: string;
  avatarUrl?: string;
  isCertified: boolean;
  kycStatus: "pending" | "approved" | "rejected" | "none";
  kycDocUrl?: string;
  status: "active" | "suspended" | "suspect";
  specialties: string[];
  groups: string[];
  performance: UserPerformance;
  registrationDate: string;
  revenues: number;
  gombosCompleted: number;
  flagsCount: number;
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorArtisticName: string;
  authorAvatar?: string;
  content: string;
  mediaUrl?: string;
  timestamp: string;
  likes: number;
  comments: number;
  isFlagged: boolean;
  flagReason?: string;
  flagTimestamp?: string;
  aiModerated?: boolean;
}

export interface Gombo {
  id: string;
  title: string;
  description: string;
  budget: number; // in FCFA
  commissionRate: number; // e.g. 0.10 for 10%
  location: string; // Commune (e.g. Cocody, Yopougon, Marcory)
  organizerId: string;
  organizerName: string;
  timestamp: string;
  applicantsCount: number;
  status: "open" | "filled" | "completed";
}

export interface Renfort {
  id: string;
  gomboId: string;
  gomboTitle: string;
  applicantId: string;
  applicantName: string;
  applicantArtisticName: string;
  instrument: string;
  status: "pending" | "accepted" | "rejected";
  timestamp: string;
}

export interface Alerte {
  id: string;
  userId: string;
  userArtisticName: string;
  reason: string;
  severity: "high" | "medium" | "low";
  timestamp: string;
  status: "open" | "resolved";
}

export interface Transaction {
  id: string;
  amount: number; // in FCFA
  type: "commission" | "subscription" | "payout";
  description: string;
  userId: string;
  userArtisticName: string;
  timestamp: string;
}

export interface AdminBrief {
  newUsersCount: number;
  newPostsCount: number;
  newGombosCount: number;
  revenuesGenerated: number; // in FCFA
  kycRequestsCount: number;
  criticalAlertsCount: number;
  timestamp: string;
}
