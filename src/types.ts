export type UserRole = "musicien" | "client" | "groupe" | "admin";

export type PaymentProvider = "Wave" | "Orange Money" | "MTN Momo" | "Moov Money";

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  artistName?: string;
  commune: string;
  phone: string;
  bio?: string;
  role: UserRole;
  specialty?: string; // e.g. "Chanteur", "Guitariste", "Pianiste", "Batteur", "DJ", "Cuivres", "Bassiste", etc.
  experience?: string;
  // New specific fields:
  speciality?: string; // musical specialty
  experienceYears?: string; // Years of experience
  musicGenre?: string; // Genre of music
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
  displayName?: string;
  provider?: string;
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

export type ApplicationStatus = "en_attente" | "accepte" | "rejete";

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

  // New fields for MVP Phase 2 publication system
  type?: "gombo" | "demo" | "annonce";
  authorId?: string;
  authorName?: string;
  authorPhoto?: string;
  description?: string;
  commune?: string;
  mediaUrl?: string;
  videoUrl?: string;
  budget?: string | number;
  specialty?: string;
  urgent?: boolean;
  commentsCount?: number;
  genre?: string;         // e.g. for Démo
  availability?: string;  // e.g. for Annonce
}

export interface GomboNotification {
  id: string;
  userId: string; // The user receiving the notification
  title: string;
  message: string;
  type: "application_accepted" | "general" | "booking";
  read: boolean;
  createdAt: string;
}
