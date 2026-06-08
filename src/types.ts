export type UserRole = "musicien" | "organisateur" | "client" | "manager" | "admin";

export type PaymentProvider = "Wave" | "Orange Money" | "MTN Momo" | "Moov Money";

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  artistName?: string;
  ville?: string;
  commune: string;
  quartier?: string;
  phone: string;
  bio?: string;
  role: UserRole;
  specialty?: string; // e.g. "Chanteur", "Guitariste", "Pianiste", "Batteur", "DJ", "Cuivres", "Bassiste", etc.
  specialties?: string[]; // Multiple specialties
  experience?: string;
  mediaGallery?: { id: string; type: "photo" | "audio" | "video" | "youtube"; url: string; title?: string; }[];
  // New specific fields:
  speciality?: string; // musical specialty
  experienceYears?: string; // Years of experience
  musicGenre?: string; // Genre of music
  musicGenres?: string[]; // Multiple music genres
  gender?: string;
  birthDate?: string;
  whatsapp?: string;
  availabilities?: string[];
  waveNumber?: string;
  orangeMoneyNumber?: string;
  balance?: number; // solde disponible
  totalRevenue?: number; // revenus reçus
  totalWithdrawals?: number; // retraits effectués
  gigsCompleted?: number; // gombos réalisés
  applicationsSent?: number; // candidatures envoyées
  acceptanceRate?: number; // taux d'acceptation
  isProfileComplete?: boolean; // toggle if all mandatory fields are filled
  isAvailableNow?: boolean; // disponível maintenant
  updatedAt?: string;

  paymentNumber?: string; // Orange / Wave number
  paymentProvider?: PaymentProvider;
  avatarUrl?: string; // profile picture (we support bot avatarUrl and photoURL for compatibility)
  photoURL?: string; 
  isVerified?: boolean;
  isCertified?: boolean;
  displayName?: string;
  provider?: string;

  // Monetization / Gamification fields
  verificationStatus?: "standard" | "certifie" | "verifie"; // Talent Certifié
  groupStatus?: "standard" | "vip" | "premium"; // Groups level
  groupType?: "Orchestre" | "Groupes Zouglou" | "Chorale" | "Groupes Gospel"; // Category for groups VIP
  badges?: string[]; // ["⭐ Talent Certifié", "🔥 Artiste Actif", "🏆 Top Talent", "🎼 Groupe VIP", "✅ Profil Vérifié"]
  availabilityStatus?: "disponible" | "occupe" | "indisponible";

  notificationSettings?: {
    gombos: boolean;
    renforts: boolean;
    messages: boolean;
    certifications: boolean;
    groupes: boolean;
  };

  isSuspended?: boolean;
  isBanned?: boolean;

  themePreference?: "dark-gold" | "light-gold" | "night-navy";

  lastLoginAt?: string;

  createdAt: string; // ISO String
}

export type GomboStatus = "publie" | "reserve" | "termine";

export interface Gombo {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  location: string; // Details e.g. "Bar du Coin", "Hôtel Ivoire"
  commune: string; // Cocody, Yopougon, Marcory, Plateau, Treichville, Abobo, Koumassi, Adjamé, Port-Bouët, Attécoubé
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  budget: number; // in CFA franc (FCFA)
  eventType: string; // "Mariage", "Concert", "Anniversaire", "Bar/Resto", "Privé/Soirée", "Autre"
  musiciansCount: number; // number of musicians needed
  status: GomboStatus;
  urgent: boolean;
  createdAt: string; // ISO String
}

export type ApplicationStatus = "en_attente" | "accepte" | "refuse" | "rejete";

export interface Application {
  id: string;
  gomboId: string;
  gomboTitle: string;
  musicianId: string; // applicant UID
  musicianName: string;
  musicianSpecialty: string;
  musicianPhone: string;
  musicianAvatar?: string;
  message: string;
  mediaUrl?: string; // YouTube, Soundcloud or Drive link
  status: ApplicationStatus;
  createdAt: string; // ISO String
  
  // Custom applicant fields for Gombo matching flow
  applicantId?: string;
  applicantName?: string;
  applicantPhoto?: string;
  whatsapp?: string;
  specialty?: string;
  disponibilite?: string;
  availability?: string;
  audioUrl?: string;
  videoUrl?: string;
  userId?: string; // matches security rules
}

export type ReservationStatus = "confirme" | "complete" | "annule";

export interface Reservation {
  id: string;
  gomboId: string;
  gomboTitle: string;
  clientId: string;
  musicianId: string;
  musicianName: string;
  musicianPhone: string;
  amount: number;
  status: ReservationStatus;
  createdAt: string; // ISO String
}

export interface WaitingFeature {
  id: string;
  uid: string;
  userEmail: string;
  featureName: string;
  createdAt: string; // ISO String
}

export interface PostComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  title: string;
  caption: string;
  beatProd?: string;
  tags: string[];
  likesCount: number;
  comments: PostComment[];
  sharesCount: number;
  savesCount: number;
  likedBy: string[]; // user UIDs
  savedBy: string[]; // user UIDs
  audioUrl?: string; // Optional soundtrack link
  imageUrl?: string; // Cover artwork link
  createdAt: string;

  // New fields for MVP Phase 2/3 publication system
  type?: "gombo" | "demo" | "annonce" | string;
  postCategory?: "demo" | "recherche" | "renfort" | "concert" | "opportunite" | "aide" | "showbiz" | "coeur" | string;
  authorId?: string;
  authorName?: string;
  authorPhoto?: string;
  description?: string;
  commune?: string;
  mediaUrl?: string; // Image or main media asset URL
  videoUrl?: string; // Optional short video accompaniment
  photoUrl?: string; // Photo post attachments
  locationDetail?: string; // Precision on city/commune/hall
  budget?: string | number;
  specialty?: string;
  urgent?: boolean;
  commentsCount?: number;
  genre?: string;         // e.g. for Démo
  availability?: string;  // e.g. for Annonce
  
  // Interactions tracking
  encouragesCount?: number;
  encouragedBy?: string[]; // user UIDs
  reportsCount?: number;
  reportedBy?: string[]; // user UIDs
}

export interface GomboNotification {
  id: string;
  userId: string; // The user receiving the notification
  title: string;
  message: string;
  type: "application_accepted" | "general" | "booking" | "new_gombo" | "new_renfort" | "new_application" | "certification_approved" | "new_follower" | "new_message" | string;
  read: boolean;
  isRead?: boolean; // For compat with firestore.rules
  createdAt: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  targetId?: string;
}

export interface ActivityFeedEntry {
  id: string;
  type: "talent" | "groupe" | "certification" | "gombo";
  title: string;
  message: string;
  createdAt: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  targetId?: string; // e.g. gombo ID, group ID, user ID
}

export interface Renfort {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  instrument: string; // Left for simple queries
  instruments: string[]; // Sélection multiple
  date: string;
  time: string;
  musiciansCount: number;
  budget: number;
  commune: string;
  whatsapp: string;
  requestType: string; // Répétition, Remplacement, etc
  genres: string[];
  status: "publie" | "termine";
  createdAt: string;
}

export interface RenfortApplication {
  id: string;
  renfortId: string;
  renfortTitle: string;
  musicianId: string;
  musicianName: string;
  musicianPhone: string;
  musicianAvatar?: string;
  musicianSpecialties?: string[];
  status: "en_attente" | "accepte" | "refuse";
  createdAt: string;
}

export interface GroupMember {
  id: string;
  name: string;
  role: string; // Function/Role inside group e.g. "Chanteur", "Bassiste", etc.
  instrument: string;
  photoUrl?: string;
}

export interface GroupGalleryMedia {
  id: string;
  type: "photo" | "video" | "audio";
  url: string;
  title?: string;
}

export interface MusicGroup {
  id: string;
  creatorId: string; // Owner of the group who can manage it
  name: string;
  photoUrl: string;
  logoUrl: string;
  description: string;
  commune: string;
  ville: string;
  phone: string;
  whatsapp: string;
  email: string;
  membersCount: number;
  creationYear: number;
  type: string; // Orchestre Live, Groupe Zouglou, etc.
  genres: string[]; // Selection multiple
  members: GroupMember[];
  gallery: GroupGalleryMedia[];
  
  // Statistics
  viewsCount: number;
  favoritesCount: number;
  contactsCount: number;
  
  // Badges
  isVerified?: boolean; // ✅ Groupe Vérifié
  isPremium?: boolean; // 🏆 Groupe Premium
  isPopular?: boolean; // 🔥 Groupe Populaire
  isSuspended?: boolean; // 🚧 Groupe Suspendu par l'admin
  
  // Plan level (Standard, VIP, Premium)
  plan: "standard" | "vip" | "premium";
  
  // Followers / users who followed this group
  followers: string[]; // array of user uids
  
  createdAt: string;
}

// Monetization Interfaces for preparations
export interface GomboSubscription {
  id: string;
  userId: string;
  userName: string;
  type: "talent_certifie" | "groupe_vip" | "groupe_premium";
  status: "active" | "expired" | "pending";
  price: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface GomboPayment {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  purpose: string; // e.g., "Certification", "Boost 24h", etc.
  provider: "Wave" | "Orange Money" | "MTN Momo" | "Moov Money";
  phoneNumber: string;
  status: "success" | "pending" | "failed";
  createdAt: string;
}

export interface GomboBoost {
  id: string;
  userId: string;
  userName: string;
  targetType: "gombo" | "post";
  targetId: string; // ID of the boosted item (Gombo or SocialPost)
  targetTitle: string;
  duration: "24h" | "3d" | "7d";
  price: number;
  expiresAt: string;
  status: "actif" | "expire";
  createdAt: string;
}

export interface GomboCertification {
  id: string;
  userId: string;
  userName: string;
  type: "certifie" | "verifie";
  status: "en_attente" | "approuve" | "rejete";
  videoUrl?: string; // Showcase or audition video url
  pricePaid?: number;
  createdAt: string;
}

export interface CertificationRequest {
  id: string;
  userId: string;
  artistName: string;
  specialties: string[];
  experience: string;
  mediaUrl: string;
  status: "En attente" | "Approuvé" | "Refusé";
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: {
    [uid: string]: {
      name: string;
      avatarUrl?: string; // photoURL / avatarUrl
      role: string;
    };
  };
  lastMessage?: {
    text: string;
    timestamp: string;
    senderId: string;
  } | null;
  unreadCount: {
    [uid: string]: number;
  };
  updatedAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  type: "text" | "image" | "audio";
  mediaUrl?: string | null;
  timestamp: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userEmail: string;
  fullName: string;
  photoUrl: string;
  commune: string;
  metier: string;
  whatsapp: string;
  selfieUrl: string;
  mediaUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface AFRIGOMBOAdmin {
  id?: string;
  email: string;
  role: "super_admin" | string;
  permissions: string[];
  createdAt: string | any; // Supports Timestamp in firestore / string in local fallback
}

export interface AdminLog {
  id?: string;
  adminEmail: string;
  action: string;
  targetId: string;
  createdAt: string | any; // ISO split string or Firestore Timestamp
}



