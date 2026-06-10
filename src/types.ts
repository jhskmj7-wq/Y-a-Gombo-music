export type AdminMenu =
  | "dashboard"
  | "gombos"
  | "renforts"
  | "kyc"
  | "revision"
  | "alertes"
  | "caisse"
  | "analytics"
  | "monetisation";

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
  kycStatus: "pending" | "approved" | "rejected" | "none" | "info_required";
  kycDocUrl?: string;
  status: "active" | "suspended" | "suspect";
  specialties: string[];
  groups: string[];
  performance: UserPerformance;
  registrationDate: string;
  revenues: number;
  gombosCompleted: number;
  flagsCount: number;
  isVip?: boolean;
  isPro?: boolean;
  gomboIdNumber?: string;
  kycApprovedDate?: string;
  kycSubmittedDate?: string;
  kycType?: "standard" | "express";
  kycComplementaryInfo?: string;
  kycDocs?: {
    identityCardUrl?: string;
    selfieUrl?: string;
    activityUrl?: string;
  };
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
  isBoosted?: boolean;
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
  isBoosted?: boolean;
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
  isExpress?: boolean;
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
  type:
    | "commission"
    | "subscription"
    | "payout"
    | "cert_express"
    | "boost_gombo"
    | "renfort_express"
    | "gombo_vip"
    | "gombo_pro";
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
