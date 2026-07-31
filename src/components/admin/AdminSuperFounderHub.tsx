import React, { useState, useEffect, Suspense, lazy } from "react";
import { 
  LayoutDashboard, MessageSquare, CreditCard, MapPin, User, BarChart3, 
  FlaskConical, Music, Settings, Crown, ShieldCheck, RefreshCw, ChevronRight, X,
  Sparkles, Bell, Shield, Users, TrendingUp, LogOut, Radio
} from "lucide-react";
import { lazyWithRetry } from "../../lib/lazyWithRetry";

// Lazy load the independent modules
const AdminFounderThrone = lazyWithRetry(() => import("./AdminFounderThrone"));
const AdminDashboard = lazyWithRetry(() => import("./AdminDashboard"));
const AdminSupportCenter = lazyWithRetry(() => import("./AdminSupportCenter"));
const BetaTransactionsAdminPanel = lazyWithRetry(() => import("./BetaTransactionsAdminPanel"));
const GeoLocationCenter = lazyWithRetry(() => import("./GeoLocationCenter"));
const AdminAvatarStore = lazyWithRetry(() => import("./AdminAvatarStore"));
const AdminPollCenter = lazyWithRetry(() => import("./AdminPollCenter"));
const AfrigomboLabs = lazyWithRetry(() => import("./AfrigomboLabs"));
const AdminDecouvertesCentre = lazyWithRetry(() => import("./AdminDecouvertesCentre"));
const AdminNotifications = lazyWithRetry(() => import("./AdminNotifications"));
const AdminSecurity = lazyWithRetry(() => import("./AdminSecurity"));
const AdminUsers = lazyWithRetry(() => import("./AdminUsers"));
const AdminRevenue = lazyWithRetry(() => import("./AdminRevenue"));
const AdminSettings = lazyWithRetry(() => import("./AdminSettings"));
const MultimediaCenter = lazyWithRetry(() => import("./MultimediaCenter"));
const AdminWalletManagement = lazyWithRetry(() => import("./AdminWalletManagement"));
const AdminContracts = lazyWithRetry(() => import("./AdminContracts"));

export type AdminModuleType = 
  | "throne"
  | "dashboard"
  | "contracts"
  | "wallet_management"
  | "transactions"
  | "messaging"
  | "geolocation"
  | "avatar_store"
  | "labs"
  | "polls"
  | "cagnottes"
  | "notifications"
  | "security"
  | "users"
  | "stats"
  | "settings"
  | "multimedia";

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

  const modulesNav = [
    { key: "throne" as AdminModuleType, label: "🏛 Tableau", icon: Crown, badge: "Fondateur" },
    { key: "dashboard" as AdminModuleType, label: "🛰 Supervision", icon: LayoutDashboard, badge: "Live" },
    { key: "contracts" as AdminModuleType, label: "📜 Contrats (Escrow)", icon: ShieldCheck, badge: "Séquestre" },
    { key: "wallet_management" as AdminModuleType, label: "💰 Gestion Wallet", icon: ShieldCheck, badge: "Souverain" },
    { key: "transactions" as AdminModuleType, label: "💳 Transactions", icon: CreditCard, badge: undefined },
    { key: "messaging" as AdminModuleType, label: "💬 Messagerie", icon: MessageSquare, badge: "Support" },
    { key: "geolocation" as AdminModuleType, label: "📍 Géolocalisation", icon: MapPin, badge: undefined },
    { key: "avatar_store" as AdminModuleType, label: "🎭 Avatar Store", icon: User, badge: "Économie" },
    { key: "labs" as AdminModuleType, label: "🧠 AFRIGOMBO Labs", icon: FlaskConical, badge: "Bêta" },
    { key: "polls" as AdminModuleType, label: "📊 Sondages", icon: BarChart3, badge: undefined },
    { key: "cagnottes" as AdminModuleType, label: "💰 Cagnottes", icon: Sparkles, badge: undefined },
    { key: "notifications" as AdminModuleType, label: "📣 Diffusions", icon: Bell, badge: undefined },
    { key: "security" as AdminModuleType, label: "🛡 Sécurité", icon: ShieldCheck, badge: "Pro" },
    { key: "users" as AdminModuleType, label: "👥 Utilisateurs", icon: Users, badge: undefined },
    { key: "stats" as AdminModuleType, label: "📈 Statistiques", icon: TrendingUp, badge: undefined },
    { key: "settings" as AdminModuleType, label: "⚙ Paramètres", icon: Settings, badge: undefined },
    { key: "multimedia" as AdminModuleType, label: "🎵 Multimédia", icon: Music, badge: undefined },
  ];

  const handleSelectModule = (modKey: AdminModuleType) => {
    setActiveModule(modKey);
    try { audioSynth?.playValidationSuccess?.(); } catch (e) {}
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-black text-white font-sans antialiased flex flex-col w-full overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      
      {/* Imperial Top Header Bar */}
      <header className="bg-zinc-950 border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-lg shadow-[#D4AF37]/10">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
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

        {onExit && (
          <button
            onClick={onExit}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Quitter la Console</span>
          </button>
        )}
      </header>

      {/* Premium Top Horizontal Scrollable Bar - NO SIDEBAR */}
      <nav className="bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-3 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none sticky top-[57px] z-30 shrink-0">
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
                  : "bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-[#D4AF37]"}`} />
              <span>{m.label}</span>
              {m.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-mono font-black uppercase ${
                  isActive ? "bg-black text-[#D4AF37]" : "bg-zinc-800 text-[#D4AF37]"
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

          {activeModule === "dashboard" && (
            <AdminDashboard
              users={users}
              gombos={gombos}
              posts={posts}
              transactions={transactions}
              alerts={alerts}
              currentUser={currentUser}
              userEmail={userEmail}
              audioSynth={audioSynth}
            />
          )}

          {activeModule === "messaging" && (
            <AdminSupportCenter audioSynth={audioSynth} />
          )}

          {activeModule === "contracts" && (
            <AdminContracts currentUser={currentUser} />
          )}

          {activeModule === "wallet_management" && (
            <AdminWalletManagement currentUser={currentUser} />
          )}

          {activeModule === "transactions" && (
            <BetaTransactionsAdminPanel currentUser={currentUser} />
          )}

          {activeModule === "geolocation" && (
            <GeoLocationCenter />
          )}

          {activeModule === "avatar_store" && (
            <AdminAvatarStore />
          )}

          {activeModule === "polls" && (
            <AdminPollCenter audioSynth={audioSynth} />
          )}

          {activeModule === "labs" && (
            <AfrigomboLabs />
          )}

          {activeModule === "cagnottes" && (
            <AdminDecouvertesCentre audioSynth={audioSynth} />
          )}

          {activeModule === "notifications" && (
            <AdminNotifications adminEmail={userEmail} />
          )}

          {activeModule === "security" && (
            <AdminSecurity adminLogs={[]} scannerStatus="idle" audioSynth={audioSynth} />
          )}

          {activeModule === "users" && (
            <AdminUsers users={users} />
          )}

          {activeModule === "stats" && (
            <AdminRevenue transactions={transactions} systemCommissionRate={1.5} audioSynth={audioSynth} />
          )}

          {activeModule === "multimedia" && (
            <MultimediaCenter adminEmail={userEmail} isAuthorizedSuperFounder={true} />
          )}

          {activeModule === "settings" && (
            <AdminSettings systemCommissionRate={1.5} audioSynth={audioSynth} />
          )}
        </Suspense>
      </main>
    </div>
  );
}

