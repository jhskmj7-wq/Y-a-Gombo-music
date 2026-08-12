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

import AdminFounderThrone from "./AdminFounderThrone";

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

export type AdminModuleType = 
  | "throne"
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
  | "revenue_features";

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
    { key: "deployment" as AdminModuleType, label: "🚀 Déploiement", icon: Rocket, badge: "Android" },
  ];

  const handleSelectModule = (modKey: AdminModuleType) => {
    setActiveModule(modKey);
    try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-afri-bg text-afri-text font-sans antialiased flex flex-col w-full overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      
      {/* Imperial Top Header Bar */}
      <header className="bg-afri-bg border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-lg shadow-[#D4AF37]/10">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black text-afri-text uppercase tracking-wider flex items-center gap-2">
              <span>TABLEAU DU SUPER FONDATEUR</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> SOUVERAIN
              </span>
            </h1>
            <p className="text-[10px] font-mono text-[#D4AF37] font-bold truncate max-w-[200px] sm:max-w-none">
              {userEmail || "admin@afrigombo.ci"} • Cabinet Impérial
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {/* Maintenance & Alertes Button stacked JUST ABOVE exit button */}
          <button
            type="button"
            onClick={() => {
              setIsMaintenanceModalOpen(true);
              try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
            }}
            className={`px-3 py-1 rounded-xl text-[10px] font-mono font-black uppercase transition flex items-center gap-1.5 border cursor-pointer ${
              isMaintActive
                ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse shadow-md shadow-rose-500/20"
                : maintenance?.scheduled
                ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
            }`}
            title="Ouvrir le Centre Maintenance & Alertes"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${isMaintActive ? "text-rose-400 animate-spin" : "text-[#D4AF37]"}`} />
            <span>🛡️ Maintenance & Alertes</span>
            <span className={`w-2 h-2 rounded-full ${isMaintActive ? "bg-rose-500" : maintenance?.scheduled ? "bg-amber-400" : "bg-emerald-400"}`} />
          </button>

          {onExit && (
            <button
              onClick={onExit}
              className="px-3.5 py-1 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text-sec hover:text-afri-text border border-afri-border hover:border-afri-border rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Quitter la Console</span>
            </button>
          )}
        </div>
      </header>

      {/* Premium Top Horizontal Scrollable Bar - NO SIDEBAR */}
      <nav className="bg-afri-bg/90 backdrop-blur-md border-b border-zinc-800/80 px-3 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none sticky top-[57px] z-30 shrink-0">
        {modulesNav.map((m) => {
          const IconComp = m.icon;
          const isActive = activeModule === m.key;

          return (
            <button
              key={m.key}
              onClick={() => handleSelectModule(m.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? "bg-[#D4AF37] text-black font-black shadow-lg shadow-[#D4AF37]/20 border border-[#D4AF37]"
                  : "bg-afri-bg-sec text-afri-text-sec border border-afri-border hover:border-afri-border hover:text-afri-text hover:bg-zinc-800/60"
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-[#D4AF37]"}`} />
              <span>{m.label}</span>
              {m.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-mono font-black uppercase ${
                  isActive ? "bg-afri-bg text-[#D4AF37]" : "bg-afri-bg-ter text-[#D4AF37]"
                }`}>
                  {m.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Content View Area */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto overflow-x-hidden overscroll-contain w-full max-w-full box-border" style={{ WebkitOverflowScrolling: 'touch' }}>
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

