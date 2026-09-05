import React, { useState, useEffect, Suspense, lazy } from "react";
import { 
  LayoutDashboard, MessageSquare, CreditCard, MapPin, User, BarChart3, 
  FlaskConical, Music, Settings, Crown, ShieldCheck, RefreshCw, ChevronRight, X,
  Sparkles, Bell, Shield, Users, TrendingUp, LogOut, Radio, AlertOctagon, ArrowLeft, Rocket, Globe,
  ShieldAlert, Wrench, Landmark
} from "lucide-react";
import { lazyWithRetry } from "../../lib/lazyWithRetry";
import { ErrorBoundary } from "../ErrorBoundary";
import { SecurityService } from "../../lib/SecurityService";
import StrategicDecisionsManager from "./StrategicDecisionsManager";
import SuperFounderMaintenanceModal from "./SuperFounderMaintenanceModal";
import { useMaintenance } from "../../hooks/useMaintenance";
import { useAdminLocations } from "../../hooks/useLocations";

const AdminFounderThrone = lazyWithRetry(() => import("./AdminFounderThrone"));

// Lazy load the independent modules
import AdminDashboard from "./AdminDashboard";
import AdminSupportCenter from "./AdminSupportCenter";
import BetaTransactionsAdminPanel from "./BetaTransactionsAdminPanel";
const GeoLocationCenter = lazyWithRetry(() => import("./GeoLocationCenter"));
const AdminLocationsCenter = lazyWithRetry(() => import("./AdminLocationsCenter"));
const AdminAvatarStore = lazyWithRetry(() => import("./AdminAvatarStore"));
import AdminPollCenter from "./AdminPollCenter";
const AfrigomboLabs = lazyWithRetry(() => import("./AfrigomboLabs"));
import AdminDecouvertesCentre from "./AdminDecouvertesCentre";
const AdminCagnottes = lazyWithRetry(() => import("./AdminCagnottes"));
const AdminNotifications = lazyWithRetry(() => import("./AdminNotifications"));
const AdminSecurity = lazyWithRetry(() => import("./AdminSecurity"));
const AdminUsers = lazyWithRetry(() => import("./AdminUsers"));
const AdminRevenue = lazyWithRetry(() => import("./AdminRevenue"));
const AdminSettings = lazyWithRetry(() => import("./AdminSettings"));
const MultimediaCenter = lazyWithRetry(() => import("./MultimediaCenter"));
const AdminWalletManagement = lazyWithRetry(() => import("./AdminWalletManagement"));
import FounderFeesVault from "./FounderFeesVault";
const AdminContracts = lazyWithRetry(() => import("./AdminContracts"));
const AdminDeploymentCenter = lazyWithRetry(() => import("./AdminDeploymentCenter"));
const AdminRevenueFeatures = lazyWithRetry(() => import("./AdminRevenueFeatures"));
import { GomboAdsAdminSection } from "../ads/GomboAdsAdminSection";
import AdminSubscriptionManagement from "./AdminSubscriptionManagement";

export type AdminModuleType = 
  | "throne"
  | "subscriptions"
  | "contracts"
  | "wallet_management"
  | "transactions"
  | "messaging"
  | "geolocation"
  | "locations"
  | "avatar_store"
  | "labs"
  | "polls"
  | "cagnottes"
  | "notifications"
  | "security"
  | "users"
  | "stats"
  | "settings"
  | "multimedia"
  | "deployment"
  | "strategic_decisions"
  | "revenue_features"
  | "gombo_ads";

interface AdminSuperFounderHubProps {
  initialModule?: AdminModuleType;
  userEmail?: string;
  currentUser?: any;
  users?: any[];
  gombos?: any[];
  posts?: any[];
  transactions?: any[];
  alerts?: any[];
  audioSynth?: any;
  onExit?: () => void;
}

export default function AdminSuperFounderHub({
  initialModule = "throne",
  userEmail = "",
  currentUser,
  users = [],
  gombos = [],
  posts = [],
  transactions = [],
  alerts = [],
  audioSynth,
  onExit
}: AdminSuperFounderHubProps) {
  const [activeModule, setActiveModule] = useState<AdminModuleType>(initialModule);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState<boolean>(false);
  const { maintenance, isScheduledWindowActive } = useMaintenance();
  const { pendingProposalsCount } = useAdminLocations();

  const isMaintActive = !!maintenance.globalMode || maintenance.status === "maintenance" || isScheduledWindowActive;

  // STRICT ZERO TRUST AUTHORIZATION CHECK
  const isAuthorized = SecurityService.isFounder(currentUser) || 
                       SecurityService.isFounder(userEmail) || 
                       SecurityService.isAdmin(currentUser) ||
                       userEmail?.toLowerCase() === "jhs.kmj7@gmail.com";

  useEffect(() => {
    if (!isAuthorized) {
      SecurityService.logSecurityEvent({
        userId: currentUser?.uid || "unknown",
        userEmail: userEmail || currentUser?.email || "unknown",
        action: "unauthorized_admin_access_attempt",
        severity: "critical",
        details: `Tentative d'accès non autorisée au Tableau du Super Fondateur par ${userEmail || currentUser?.email}`,
        result: "blocked"
      });
      try { audioSynth?.playWarningAlert?.(); } catch (e) {}
    }
  }, [isAuthorized, currentUser, userEmail, audioSynth]);

  if (!isAuthorized) {
    return (
      <div className="min-h-[100dvh] bg-afri-bg text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-500 mb-4 animate-pulse">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-rose-500 uppercase tracking-widest mb-2">ACCÈS SOUVERAIN REFUSÉ</h1>
        <p className="text-xs text-afri-text-sec max-w-md mb-6 leading-relaxed">
          Seul le Super Fondateur légitime d'AFRIGOMBO ELITE (<span className="text-amber-400 font-mono">jhs.kmj7@gmail.com</span>) possède les autorisations pour accéder à ce Cabinet Impérial.
          Cette tentative a été journalisée dans le registre de sécurité.
        </p>
        {onExit && (
          <button
            onClick={onExit}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retourner à l'Espace Public</span>
          </button>
        )}
      </div>
    );
  }

  const modulesNav = [
    { key: "throne" as AdminModuleType, label: "✨ TABLEAU FONDATEUR", icon: Crown, badge: "Fondateur" },
    { key: "subscriptions" as AdminModuleType, label: "💎 Abonnements Bêta", icon: Crown, badge: "Manuel" },
    { key: "security" as AdminModuleType, label: "🛡 Sécurité", icon: ShieldCheck, badge: "Pro" },
    { key: "strategic_decisions" as AdminModuleType, label: "📋 Décisions Stratégiques", icon: ShieldCheck, badge: "Gouvernance" },
    { key: "wallet_management" as AdminModuleType, label: "💰 Gestion Wallet", icon: ShieldCheck, badge: "Souverain" },
    { key: "transactions" as AdminModuleType, label: "💳 Transactions", icon: CreditCard, badge: undefined },
    { key: "contracts" as AdminModuleType, label: "📜 Contrats (Escrow)", icon: ShieldCheck, badge: "Séquestre" },
    { key: "users" as AdminModuleType, label: "👥 Utilisateurs", icon: Users, badge: undefined },
    { key: "messaging" as AdminModuleType, label: "💬 Messagerie", icon: MessageSquare, badge: "Support" },
    { key: "notifications" as AdminModuleType, label: "📣 Diffusions", icon: Bell, badge: undefined },
    { key: "cagnottes" as AdminModuleType, label: "💰 Cagnottes", icon: Sparkles, badge: undefined },
    { key: "geolocation" as AdminModuleType, label: "📍 Géolocalisation", icon: MapPin, badge: undefined },
    { key: "locations" as AdminModuleType, label: "📍 Lieux proposés", icon: MapPin, badge: pendingProposalsCount > 0 ? `${pendingProposalsCount} en attente` : undefined },
    { key: "stats" as AdminModuleType, label: "📈 Statistiques", icon: TrendingUp, badge: undefined },
    { key: "avatar_store" as AdminModuleType, label: "🎭 Avatar Store", icon: User, badge: "Économie" },
    { key: "labs" as AdminModuleType, label: "🧠 AFRIGOMBO ELITE Labs", icon: FlaskConical, badge: "Bêta" },
    { key: "polls" as AdminModuleType, label: "📊 Sondages", icon: BarChart3, badge: undefined },
    { key: "multimedia" as AdminModuleType, label: "🎵 Multimédia", icon: Music, badge: undefined },
    { key: "settings" as AdminModuleType, label: "⚙ Paramètres", icon: Settings, badge: undefined },
    { key: "revenue_features" as AdminModuleType, label: "💎 Revenus & Avantages", icon: Landmark, badge: "Commercial" },
    { key: "gombo_ads" as AdminModuleType, label: "📣 GOMBO ADS", icon: Rocket, badge: "Régie" },
    { key: "deployment" as AdminModuleType, label: "🚀 Déploiement", icon: Rocket, badge: "Android" },
  ];

  const handleSelectModule = (modKey: AdminModuleType) => {
    setActiveModule(modKey);
    try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
  };

  return (
    <div className="founder-page min-h-[100dvh] h-[100dvh] max-h-[100dvh] bg-afri-bg text-afri-text font-sans antialiased flex flex-col w-full overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      
      {/* Imperial Compact Top Header Bar */}
      <header className="founder-header bg-afri-bg border-b border-zinc-800/80 px-3 py-2 sm:px-4 flex items-center justify-between shrink-0 sticky top-0 z-40 h-12 box-border">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onExit && (
            <button
              onClick={onExit}
              className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 text-[#D4AF37] hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Retour au Cabinet"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <Crown className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <h1 className="text-xs sm:text-sm font-black text-afri-text uppercase tracking-wider whitespace-nowrap truncate">
              TABLEAU DU SUPER FONDATEUR
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Discreet Maintenance icon button */}
          <button
            type="button"
            onClick={() => {
              setIsMaintenanceModalOpen(true);
              try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition border cursor-pointer ${
              isMaintActive
                ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse"
                : maintenance?.scheduled
                ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                : "bg-zinc-900 text-zinc-400 hover:text-[#D4AF37] border-zinc-800"
            }`}
            title="Centre Maintenance & Alertes"
          >
            <ShieldAlert className={`w-4 h-4 ${isMaintActive ? "text-rose-400 animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Premium Top Horizontal Scrollable Bar - NO SIDEBAR */}
      <nav className="bg-afri-bg/95 backdrop-blur-md border-b border-zinc-800/80 px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 z-30">
        {modulesNav.map((m) => {
          const IconComp = m.icon;
          const isActive = activeModule === m.key;

          return (
            <button
              key={m.key}
              onClick={() => handleSelectModule(m.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[#D4AF37] text-black font-black shadow-md shadow-[#D4AF37]/20 border border-[#D4AF37]"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-[#D4AF37]"}`} />
              <span>{m.label}</span>
              {m.badge && (
                <span className={`px-1 py-0.2 rounded text-[7px] font-mono font-black uppercase ${
                  isActive ? "bg-black/20 text-black" : "bg-zinc-800 text-[#D4AF37]"
                }`}>
                  {m.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Content View Area */}
      <main 
        className="founder-content flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 lg:p-5 w-full max-w-full box-border" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <Suspense fallback={
          <div className="p-16 text-center text-[#D4AF37] font-mono text-xs animate-pulse flex flex-col items-center justify-center gap-3">
            <Crown className="w-8 h-8 text-[#D4AF37] animate-bounce" />
            <span>Chargement du module souverain {activeModule}...</span>
          </div>
        }>
          <ErrorBoundary moduleName="Throne">
            {activeModule === "throne" && (
              <AdminFounderThrone
                founders={[userEmail || "admin@afrigombo.ci"]}
                superAdmins={[userEmail || "admin@afrigombo.ci"]}
                adminEmail={userEmail || "admin@afrigombo.ci"}
                isAuthorizedSuperFounder={true}
                audioSynth={audioSynth}
                users={users}
                gombos={gombos}
                posts={posts}
                transactions={transactions}
                alerts={alerts}
                onExit={onExit}
              />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Subscriptions">
            {activeModule === "subscriptions" && (
              <AdminSubscriptionManagement
                currentUser={currentUser}
                audioSynth={audioSynth}
              />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Strategic Decisions">
            {activeModule === "strategic_decisions" && (
              <StrategicDecisionsManager />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Messaging">
            {activeModule === "messaging" && (
              <AdminSupportCenter audioSynth={audioSynth} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Contracts">
            {activeModule === "contracts" && (
              <AdminContracts currentUser={currentUser} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Wallet Management">
            {activeModule === "wallet_management" && (
              <AdminWalletManagement currentUser={currentUser} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Transactions">
            {activeModule === "transactions" && (
              <BetaTransactionsAdminPanel currentUser={currentUser} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Geolocation">
            {activeModule === "geolocation" && (
              <GeoLocationCenter />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Locations">
            {activeModule === "locations" && (
              <AdminLocationsCenter audioSynth={audioSynth} currentUser={currentUser} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Avatar Store">
            {activeModule === "avatar_store" && (
              <AdminAvatarStore />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Polls">
            {activeModule === "polls" && (
              <AdminPollCenter audioSynth={audioSynth} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Labs">
            {activeModule === "labs" && (
              <AfrigomboLabs />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Cagnottes">
            {activeModule === "cagnottes" && (
              <AdminCagnottes audioSynth={audioSynth} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Notifications">
            {activeModule === "notifications" && (
              <AdminNotifications adminEmail={userEmail} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Security">
            {activeModule === "security" && (
              <AdminSecurity adminLogs={[]} scannerStatus="idle" audioSynth={audioSynth} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Users">
            {activeModule === "users" && (
              <AdminUsers users={users} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Stats">
            {activeModule === "stats" && (
              <AdminRevenue transactions={transactions} audioSynth={audioSynth} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Multimedia">
            {activeModule === "multimedia" && (
              <MultimediaCenter adminEmail={userEmail} isAuthorizedSuperFounder={true} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Deployment">
            {activeModule === "deployment" && (
              <AdminDeploymentCenter currentUser={currentUser} userEmail={userEmail} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Revenue Features">
            {activeModule === "revenue_features" && (
              <AdminRevenueFeatures currentUser={currentUser} userEmail={userEmail} audioSynth={audioSynth} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Gombo Ads">
            {activeModule === "gombo_ads" && (
              <GomboAdsAdminSection adminProfile={currentUser} />
            )}
          </ErrorBoundary>

          <ErrorBoundary moduleName="Settings">
            {activeModule === "settings" && (
              <AdminSettings audioSynth={audioSynth} />
            )}
          </ErrorBoundary>
        </Suspense>
      </main>

      {/* Super Founder Maintenance & Alerts Central Modal */}
      <SuperFounderMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
      />
    </div>
  );
}

