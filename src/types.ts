declare global {
  interface ImportMeta {
    readonly env: Record<string, string>;
  }
}

export type AdminMenu =
  | "dashboard"
  | "gombos"
  | "renforts"
  | "kyc"
  | "revision"
  | "alertes"
  | "caisse"
  | "analytics"
  | "monetisation"
  | "super_admin";

export type UserRole = "client" | "musicien" | "admin" | string;
export type PaymentProvider = "orange" | "moov" | "wave" | string;

export interface UserLocation {
  country?: string;
  city?: string;
  district?: string;
}

export interface UserPerformance {
  level?: number;
  score?: number; // 0 - 100
  artisticName?: string;
  commune?: string;
  specialties?: string[];
  groups?: string[];
  [key: string]: any;
}

export interface User {
  id?: string;
  uid?: string;
  afriId?: string;
  ecosystemApps?: {
    afrigombo?: boolean;
    afritrust?: boolean;
    africoach?: boolean;
    [key: string]: boolean | undefined;
  };
  name?: string;
  email?: string;
  artisticName?: string;
  location?: UserLocation;
  commune?: string;
  avatarUrl?: string;
  photoURL?: string; // Support photoURL alias
  bio?: string;      // Support bio
  phone?: string;    // Support phone
  orangeMoneyNumber?: string;
  moovMoneyNumber?: string;
  waveNumber?: string;
  paymentMethods?: string[];
  isCertified?: boolean;
  kycStatus?: "pending" | "approved" | "rejected" | "none" | "info_required";
  kycDocUrl?: string;
  status?: "active" | "suspended" | "suspect";
  specialties?: string[];
  groups?: string[];
  performance?: UserPerformance;
  registrationDate?: string;
  createdAt?: string; // Support firebase blueprint compatibility
  revenues?: number;
  gombosCompleted?: number;
  flagsCount?: number;
  role?: UserRole;
  isVip?: boolean;
  isPro?: boolean;
  gomboIdNumber?: string;
  gomboId?: {
    id: string;
    scoreConfiance: number;
    niveau: string;
    prestationsTerminees: number;
    annulations: number;
    retards: number;
    certifie: boolean;
    createdAt: string;
  };
  kycApprovedDate?: string;
  kycSubmittedDate?: string;
  kycType?: "standard" | "express";
  kycComplementaryInfo?: string;
  kycDocs?: {
    identityCardUrl?: string;
    selfieUrl?: string;
    activityUrl?: string;
  };
  averageRating?: number;
  ratingCount?: number;
  [key: string]: any;
}

export type UserProfile = User; // Standard alias widely used in App

export interface GomboReview {
  id?: string;
  gomboId?: string;
  gomboTitle?: string;
  reviewerId?: string;
  reviewerName?: string;
  revieweeId?: string;
  revieweeName?: string;
  rating?: number;
  comment?: string;
  timestamp?: string;
  type?: "client_to_musician" | "musician_to_client";
  [key: string]: any;
}

export interface Post {
  id?: string;
  userId?: string;
  authorName?: string;
  authorArtisticName?: string;
  authorAvatar?: string;
  content?: string;
  mediaUrl?: string;
  timestamp?: string;
  likes?: number;
  comments?: number;
  isFlagged?: boolean;
  flagReason?: string;
  flagTimestamp?: string;
  aiModerated?: boolean;
  isBoosted?: boolean;
  [key: string]: any;
}

export interface Gombo {
  id?: string;
  clientId?: string;
  clientName?: string;
  title?: string;
  description?: string;
  budget?: number; // in FCFA
  commissionRate?: number; // e.g. 0.10 for 10%
  location?: string; // Commune (e.g. Cocody, Yopougon, Marcory)
  commune?: string;
  organizerId?: string;
  organizerName?: string;
  organizerAvatar?: string;
  timestamp?: string;
  
  // New fields for structure reinforcement
  roleWanted?: string;
  phone?: string;
  phoneVisible?: boolean;
  boostLevel?: "NONE" | "BRONZE" | "ARGENT" | "OR";
  applicantIds?: string[];
  
  applicantsCount?: number;
  musiciansCount?: number; 
  status?: "open" | "filled" | "completed" | "publie" | "reserve" | "termine";
  isBoosted?: boolean;
  eventType?: string;
  date?: string;
  time?: string;
  urgent?: boolean;
  createdBy?: string;
  mediaUrl?: string;
  mediaURL?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface Application {
  id?: string;
  gomboId?: string;
  gomboTitle?: string;
  userId?: string;
  musicianId?: string;
  musicianName?: string;
  musicianSpecialty?: string;
  musicianPhone?: string;
  musicianAvatar?: string;
  message?: string;
  mediaURL?: string;
  mediaUrl?: string;
  status?: any;
  createdAt?: string;
  [key: string]: any;
}

export type ApplicationStatus = any;

export interface Reservation {
  id?: string;
  gomboId?: string;
  gomboTitle?: string;
  clientId?: string;
  musicianId?: string;
  musicianName?: string;
  musicianPhone?: string;
  amount?: number;
  status?: any;
  createdAt?: string;
  [key: string]: any;
}

export interface Renfort {
  id?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  title?: string;
  description?: string;
  instrument?: string;
  instruments?: string[];
  date?: string;
  time?: string;
  musiciansCount?: number;
  budget?: number;
  commune?: string;
  whatsapp?: string;
  requestType?: string;
  genres?: string[];
  status?: any;
  createdAt?: string;
  gomboId?: string;
  gomboTitle?: string;
  applicantId?: string;
  applicantName?: string;
  applicantArtisticName?: string;
  timestamp?: string;
  isExpress?: boolean;
  [key: string]: any;
}

export interface RenfortApplication {
  id?: string;
  renfortId?: string;
  renfortTitle?: string;
  musicianId?: string;
  musicianName?: string;
  musicianPhone?: string;
  musicianAvatar?: string;
  musicianSpecialties?: string[];
  status?: any;
  createdAt?: string;
  [key: string]: any;
}

export interface Alerte {
  id?: string;
  userId?: string;
  userArtisticName?: string;
  reason?: string;
  severity?: "high" | "medium" | "low";
  timestamp?: string;
  status?: "open" | "resolved";
  [key: string]: any;
}

export interface Transaction {
  id?: string;
  amount?: number; // in FCFA
  type?: any;
  description?: string;
  userId?: string;
  userArtisticName?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface AdminBrief {
  newUsersCount?: number;
  newPostsCount?: number;
  newGombosCount?: number;
  revenuesGenerated?: number; // in FCFA
  kycRequestsCount?: number;
  criticalAlertsCount?: number;
  timestamp?: string;
  [key: string]: any;
}

export interface WaitingFeature {
  id?: string;
  uid?: string;
  userId?: string;
  name?: string;
  userEmail?: string;
  featureName?: string;
  status?: "locked";
  message?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface SocialPost {
  id?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  userRole?: string;
  title?: string;
  caption?: string;
  beatProd?: string;
  tags?: string[];
  likesCount?: number;
  sharesCount?: number;
  savesCount?: number;
  likedBy?: string[];
  savedBy?: string[];
  comments?: PostComment[];
  audioUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt?: string;
  isFlagged?: boolean;
  flagReason?: string;
  flagTimestamp?: string;
  aiModerated?: boolean;
  isBoosted?: boolean;
  authorArtisticName?: string;
  encouragesCount?: number;
  encouragedBy?: string[];
  reportedBy?: string[];
  [key: string]: any;
}

export interface PostComment {
  id?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  text?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface GomboNotification {
  id?: string;
  userId?: string;
  type?: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
  [key: string]: any;
}

export interface GomboSubscription {
  id?: string;
  userId?: string;
  userName?: string;
  type?: string;
  status?: string;
  price?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface GomboPayment {
  id?: string;
  userId?: string;
  amount?: number;
  type?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface GomboBoost {
  id?: string;
  gomboId?: string;
  userId?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface GomboCertification {
  id?: string;
  userId?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface CertificationRequest {
  id?: string;
  userId?: string;
  userName?: string;
  status?: any;
  createdAt?: string;
  [key: string]: any;
}

export interface MusicGroup {
  id?: string;
  name?: string;
  leaderId?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface GroupMember {
  id?: string;
  groupId?: string;
  userId?: string;
  role?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface GroupGalleryMedia {
  id?: string;
  groupId?: string;
  mediaUrl?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface ActivityFeedEntry {
  id?: string;
  userId?: string;
  type?: string;
  message?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface Conversation {
  id?: string;
  participants?: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  [key: string]: any;
}

export interface Message {
  id?: string;
  conversationId?: string;
  senderId?: string;
  text?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface VerificationRequest {
  id?: string;
  userId?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface AdminLog {
  id?: string;
  action?: string;
  targetId?: string;
  performedBy?: string;
  createdAt?: string;
  timestamp?: string; // Compatibility
  actor?: string;      // Compatibility
  type?: "royal" | "info" | "warning" | "danger"; // Compatibility
  [key: string]: any;
}

export interface AcademyGuide {
  id?: string;
  title?: string;
  content?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface GomboSafeContract {
  id?: string;
  gomboId?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface GomboTicketEvent {
  id?: string;
  title?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface PurchasedTicket {
  id?: string;
  eventId?: string;
  userId?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface StudioMarketItem {
  id?: string;
  name?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface StudioMarketReview {
  id?: string;
  itemId?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface CastingCall {
  id?: string;
  title?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface VoiceAnnouncement {
  id?: string;
  title?: string;
  createdAt?: string;
  [key: string]: any;
}

export type ContractStatus = any;
