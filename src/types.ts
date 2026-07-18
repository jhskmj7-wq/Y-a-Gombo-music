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
  | "contracts"
  | "payments_to_verify"
  | "super_admin";

export type UserRole = "client" | "musicien" | "admin" | string;
export type PaymentProvider = "MANUAL_BETA" | "CINETPAY" | "WAVE" | "MTN" | "MOOV";

export interface PaymentVerification {
  id?: string;
  contractId: string;
  amount: number;
  provider: PaymentProvider;
  status: "pending_verification" | "confirmed" | "rejected" | "new_proof_needed";
  proofUrl?: string;
  createdAt: string;
  updatedAt: string;
  processedBy?: string;
}

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
  theme?: string;
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
  balance?: number;
  revenue?: number;
  revenues?: number;
  gombosCompleted?: number;
  flagsCount?: number;
  role?: UserRole;
  isFounder?: boolean;
  permissions?: string[];
  isVip?: boolean;
  isPro?: boolean;
  gomboIdNumber?: string;
  gomboId?: {
    id: string;
    scoreConfiance: number;
    niveau: number | string; // 1-6 or string label
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
    identityCardBackUrl?: string;
    selfieUrl?: string;
    activityUrl?: string;
  };
  averageRating?: number;
  ratingCount?: number;
  trustScore?: number;
  totalContracts?: number;
  cancelledContracts?: number;
  successRate?: number;
  monthlyRevenue?: number;
  opportunitiesReceived?: number;
  collaborationsCount?: number;
  satisfiedOrganizersCount?: number;
  musiciansRecruitedCount?: number;
  monthlyEvolution?: { month: string; value: number }[];
  wallet?: {
    soldeDisponible: number;
    soldeBloque: number;
    revenusMois: number;
    economiesPremium: number;
    niveauWallet: string;
    depots?: number;
    retraits?: number;
    revenus?: number;
    gainsMensuels?: number;
  };
  builderData?: {
    totalAmount: number;
    count: number;
    joinYear: number;
    badge: string;
    isMonthly?: boolean;
    isAnonymous?: boolean;
  };
  [key: string]: any;
}

export interface EconomySettings {
  id?: string;
  commissionRateStandard: number;
  commissionRatePremium: number;
  boostPriceStandard: number;
  boostPricePremium: number;
  renfortExpressPrice: number;
  updatedAt: string;
  updatedBy: string;
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
  status?: "publie" | "en_cours" | "artiste_selectionne" | "contrat_accepte" | "contrat_refuse" | "mission_terminee" | "mission_annulee" | "paiement_effectue" | "open" | "filled" | "completed" | "reserve" | "termine";
  selectedTalentId?: string;
  selectedTalentName?: string;
  contractId?: string; // Linked contract ID
  isBoosted?: boolean;
  eventType?: string;
  date?: string;
  time?: string;
  urgent?: boolean;
  createdBy?: string;
  mediaUrl?: string;
  mediaURL?: string;
  createdAt?: string;
  
  // 2026 Beta: Gombo Types
  type?: "libre" | "securise";
  
  [key: string]: any;
}

export interface SecureWaitlistEntry {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  country: string;
  createdAt: string;
}

export interface AfrigomboSupport {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  level: "ami" | "batisseur" | "protecteur" | "gardien" | "ambassadeur";
  amount?: number;
  badge: string;
  message?: string;
  isAnonymous?: boolean;
  createdAt: string;
}

export interface BetaUpdate {
  id?: string;
  title: string;
  content: string;
  version: string;
  date: string;
  type: "feature" | "fix" | "security" | "design";
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
  participants: string[];
  participantNames?: Record<string, string>;
  participantAvatars?: Record<string, string>;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: Record<string, number>;
  contractAccepted?: boolean;
  gomboId?: string; // Associated Gombo (contract)
  [key: string]: any;
}

export interface UserActivity {
  id?: string;
  userId?: string;
  type?: string;
  action?: string;
  details?: string;
  device?: string;
  browser?: string;
  ip?: string;
  result?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface BypassAttempt {
  id?: string;
  userId: string;
  userName: string;
  convoId: string;
  type: "phone" | "email" | "link" | "image_contact" | "bank" | string;
  content: string;
  timestamp: string;
  trustScoreReduced: number;
}

export interface Message {
  id?: string;
  conversationId?: string;
  senderId?: string;
  receiverId?: string;
  text?: string;
  image?: string;
  audio?: string;
  isRead?: boolean;
  createdAt?: string;
  [key: string]: any;
}

export interface Honor {
  id?: string;
  userId?: string;
  targetPost?: string;
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
  id: string; // AG-YYYY-NNNNNN
  gomboId?: string;
  clientId?: string;
  clientName?: string;
  artistId?: string;
  artistName?: string;
  title?: string;
  description?: string;
  commune?: string;
  date?: string;
  time?: string;
  amount?: number; // Cachet
  commissionClient?: number;
  commissionArtist?: number;
  totalClientPaid?: number;
  totalArtistReceives?: number;
  status: "generated" | "accepted_client" | "accepted_artist" | "signed" | "payment_held" | "completed" | "disputed" | "archived" | "cancelled" | "en_attente" | "accepte" | "termine" | "arrived" | "in_progress" | "completed_artist";
  clientSignedAt?: string;
  artistSignedAt?: string;
  clientValidation?: boolean;
  artistValidation?: boolean;
  createdAt: string;
  updatedAt: string;
  history?: { action: string; timestamp: string; userId: string; label?: string }[];
  proofs?: { url: string; type: string; uploadedBy: string; timestamp: string; label: string }[];
  firebaseSignature?: string;
  creatorId?: string;
  creatorName?: string;
  partnerId?: string;
  partnerName?: string;
  partnerEmail?: string;
  creatorAccepted?: boolean;
  partnerAccepted?: boolean;
  [key: string]: any;
}

export interface GomboDispute {
  id?: string;
  contractId: string;
  gomboId: string;
  openedById: string;
  openedByName: string;
  reason: string;
  status: "open" | "investigating" | "resolved";
  resolution?: string;
  createdAt: string;
  updatedAt: string;
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

export interface StorageDiagnostic {
  isEnabled: boolean;
  bucket: string;
  projectId: string;
  apiKey: string;
  rulesValid: boolean;
  connectionOk: boolean;
  writeTestOk: boolean;
  resumableTestOk?: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export type SourceType = "FIREBASE" | "GITHUB" | "URL" | "DISABLED";

export interface SystemMedia {
  id: string;
  title: string;
  description?: string;
  category: "audio" | "video" | "image" | string;
  sourceType: SourceType;
  firebaseUrl?: string;
  githubPath?: string;
  externalUrl?: string;
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
  enabled: boolean;
  priority: number;
  updatedAt: string;
  updatedBy: string;
  originalId?: string; // If migrated from legacy media collection
}

export type NotificationType = "INFO" | "GOMBO" | "URGENT" | "ÉVÉNEMENT" | "MISE À JOUR" | "PREMIUM" | "SÉCURITÉ";
export type NotificationAudience = "Tous" | "Premium" | "Musiciens" | "Organisateurs" | "Administrateurs" | "Super Fondateur";
export type NotificationStatus = "published" | "scheduled" | "draft" | "inactive";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  image?: string;
  action?: string; // Label for button
  actionUrl?: string;
  priority: number; // 0-10
  scheduledAt: string | null;
  createdAt: string;
  createdBy: string;
  status: NotificationStatus;
  readCount: number;
  clickCount: number;
}

export type ContractStatus = any;

export interface EscrowPayment {
  id?: string;
  amount: number;
  transportAmount: number;
  performerUid: string;
  organizerUid: string;
  status: "held" | "released" | "disputed" | "refunded";
  performerConfirmed: boolean;
  organizerConfirmed: boolean;
  disputeOpened: boolean;
  autoReleaseAt: string | null;
  createdAt: string;
  [key: string]: any;
}

export interface SuspensionRecord {
  id?: string;
  userId: string;
  type: "warning" | "restriction" | "temp_block" | "perm_block";
  reason: string;
  durationDays?: number; // Only for temp_block
  status: "active" | "expired" | "lifted";
  createdAt: string;
  liftedAt?: string;
  createdBy: string;
}

export interface SecurityAlert {
  id?: string;
  type: "unusual_activity" | "fraud_attempt" | "multi_login" | "suspicious_payment" | "spam_detected" | "content_detected";
  severity: "low" | "medium" | "high" | "critical";
  userId?: string;
  details: string;
  status: "open" | "investigating" | "resolved";
  createdAt: string;
  resolvedAt?: string;
}
