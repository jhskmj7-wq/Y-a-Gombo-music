import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, Sparkles, Zap, Flame, Trophy, ShieldCheck, 
  Video, DollarSign, Calendar, FlameKindling, Info, 
  ArrowLeft, Check, Play, Smartphone, Star 
} from "lucide-react";
import { gomboDB, gomboAuth } from "../firebase";
import { UserProfile, Gombo, SocialPost, GomboPayment, GomboBoost, GomboCertification } from "../types";

interface CertificationHubProps {
  currentUserProfile: UserProfile | null;
  onRefreshProfile: () => void;
  onShowAuth: () => void;
  onNavigateView: (view: string) => void;
}

export default function CertificationHub({ 
  currentUserProfile, 
  onRefreshProfile, 
  onShowAuth,
  onNavigateView 
}: CertificationHubProps) {
  const [activeTab, setActiveTab] = useState<"badges" | "boost" | "payments">("badges");
  const [loading, setLoading] = useState(false);
  
  // Simulation States for Badges/Certifications
  const [showCertModal, setShowCertModal] = useState(false);
  const [certTypeSelected, setCertTypeSelected] = useState<"certifie" | "verifie">("certifie");
  const [auditionVideoUrl, setAuditionVideoUrl] = useState("");
  const [selectedMobileNetwork, setSelectedMobileNetwork] = useState<string>("Wave");
  const [mobilePhoneNumber, setMobilePhoneNumber] = useState(currentUserProfile?.phone || "");
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  // Simulation States for Boosting
  const [myGombos, setMyGombos] = useState<Gombo[]>([]);
  const [myPosts, setMyPosts] = useState<SocialPost[]>([]);
  const [selectedItemForBoost, setSelectedItemForBoost] = useState<{ id: string; title: string; type: "gombo" | "post" } | null>(null);
  const [selectedBoostDuration, setSelectedBoostDuration] = useState<"24h" | "3d" | "7d">("24h");
  const [showBoostModal, setShowBoostModal] = useState(false);

  // History states
  const [paymentsHistory, setPaymentsHistory] = useState<GomboPayment[]>([]);
  const [myCertifications, setMyCertifications] = useState<GomboCertification[]>([]);

  useEffect(() => {
    if (currentUserProfile) {
      loadUserPostings();
      loadHistory();
    }
  }, [currentUserProfile]);

  const loadUserPostings = async () => {
    if (!currentUserProfile) return;
    try {
      // Load all gombos and filter mine
      // We can fetch from localstorage or API
      const allOffers: Gombo[] = JSON.parse(localStorage.getItem("gombo_offers") || "[]");
      setMyGombos(allOffers.filter(g => g.clientId === currentUserProfile.uid));

      const allPosts: SocialPost[] = JSON.parse(localStorage.getItem("gombo_social_posts") || "[]");
      setMyPosts(allPosts.filter(p => p.userId === currentUserProfile.uid || p.authorId === currentUserProfile.uid));
    } catch (e) {
      console.error("Error loading user postings", e);
    }
  };

  const loadHistory = async () => {
    if (!currentUserProfile) return;
    try {
      const payments = await gomboDB.getPayments(currentUserProfile.uid);
      setPaymentsHistory(payments);
      const certs = await gomboDB.getCertifications(currentUserProfile.uid);
      setMyCertifications(certs);
    } catch (e) {
      console.error("Error loading monetization histories", e);
    }
  };

  const getBoostPrice = (duration: "24h" | "3d" | "7d") => {
    switch(duration) {
      case "24h": return 500;
      case "3d": return 1000;
      case "7d": return 2000;
    }
  };

  // Instant local badge activation/simulation for Beta testing
  const handleToggleBadge = async (badge: string) => {
    if (!currentUserProfile) {
      onShowAuth();
      return;
    }
    const currentBadges = currentUserProfile.badges || [];
    let updatedBadges: string[];
    if (currentBadges.includes(badge)) {
      updatedBadges = currentBadges.filter(b => b !== badge);
    } else {
      updatedBadges = [...currentBadges, badge];
    }

    try {
      setLoading(true);
      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        badges: updatedBadges
      });
      onRefreshProfile();
    } catch (e) {
      alert("Erreur lors de la mise à jour des badges localement.");
    } finally {
      setLoading(false);
    }
  };

  // Handling Talent Certification application
  const handleApplyCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) return;

    setLoading(true);
    const amount = certTypeSelected === "certifie" ? 1000 : 2000;
    const purpose = certTypeSelected === "certifie" ? "Certification ⭐ Talent Certifié" : "Vérification ✅ Profil Vérifié";

    try {
      // 1. Create Simulated Payment
      await gomboDB.publishPayment({
        userId: currentUserProfile.uid,
        userName: `${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || currentUserProfile.artistName || ""}`.trim() || "Artiste",
        amount,
        purpose,
        provider: selectedMobileNetwork as any,
        phoneNumber: mobilePhoneNumber,
        status: "success"
      });

      // 2. Create Certification Entry
      await gomboDB.publishCertification({
        userId: currentUserProfile.uid,
        userName: `${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || currentUserProfile.artistName || ""}`.trim() || "Artiste",
        type: certTypeSelected,
        videoUrl: auditionVideoUrl,
        pricePaid: amount
      });

      // 3. Update User profile verification statuses and badges
      const currentBadges = currentUserProfile.badges || [];
      const newBadge = certTypeSelected === "certifie" ? "⭐ Talent Certifié" : "✅ Profil Vérifié";
      const updatedBadges = Array.from(new Set([...currentBadges, newBadge]));

      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        verificationStatus: certTypeSelected,
        badges: updatedBadges,
        isVerified: certTypeSelected === "verifie" ? true : currentUserProfile.isVerified
      });

      setSimulatedSuccess(true);
      onRefreshProfile();
      loadHistory();
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'activation.");
    } finally {
      setLoading(false);
    }
  };

  // Handling Publication Boost activation
  const handleApplyBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || !selectedItemForBoost) return;

    setLoading(true);
    const price = getBoostPrice(selectedBoostDuration);
    const days = selectedBoostDuration === "24h" ? 1 : selectedBoostDuration === "3d" ? 3 : 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    try {
      // 1. Log Payment
      await gomboDB.publishPayment({
        userId: currentUserProfile.uid,
        userName: `${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || currentUserProfile.artistName || ""}`.trim() || "Artiste",
        amount: price,
        purpose: `🚀 Boost ${selectedBoostDuration} : ${selectedItemForBoost.title}`,
        provider: selectedMobileNetwork as any,
        phoneNumber: mobilePhoneNumber,
        status: "success"
      });

      // 2. Log Boost Item
      await gomboDB.publishBoost({
        userId: currentUserProfile.uid,
        userName: `${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || currentUserProfile.artistName || ""}`.trim() || "Artiste",
        targetType: selectedItemForBoost.type,
        targetId: selectedItemForBoost.id,
        targetTitle: selectedItemForBoost.title,
        duration: selectedBoostDuration,
        price,
        expiresAt
      });

      alert(`🚀 Félicitations ! Votre publication "${selectedItemForBoost.title}" bénéficie d'un Boost de ${selectedBoostDuration}. Elle apparaîtra en haut de liste avec le statut URGENT !`);
      
      setShowBoostModal(false);
      setSelectedItemForBoost(null);
      loadUserPostings();
      loadHistory();
    } catch(err) {
      console.error("Boost failed", err);
      alert("Une erreur est survenue lors de l'application du Boost.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* Visual Header */}
      <div className="text-center space-y-3 relative overflow-hidden rounded-3xl p-8 bg-gradient-to-tr from-slate-900 via-[#18112C] to-slate-900 border border-purple-900/30 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-orange-500/10 blur-3xl rounded-full" />
        
        <div className="inline-flex p-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-2xl shadow-lg ring-4 ring-purple-950">
          <Award className="w-10 h-10 animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">Y'a Gombo Music Premium</h1>
        <p className="text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
          Propulsez votre carrière artistique au niveau supérieur à Abidjan ! Profitez d'outils de pointe pour décrocher plus de gombos dorés et valoriser votre musique.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
          💡 Mode Préparation Monétisation & Test Actif
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => { setActiveTab("badges"); setSimulatedSuccess(false); }}
          className={`flex-1 pb-4 text-sm font-bold border-b-2 text-center transition-colors flex items-center justify-center gap-2 ${
            activeTab === "badges" 
              ? "border-purple-600 text-purple-600 dark:text-purple-400" 
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          ⭐ Badges & Certifications
        </button>
        <button
          onClick={() => { setActiveTab("boost"); setSimulatedSuccess(false); }}
          className={`flex-1 pb-4 text-sm font-bold border-b-2 text-center transition-colors flex items-center justify-center gap-2 ${
            activeTab === "boost" 
              ? "border-purple-600 text-purple-600 dark:text-purple-400" 
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          🚀 Booster des Publications
        </button>
        <button
          onClick={() => { setActiveTab("payments"); setSimulatedSuccess(false); }}
          className={`flex-1 pb-4 text-sm font-bold border-b-2 text-center transition-colors flex items-center justify-center gap-2 ${
            activeTab === "payments" 
              ? "border-purple-600 text-purple-600 dark:text-purple-400" 
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          💳 Historique & Transactions
        </button>
      </div>

      {/* Screen 1: Badges & Certifications Showcase */}
      {activeTab === "badges" && (
        <div className="space-y-8">
          {/* Main Plan Information Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1e1e24] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 rounded-xl">
                    <Star className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-950 dark:text-white">Talent Certifié</h3>
                    <p className="text-xs text-gray-400">Pour les musiciens de scène d'élite</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  L'équipe de validation de Y'a Gombo Music auditionne vos liens de prestations. Donne accès au badge de confiance d'élite et garantit une plus grande visibilité auprès des clients pros d'Abidjan.
                </p>
                <div className="space-y-1 pb-3">
                  <div className="text-xs text-gray-400">Tarif simulé de lancement :</div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">1 000 FCFA <span className="text-xs font-normal text-gray-400">à 2 000 FCFA</span></div>
                </div>
              </div>
              
              {currentUserProfile ? (
                <button
                  onClick={() => {
                    setCertTypeSelected("certifie");
                    setShowCertModal(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-md active:scale-98"
                >
                  <Award className="w-4 h-4" />
                  Devenir Talent Certifié
                </button>
              ) : (
                <button
                  onClick={onShowAuth}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-850 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-bold rounded-xl transition"
                >
                  Se connecter pour postuler
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-[#1e1e24] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-950 dark:text-white">Profil Vérifié</h3>
                    <p className="text-xs text-gray-400">Légalité & Sécurité d'identité</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  Soumettez vos informations de contact professionnelles certifiées. Les acheteurs et créateurs de Gombo privilégient les profils ayant une identité certifiée pour un showbiz plus sûr et ordonné.
                </p>
                <div className="space-y-1 pb-3">
                  <div className="text-xs text-gray-400 font-semibold text-emerald-600 dark:text-emerald-400">Bêta Gratuite / Simulation</div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">Gratuit <span className="text-xs font-normal text-gray-400">en phase de test</span></div>
                </div>
              </div>

              {currentUserProfile ? (
                <button
                  onClick={() => {
                    setCertTypeSelected("verifie");
                    setShowCertModal(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-md active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Demander la Vérification
                </button>
              ) : (
                <button
                  onClick={onShowAuth}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-850 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-bold rounded-xl transition"
                >
                  Se connecter pour postuler
                </button>
              )}
            </div>
          </div>

          {/* Badge Sandbox Controls */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/10 dark:to-indigo-950/10 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/30 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-purple-950 dark:text-purple-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Configurez Vos Badges Immédiatement (Phase Bêta)
              </h2>
              <p className="text-xs text-purple-800 dark:text-purple-400">
                Puisque nous préparons le lancement opérationnel, vous pouvez directement activer ou désactiver les 5 badges officiels pour tester leur affichage sur vos posts et fiches profils de l'application !
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              {[
                { label: "⭐ Talent Certifié", key: "⭐ Talent Certifié", desc: "Showbiz Certifié Pro" },
                { label: "🔥 Artiste Actif", key: "🔥 Artiste Actif", desc: "Fréquence d'activité" },
                { label: "🏆 Top Talent", key: "🏆 Top Talent", desc: "Légende récompensée" },
                { label: "🎼 Groupe VIP", key: "🎼 Groupe VIP", desc: "Orchestre d'exception" },
                { label: "✅ Profil Vérifié", key: "✅ Profil Vérifié", desc: "Identité confirmée" }
              ].map((b) => {
                const isActive = currentUserProfile?.badges?.includes(b.key) || false;
                return (
                  <button
                    key={b.key}
                    onClick={() => handleToggleBadge(b.key)}
                    disabled={loading}
                    className={`p-3.5 rounded-xl border text-center transition flex flex-col justify-between items-center gap-2 ${
                      isActive 
                        ? "bg-white dark:bg-gray-900 border-purple-400 dark:border-purple-700 shadow-md ring-2 ring-purple-500/20" 
                        : "bg-gray-50/50 dark:bg-gray-850 border-gray-100 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-gray-800 text-gray-500"
                    }`}
                  >
                    <div className="text-sm font-bold text-gray-900 dark:text-white flex flex-col items-center gap-1">
                      <span className="text-2xl">{b.label.split(" ")[0]}</span>
                      <span className="text-xs whitespace-nowrap">{b.label.split(" ").slice(1).join(" ")}</span>
                    </div>
                    <div className={`mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      isActive 
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300" 
                        : "bg-gray-200 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400"
                    }`}>
                      {isActive ? "Activé" : "Inactif"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Screen 2: Boost Listings Panel */}
      {activeTab === "boost" && (
        <div className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 p-4 rounded-xl border border-yellow-100 dark:border-yellow-950/50 flex gap-3 text-xs">
            <Info className="w-5 h-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
            <div>
              <span className="font-extrabold uppercase">🚀 Comment fonctionne le Boost ? </span>
              Booster une publication lui permet d'apparaître instantanément sous la mention exclusive <strong className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-[10px] inline-block font-black ivo-shading">🚨 URGENT</strong>. Ces publications sont affichées de manière prioritaire, en haut des listes de Gombos et de démos, devant toutes les autres !
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* My Active Gombos to Boost */}
            <div className="space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-purple-600 dark:text-purple-400">🎯 Vos publications de Gombos</h3>
              {myGombos.length === 0 ? (
                <div className="p-6 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-2xl text-center text-xs text-gray-400">
                  Aucun gombo publié par votre profil actuellement.
                  <button 
                    onClick={() => onNavigateView("publish")}
                    className="mt-2 block text-purple-600 font-bold mx-auto hover:underline"
                  >
                    Créer un Gombo &rarr;
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myGombos.map(g => (
                    <div key={g.id} className="p-4 bg-white dark:bg-[#1e1e24] border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-gray-950 dark:text-white max-w-xs truncate">{g.title}</div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2">
                          <span>💰 {g.budget} FCFA</span>
                          <span>•</span>
                          <span>📍 {g.commune}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItemForBoost({ id: g.id, title: g.title, type: "gombo" });
                          setShowBoostModal(true);
                        }}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-lg transition shadow-sm"
                      >
                        🚀 Booster
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Active Posts to Boost */}
            <div className="space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-purple-600 dark:text-purple-400">🔥 Vos publications de Démo ou Annonce</h3>
              {myPosts.length === 0 ? (
                <div className="p-6 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-2xl text-center text-xs text-gray-400">
                  Aucune démo de scène ou annonce publiée par vous actuellement.
                </div>
              ) : (
                <div className="space-y-3">
                  {myPosts.map(p => (
                    <div key={p.id} className="p-4 bg-white dark:bg-[#1e1e24] border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-gray-950 dark:text-white max-w-xs truncate">{p.title || p.caption}</div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2">
                          <span>📦 Type : {p.type || "Démo"}</span>
                          <span>•</span>
                          <span>💬 {p.commentsCount || 0} comm.</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItemForBoost({ id: p.id, title: p.title || p.caption || "Publication", type: "post" });
                          setShowBoostModal(true);
                        }}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-lg transition shadow-sm"
                      >
                        🚀 Booster
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen 3: Transaction List */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1e1e24] border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850">
              <h3 className="font-black text-sm uppercase tracking-wider text-gray-950 dark:text-white">Registre local de vos transactions financières</h3>
            </div>
            
            {paymentsHistory.length === 0 ? (
              <div className="p-10 text-center text-gray-400 space-y-2">
                <div className="text-3xl">💳</div>
                <div className="text-xs">Aucun paiement ou abonnement enregistré actuellement.</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {paymentsHistory.map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                    <div className="space-y-1">
                      <div className="font-bold text-gray-900 dark:text-white">{p.purpose}</div>
                      <div className="text-[11px] text-gray-450 flex items-center gap-2">
                        <span>Paiement {p.provider} ({p.phoneNumber})</span>
                        <span>•</span>
                        <span>{new Date(p.createdAt).toLocaleDateString("fr-FR")} à {new Date(p.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-black text-sm text-gray-950 dark:text-white">{p.amount.toLocaleString("fr-FR")} FCFA</div>
                      <div className="inline-flex items-center gap-1 text-[9px] uppercase font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                        ● Succès
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Certification Builder Verification */}
      <AnimatePresence>
        {showCertModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1e1e24] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full relative overflow-hidden text-gray-900 dark:text-white shadow-2xl"
            >
              {/* Top accent */}
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${certTypeSelected === 'certifie' ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'}`} />

              <button 
                onClick={() => { setShowCertModal(false); setSimulatedSuccess(false); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-950 dark:hover:text-white font-bold"
              >
                ✕
              </button>

              {!simulatedSuccess ? (
                <form onSubmit={handleApplyCertification} className="space-y-5">
                  <div className="space-y-2">
                    <h2 className="text-xl font-black uppercase tracking-tight">
                      {certTypeSelected === "certifie" ? "⭐ Demander le Talent Certifié" : "✅ Demander le Profil Vérifié"}
                    </h2>
                    <p className="text-xs text-gray-400">
                      Entrez les détails de votre audition showbiz à Abidjan pour la phase bêta.
                    </p>
                  </div>

                  {certTypeSelected === "certifie" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Lien Vidéo de Scène (YouTube, Facebook, Insta)</label>
                      <div className="relative">
                        <Video className="w-5 h-5 absolute left-3 top-2.5 text-gray-450" />
                        <input
                          type="url"
                          required
                          placeholder="https://youtube.com/watch?v=..."
                          value={auditionVideoUrl}
                          onChange={(e) => setAuditionVideoUrl(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-950 dark:text-white"
                        />
                      </div>
                      <p className="text-[10px] text-gray-450 leading-relaxed">
                        Cette vidéo servira à évaluer votre niveau de chant, de batterie ou de lead guitare.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">Choisissez votre opérateur Mobile Money</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["Wave", "Orange Money", "MTN Momo", "Moov Money"].map((n) => (
                        <button
                          type="button"
                          key={n}
                          onClick={() => setSelectedMobileNetwork(n)}
                          className={`py-2 text-[10px] font-black uppercase rounded-lg border text-center transition ${
                            selectedMobileNetwork === n 
                              ? "bg-purple-600 text-white border-purple-600" 
                              : "bg-gray-50 dark:bg-gray-850 text-gray-500 border-gray-100 dark:border-gray-800"
                          }`}
                        >
                          {n.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Numéro de téléphone de facturation</label>
                    <div className="relative">
                      <Smartphone className="w-5 h-5 absolute left-3 top-2.5 text-gray-455" />
                      <input
                        type="tel"
                        required
                        placeholder="07 00 00 00 00"
                        value={mobilePhoneNumber}
                        onChange={(e) => setMobilePhoneNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-950 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Price display with note */}
                  <div className="p-3.5 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-dashed border-purple-100 dark:border-purple-900/50 flex justify-between items-center text-xs">
                    <span className="font-bold text-purple-900 dark:text-purple-300">Net à Payer (Simulé) :</span>
                    <strong className="font-black text-purple-600 dark:text-purple-400 text-sm">
                      {certTypeSelected === "certifie" ? "1 000" : "0"} FCFA
                    </strong>
                  </div>

                  <div className="text-[10px] text-gray-400 text-center leading-relaxed">
                    🔐 Les fonds ne sont pas réellement débités en phase préparatoire.
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 font-bold rounded-xl transition text-sm text-white shadow-md flex items-center justify-center gap-2 ${
                      certTypeSelected === "certifie" 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" 
                        : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600"
                    }`}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4" />
                        Confirmer le Paiement & Postuler
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 border border-emerald-100 dark:border-emerald-900 rounded-full flex items-center justify-center mx-auto text-3xl">
                    ✓
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">SUCCÈS DE L'APPLICATION !</h2>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                      Votre demande a été enregistrée avec succès dans les collections Firestore. Votre badge de validation a été automatiquement ajouté à votre compte de démonstration artistique !
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCertModal(false);
                      setSimulatedSuccess(false);
                    }}
                    className="px-6 py-2 bg-gray-900 dark:bg-gray-800 hover:bg-black text-white text-xs font-bold rounded-lg transition"
                  >
                    Fermer la fenêtre
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Boost Configuration Selector */}
      <AnimatePresence>
        {showBoostModal && selectedItemForBoost && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1e1e24] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full relative overflow-hidden text-gray-900 dark:text-white shadow-2xl space-y-5"
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-yellow-500" />

              <button 
                onClick={() => setShowBoostModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-950 dark:hover:text-white font-bold"
              >
                ✕
              </button>

              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Booster de Publication
                </h2>
                <div className="text-xs text-gray-400 truncate">
                  Sujet : "{selectedItemForBoost.title}"
                </div>
              </div>

              <form onSubmit={handleApplyBoost} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">Choisissez la durée de mise en valeur</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "24 Heures", value: "24h", price: "500 FCFA" },
                      { label: "3 Jours", value: "3d", price: "1 000 FCFA" },
                      { label: "7 Jours", value: "7d", price: "2 050 FCFA" }
                    ].map((d) => (
                      <button
                        type="button"
                        key={d.value}
                        onClick={() => setSelectedBoostDuration(d.value as any)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                          selectedBoostDuration === d.value 
                            ? "bg-purple-600 text-white border-purple-600 shadow-md" 
                            : "bg-gray-50 dark:bg-gray-850 text-gray-500 border-gray-100 dark:border-gray-800"
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-tight">{d.label}</span>
                        <span className="text-[9px] font-bold opacity-80">{d.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">Opérateur Mobile Money (Simulé)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Wave", "Orange Money", "MTN Momo", "Moov Money"].map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setSelectedMobileNetwork(n)}
                        className={`py-2 text-[10px] font-black uppercase rounded-lg border text-center transition ${
                          selectedMobileNetwork === n 
                            ? "bg-purple-600 text-white border-purple-600" 
                            : "bg-gray-50 dark:bg-gray-850 text-gray-500 border-gray-100 dark:border-gray-800"
                        }`}
                      >
                        {n.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">Numéro de téléphone de facturation</label>
                  <input
                    type="tel"
                    required
                    placeholder="07 00 00 00 00"
                    value={mobilePhoneNumber}
                    onChange={(e) => setMobilePhoneNumber(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-950 dark:text-white"
                  />
                </div>

                <div className="p-3.5 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl border border-dashed border-yellow-100 dark:border-yellow-900/50 flex justify-between items-center text-xs">
                  <span className="font-bold text-yellow-950 dark:text-yellow-400">Total Facturé (Simulé) :</span>
                  <strong className="font-black text-yellow-600 dark:text-yellow-500 text-sm">
                    {getBoostPrice(selectedBoostDuration).toLocaleString("fr-FR")} FCFA
                  </strong>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      Lancer mon Boost Express !
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
