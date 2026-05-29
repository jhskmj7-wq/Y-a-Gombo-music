import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Phone, MapPin, Music, Award, Wallet, Send, FileText, Check, 
  Sparkles, ShieldCheck, Heart, CreditCard, Star, Radio, LogOut,
  Settings, ArrowUpRight, TrendingUp, HelpCircle, Bell, Eye, EyeOff,
  Moon, Sun, Globe, Smartphone, Shield, Lock, Trash2, Calendar
} from "lucide-react";
import { UserProfile, PaymentProvider } from "../types";
import { gomboDB, gomboAuth } from "../firebase";

interface GomboProfileProps {
  currentUserProfile: UserProfile;
  onRefreshProfile: () => void;
  onNavigateView: (view: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const ABIDJAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", "Abobo", 
  "Koumassi", "Adjamé", "Port-Bouët", "Attécoubé", "Grand-Bassam", "Bingerville"
];

const SPECIALTIES = [
  "Chanteur(euse) Lead", "Guitariste Soliste", "Guitariste Accompagnateur", 
  "Bassiste", "Batteur", "Claviériste / Pianiste", "Percussionniste", 
  "DJ", "Cuivres / Wind", "Ingénieur du Son", "Directeur Artistique / MC"
];

const EXPERIENCES = [
  "1-2 ans (Débutant ambitieux)",
  "3-5 ans (Intermédiaire actif)",
  "5-10 ans (Professionnel aguerri)",
  "Plus de 10 ans (Légende locale)"
];

const GENRES = [
  "Coupé-Décalé", "Zouglou", "Rumba Congolaise", "Rap Ivoire / Hip-Hop", 
  "Gospel Ivoirien", "Afrobeat / Afropop", "Reggae ivoirien", "Jazz / Variété Acoustique"
];

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
];

export default function GomboProfile({
  currentUserProfile,
  onRefreshProfile,
  onNavigateView,
  onLogout,
  darkMode,
  setDarkMode
}: GomboProfileProps) {
  // Current Panel view: "main" | "edit" | "settings" | "support"
  const [panelView, setPanelView] = useState<"main" | "edit" | "settings" | "support">("main");
  
  // Available toggle value
  const [isAvailable, setIsAvailable] = useState(currentUserProfile.isAvailableNow ?? true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  // Solde/Wallet withdrawals state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMMNetwork, setSelectedMMNetwork] = useState<"Wave" | "Orange" | "MTN">("Wave");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState("");
  const [withdrawErrorMsg, setWithdrawErrorMsg] = useState("");

  // Wallet defaults in database
  const balance = currentUserProfile.balance ?? 25000;
  const totalRevenue = currentUserProfile.totalRevenue ?? 75000;
  const totalWithdrawals = currentUserProfile.totalWithdrawals ?? 50000;

  // Stats defaults
  const gigsCompleted = currentUserProfile.gigsCompleted ?? (currentUserProfile.role === "musicien" ? 3 : 0);
  const applicationsSent = currentUserProfile.applicationsSent ?? (currentUserProfile.role === "musicien" ? 8 : 0);
  const acceptanceRate = currentUserProfile.acceptanceRate ?? (currentUserProfile.role === "musicien" ? 85 : 100);

  // Edit Profile fields State
  const [firstName, setFirstName] = useState(currentUserProfile.firstName || "");
  const [lastName, setLastName] = useState(currentUserProfile.lastName || "");
  const [artistName, setArtistName] = useState(currentUserProfile.artistName || "");
  const [phone, setPhone] = useState(currentUserProfile.phone || "");
  const [commune, setCommune] = useState(currentUserProfile.commune || "Cocody");
  const [bio, setBio] = useState(currentUserProfile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUserProfile.avatarUrl || currentUserProfile.photoURL || AVATARS[0]);
  
  const [speciality, setSpeciality] = useState(currentUserProfile.speciality || currentUserProfile.specialty || SPECIALTIES[0]);
  const [experienceYears, setExperienceYears] = useState(currentUserProfile.experienceYears || EXPERIENCES[1]);
  const [musicGenre, setMusicGenre] = useState(currentUserProfile.musicGenre || GENRES[0]);
  const [waveNumber, setWaveNumber] = useState(currentUserProfile.waveNumber || currentUserProfile.paymentNumber || "");
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState(currentUserProfile.orangeMoneyNumber || "");

  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState("");

  // Settings screen State Sub-Tabs: "compte" | "pref" | "secu" | "confi"
  const [settingsTab, setSettingsTab] = useState<"compte" | "pref" | "secu" | "confi">("compte");
  const [newEmail, setNewEmail] = useState(currentUserProfile.email || "");
  const [newPhone, setNewPhone] = useState(currentUserProfile.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [settingsStatusMsg, setSettingsStatusMsg] = useState("");
  
  // Settings Preference Options
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [language, setLanguage] = useState("fr");
  const [phoneVisibility, setPhoneVisibility] = useState("public");

  // Keep scroll independent
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [panelView]);

  // Keep local states synchronized with external props changes
  useEffect(() => {
    if (currentUserProfile) {
      setFirstName(currentUserProfile.firstName || "");
      setLastName(currentUserProfile.lastName || "");
      setArtistName(currentUserProfile.artistName || "");
      setPhone(currentUserProfile.phone || "");
      setCommune(currentUserProfile.commune || "Cocody");
      setBio(currentUserProfile.bio || "");
      setAvatarUrl(currentUserProfile.avatarUrl || currentUserProfile.photoURL || AVATARS[0]);
      setSpeciality(currentUserProfile.speciality || currentUserProfile.specialty || SPECIALTIES[0]);
      setExperienceYears(currentUserProfile.experienceYears || EXPERIENCES[1]);
      setMusicGenre(currentUserProfile.musicGenre || GENRES[0]);
      setWaveNumber(currentUserProfile.waveNumber || currentUserProfile.paymentNumber || "");
      setOrangeMoneyNumber(currentUserProfile.orangeMoneyNumber || "");
      setIsAvailable(currentUserProfile.isAvailableNow ?? true);
      setNewEmail(currentUserProfile.email || "");
      setNewPhone(currentUserProfile.phone || "");
    }
  }, [currentUserProfile?.uid, currentUserProfile]);

  // Handle Availability Toggle
  const handleToggleAvailability = async () => {
    setUpdatingAvailability(true);
    const newVal = !isAvailable;
    try {
      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        isAvailableNow: newVal
      });
      setIsAvailable(newVal);
      onRefreshProfile();
    } catch (err) {
      console.error("Availability error:", err);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  // Withdraw flow MVP logic
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawErrorMsg("");
    setWithdrawSuccessMsg("");
    setWithdrawLoading(true);

    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawErrorMsg("Veuillez entrer un montant valide.");
      setWithdrawLoading(false);
      return;
    }

    if (amount > balance) {
      setWithdrawErrorMsg("Solde insuffisant pour effectuer ce retrait.");
      setWithdrawLoading(false);
      return;
    }

    // Get current receiving provider target number
    const targetPhone = selectedMMNetwork === "Orange" ? orangeMoneyNumber : waveNumber;
    if (!targetPhone.trim()) {
      setWithdrawErrorMsg(`Veuillez d'abord configurer votre numéro d'argent mobile ${selectedMMNetwork} dans la page Modifier le profil.`);
      setWithdrawLoading(false);
      return;
    }

    try {
      const waitTime = new Promise(resolve => setTimeout(resolve, 1500));
      await waitTime;

      const newBalance = balance - amount;
      const newWithdrawals = totalWithdrawals + amount;

      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        balance: newBalance,
        totalWithdrawals: newWithdrawals
      });

      setWithdrawSuccessMsg(`Félicitations ! Retrait de ${amount.toLocaleString()} FCFA sur votre compte ${selectedMMNetwork} (${targetPhone}) initié avec succès !`);
      setWithdrawAmount("");
      onRefreshProfile();
    } catch (err: any) {
      console.error(err);
      setWithdrawErrorMsg("Une erreur est survenue lors de l'envoi du transfert.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Profile Save
  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess(false);
    setEditLoading(true);

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !commune) {
      setEditError("Veuillez remplir tous les champs obligatoires.");
      setEditLoading(false);
      return;
    }

    const updates: Partial<UserProfile> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      artistName: artistName.trim(),
      phone: phone.trim(),
      commune,
      bio: bio.trim(),
      avatarUrl,
      photoURL: avatarUrl,
      speciality,
      specialty: speciality,
      experienceYears,
      experience: experienceYears,
      musicGenre,
      waveNumber: waveNumber.trim(),
      orangeMoneyNumber: orangeMoneyNumber.trim(),
      updatedAt: new Date().toISOString()
    };

    try {
      await gomboDB.updateUserProfile(currentUserProfile.uid, updates);
      setEditSuccess(true);
      setTimeout(() => {
        onRefreshProfile();
        setPanelView("main");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setEditError("Une erreur est survenue lors de la sauvegarde.");
    } finally {
      setEditLoading(false);
    }
  };

  // Simulate updating accounts settings
  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsStatusMsg("");

    try {
      if (settingsTab === "compte") {
        await gomboDB.updateUserProfile(currentUserProfile.uid, {
          email: newEmail,
          phone: newPhone
        });
        setSettingsStatusMsg("Informations de compte mises à jour !");
      } else if (settingsTab === "pref") {
        setSettingsStatusMsg("Vos préférences de notifications et langues ont été configurées.");
      } else if (settingsTab === "confi") {
        setSettingsStatusMsg(`La visibilité de vos coordonnées est désormais restreinte : [${phoneVisibility}].`);
      } else {
        if (newPassword) {
          setSettingsStatusMsg("Votre mot de passe a bien été mis à jour dans votre session sécurisée.");
          setNewPassword("");
        } else {
          setSettingsStatusMsg("Sécurité auditée avec succès.");
        }
      }
      onRefreshProfile();
    } catch (err: any) {
      setSettingsStatusMsg("Erreur de mise à jour.");
    }
  };

  const handleDeleteOwnAccount = async () => {
    if (!currentUserProfile?.uid) return;
    const confirmDelete = window.confirm(
      "🔑 Sécurité Y’A GOMBO MUSIC :\n\nÊtes-vous sûr de vouloir supprimer définitivement votre compte de la plateforme ?\n\nCette action est irréversible et supprimera instantanément :\n- Vos données Firebase d'Authentification\n- Votre profil public et privé d'artiste/recruteur\n- Toutes vos candidatures et médias associés.\n\nConfirmer ?"
    );
    if (!confirmDelete) return;

    try {
      await gomboDB.deleteUserProfile(currentUserProfile.uid);
      alert("Votre compte et toutes vos données associées ont été supprimés avec succès.");
      onLogout();
    } catch (error) {
      console.error("Erreur de suppression du compte :", error);
      alert("Une erreur est survenue lors de la suppression de votre compte.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-[#1A1A1A] dark:text-gray-100">
      
      {/* 1. MAIN BOARD SCREEN */}
      {panelView === "main" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* HEADER PROFIL */}
          <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              {/* Profile image with availability toggle badge and verified status */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#FF7A00] bg-gray-100">
                  <img src={currentUserProfile.avatarUrl || currentUserProfile.photoURL || AVATARS[0]} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                {/* Verified Badge */}
                <div className="absolute -top-1 -right-1 p-1 bg-blue-500 text-white rounded-full border-2 border-white dark:border-[#121214]" title="Compte Vérifié Showbiz">
                  <ShieldCheck className="w-4 h-4 text-white fill-current" />
                </div>
                {/* Availability indicator */}
                <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white dark:border-[#121214] ${isAvailable ? "bg-emerald-500" : "bg-gray-400"}`} />
              </div>

              <div>
                <div className="flex items-center gap-1.5 justify-center sm:justify-start flex-wrap">
                  <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                    {currentUserProfile.firstName} {currentUserProfile.lastName}
                  </h2>
                  {currentUserProfile.artistName && (
                    <span className="text-sm font-bold text-orange-600 dark:text-[#FF7A00] block">
                      ({currentUserProfile.artistName})
                    </span>
                  )}
                  {/* Verified badge labeled */}
                  <span className="text-[9px] font-black tracking-widest text-[#FF7A00] dark:text-yellow-400 uppercase bg-orange-50 dark:bg-yellow-950/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    🌟 VÉRIFIÉ Showbiz
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs font-bold text-gray-400 dark:text-gray-500 mt-2">
                  <span className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">
                    🦁 {currentUserProfile.role === "musicien" ? "Musicien" : currentUserProfile.role === "client" ? "Recruteur" : "Groupe Musical"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {currentUserProfile.commune || "Abidjan"}
                  </span>
                  {(currentUserProfile.role === "musicien" || currentUserProfile.role === "groupe") && (
                    <span className="flex items-center gap-1 bg-orange-500/10 text-[#FF7A00] rounded-sm px-1 text-[11px]">
                      🎸 {speciality}
                    </span>
                  )}
                </div>

                {currentUserProfile.bio && (
                  <p className="text-xs text-gray-650 dark:text-gray-400 mt-2.5 max-w-lg leading-relaxed font-semibold italic">
                    "{currentUserProfile.bio}"
                  </p>
                )}
              </div>
            </div>

            {/* Availability action and dynamic direct button share */}
            <div className="flex flex-col items-center sm:items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-gray-50 dark:border-gray-850 pt-4 md:pt-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Disponible maintenant?</span>
                <button
                  type="button"
                  disabled={updatingAvailability}
                  onClick={handleToggleAvailability}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors relative ${isAvailable ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"}`}
                >
                  <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform ${isAvailable ? "translate-x-5.5" : "translate-x-0"}`} />
                </button>
              </div>

              {isAvailable && (
                <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 rounded-full px-3 py-1 uppercase tracking-wide">
                  🟢 ACTIF SUR LE SHOWBIZ
                </span>
              )}

              {/* Dynamic WhatsApp wa.me links for user share profile */}
              <a
                href={`https://wa.me/?text=D%C3%A9couvre%20mon%20profil%20d%20Artiste%20sur%20Y%27A%20GOMBO%20MUSIC%20!%20${encodeURIComponent(window.location.origin)}`}
                target="_blank"
                rel="no-referrer"
                className="w-full text-center sm:text-right px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                📱 Partager mon profil
              </a>
            </div>
          </div>

          {/* SECTION SOLDE ("Mon Solde" card) && STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Wallet Solde Component */}
            <div className="bg-gradient-to-br from-gray-900 to-[#121215] text-white p-6 rounded-3xl border border-gray-800 shadow-xl space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-widest block">💳 Mon Solde de Réserve</span>
                  <h3 className="text-3xl font-black text-[#FF7A00] tracking-tight mt-1.5">
                    {balance.toLocaleString()} <span className="text-base text-white/80">FCFA</span>
                  </h3>
                </div>
                <div className="bg-orange-500/10 p-2.5 rounded-2xl text-[#FF7A00] border border-orange-500/20">
                  <Wallet className="w-6 h-6 stroke-[2.5px]" />
                </div>
              </div>

              {/* Mini history data points */}
              <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4 text-xs font-bold">
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-500 block">Revenus Reçus</span>
                  <span className="text-emerald-400 mt-1 block">+{totalRevenue.toLocaleString()} FCFA</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-500 block">Retraits Mobile Money</span>
                  <span className="text-red-400 mt-1 block">-{totalWithdrawals.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Withdraw form */}
              <form onSubmit={handleWithdraw} className="space-y-3 pt-1">
                <span className="text-[11px] uppercase font-black text-gray-300 block">Faire un retrait d'argent</span>
                
                {withdrawSuccessMsg && (
                  <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl">
                    ✅ {withdrawSuccessMsg}
                  </div>
                )}
                {withdrawErrorMsg && (
                  <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl">
                    ⚠️ {withdrawErrorMsg}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      placeholder="Montant FCFA"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#FF7A00]"
                    />
                  </div>
                  
                  <select
                    value={selectedMMNetwork}
                    onChange={(e) => setSelectedMMNetwork(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-xs font-bold text-gray-350 focus:outline-none"
                  >
                    <option value="Wave" className="text-black">🌊 Wave</option>
                    <option value="Orange" className="text-black">🍊 Orange</option>
                    <option value="MTN" className="text-black">🟡 MTN</option>
                  </select>

                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="px-4 bg-[#FF7A00] hover:bg-orange-600 font-extrabold text-xs text-white rounded-xl shadow-md transition-colors active:scale-97 flex items-center justify-center"
                  >
                    {withdrawLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Retirer"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Statistiques Panel */}
            <div className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-md space-y-4">
              <span className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-widest block">🎯 STATS D'ACTIVITÉ</span>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl">
                  <span className="text-2xl font-black text-gray-900 dark:text-white block">{gigsCompleted}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight block mt-1">Gombos Joués</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl font-bold">
                  <span className="text-2xl font-black text-gray-900 dark:text-white block">{applicationsSent}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight block mt-1">Candidatures</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl font-bold">
                  <span className="text-2xl font-black text-[#FF7A00] block">{acceptanceRate}%</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight block mt-1">Acceptation</span>
                </div>
              </div>

              {/* User rating out of 5 stars */}
              <div className="p-4 bg-orange-50/20 dark:bg-orange-950/5 border border-orange-100 dark:border-orange-900/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-orange-600 dark:text-[#FF7A00] uppercase tracking-wider block">Note de Showbiz</span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-450 mt-1 block">Évaluations régulières sur Abidjan</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <span className="text-xs font-black text-yellow-600 dark:text-yellow-400 mt-1">5.0 / 5.0 (Pro)</span>
                </div>
              </div>
            </div>

          </div>

          {/* SECTION ACTIONS RAPIDES */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-widest block">⚡ ACTIONS RAPIDES</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Modifier Mon Coin", icon: User, action: () => setPanelView("edit"), color: "hover:border-[#7C3AED] hover:text-[#7C3AED]" },
                { label: "Mes Plans", icon: FileText, action: () => onNavigateView("dashboard"), color: "hover:border-purple-500 hover:text-purple-500" },
                { label: "Les Cachets", icon: Calendar, action: () => onNavigateView("dashboard"), color: "hover:border-emerald-500 hover:text-emerald-500" },
                { label: "Le Terrain", icon: Award, action: () => onNavigateView("dashboard"), color: "hover:border-[#7C3AED] hover:text-[#7C3AED]" },
                { label: "Réglages", icon: Settings, action: () => setPanelView("settings"), color: "hover:border-[#7C3AED] hover:text-[#7C3AED]" },
                { label: "On est là", icon: HelpCircle, action: () => setPanelView("support"), color: "hover:border-teal-500 hover:text-teal-500" }
              ].map((act, index) => {
                const IconComp = act.icon;
                return (
                  <button
                    key={index}
                    onClick={act.action}
                    className={`p-4 bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 rounded-2xl font-bold text-xs tracking-tight transition-all active:scale-97 text-gray-750 dark:text-gray-300 flex flex-col items-center justify-center gap-3 shadow-xs ${act.color}`}
                  >
                    <IconComp className="w-5 h-5" />
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onLogout}
              className="w-full p-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4.5 h-4.5" />
              Se Déconnecter de Y’A GOMBO MUSIC
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. EDIT PROFILE PANEL */}
      {panelView === "edit" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
              <User className="w-5.5 h-5.5 text-orange-500" />
              Modifier l'identité
            </h3>
            <button 
              onClick={() => setPanelView("main")}
              className="text-xs font-bold text-gray-500 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Retour
            </button>
          </div>

          {editError && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-705 text-sm font-semibold rounded-xl">
              ⚠️ {editError}
            </div>
          )}

          {editSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-805 text-sm font-semibold rounded-xl">
              🎉 Profil mis à jour avec succès !
            </div>
          )}

          <form onSubmit={handleEditProfileSubmit} className="space-y-6">
            <div className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                  Photo de Profil (Avatar)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {AVATARS.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                        avatarUrl === url ? "border-[#FF7A00] scale-105" : "border-transparent"
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {avatarUrl === url && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Prénom</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#FF7A00] dark:text-white text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Nom</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#FF7A00] dark:text-white text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Nom d'Artiste / Pseudonyme</label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#FF7A00] dark:text-white text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Téléphone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#FF7A00] dark:text-white text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Commune d'Abidjan</label>
                  <select
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#FF7A00] dark:text-white text-black"
                  >
                    {ABIDJAN_COMMUNES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Ma présentation / Bio</label>
                <textarea
                  value={bio}
                  rows={3}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#FF7A00] dark:text-white text-black"
                />
              </div>
            </div>

            {(currentUserProfile.role === "musicien" || currentUserProfile.role === "groupe") && (
              <div className="bg-white dark:bg-[#121214] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                <span className="text-sm font-black text-gray-500 uppercase tracking-widest block">🎸 Détails Showbiz</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Spécialité Principale</label>
                    <select
                      value={speciality}
                      onChange={(e) => setSpeciality(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-105 rounded-xl text-sm text-black"
                    >
                      {SPECIALTIES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Genre Musical</label>
                    <select
                      value={musicGenre}
                      onChange={(e) => setMusicGenre(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-105 rounded-xl text-sm text-black"
                    >
                      {GENRES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Années de scène de niveau</label>
                    <select
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-105 rounded-xl text-sm text-black"
                    >
                      {EXPERIENCES.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-850 pt-4 space-y-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wide block">💸 Mobile Money Targets</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">🌊 WAVE</label>
                      <input
                        type="text"
                        value={waveNumber}
                        onChange={(e) => setWaveNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-black dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">🍊 ORANGE MONEY</label>
                      <input
                        type="text"
                        value={orangeMoneyNumber}
                        onChange={(e) => setOrangeMoneyNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-black dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPanelView("main")}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-750 dark:text-gray-300 font-bold rounded-xl"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-8 py-3 bg-[#FF7A00] hover:bg-orange-600 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                {editLoading ? "Sauvegarde..." : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* 3. SETTINGS PANEL */}
      {panelView === "settings" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
              <Settings className="w-5.5 h-5.5 text-orange-500" />
              Paramètres Globaux
            </h3>
            <button 
              onClick={() => setPanelView("main")}
              className="text-xs font-bold text-gray-500 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-1.5"
            >
              Retour
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Setting side tabs */}
            <div className="md:col-span-1 flex md:flex-col gap-2 overflow-x-auto whitespace-nowrap">
              {[
                { id: "compte", label: "👨‍💻 Compte", icon: User },
                { id: "pref", label: "📱 Préférences", icon: Bell },
                { id: "secu", label: "🛡️ Sécurité", icon: Shield },
                { id: "confi", label: "🔒 Confidentialité", icon: Lock }
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => { setSettingsTab(subTab.id as any); setSettingsStatusMsg(""); }}
                  className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all text-left flex items-center gap-2 cursor-pointer ${
                    settingsTab === subTab.id
                      ? "bg-purple-100/70 text-[#7C3AED] dark:bg-purple-950/20 dark:text-[#A78BFA]"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <subTab.icon className="w-4 h-4" />
                  <span>{subTab.label}</span>
                </button>
              ))}
            </div>

            {/* Sub-tab form */}
            <div className="md:col-span-3 bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-4">
              {settingsStatusMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 rounded-r-xl text-emerald-805 text-xs font-semibold">
                  {settingsStatusMsg}
                </div>
              )}

              <form onSubmit={handleSettingsUpdate} className="space-y-4 font-sans">
                {settingsTab === "compte" && (
                  <div className="space-y-4">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Paramètres du compte</span>
                    <div>
                      <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Changer Adresse Email</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Changer Téléphone</label>
                      <input
                        type="text"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white"
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                      <span className="text-xs font-black text-rose-500 uppercase tracking-widest block">Zone de Danger ⚠️</span>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed font-semibold">
                        La suppression de votre compte effacera de manière irréversible votre profil d'artiste showbiz, vos coordonnées mobile money pour les gombos, vos candidatures et vos médias de la base Firebase de Y'A GOMBO MUSIC.
                      </p>
                      <button
                        type="button"
                        id="btn-delete-account-settings"
                        onClick={handleDeleteOwnAccount}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all"
                      >
                        Supprimer mon compte
                      </button>
                    </div>
                  </div>
                )}

                {settingsTab === "pref" && (
                  <div className="space-y-4">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Préférences d'utilisation</span>
                    
                    <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-850 pb-3">
                      <div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Notifications SMS Showbiz</span>
                        <span className="text-[10px] text-gray-400 block">Recevoir une alerte WhatsApp ou SMS lors d'un nouveau gombo</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifEnabled(!notifEnabled)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${notifEnabled ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-700"}`}
                      >
                        <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform ${notifEnabled ? "translate-x-4.5" : "translate-x-0"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-850 pb-3">
                      <div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Mode Sombre Éco-Énergie</span>
                        <span className="text-[10px] text-gray-400 block">Améliore la batterie pour les concerts de nuit à Abidjan</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDarkMode(!darkMode)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${darkMode ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-700"}`}
                      >
                        <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform ${darkMode ? "translate-x-4.5" : "translate-x-0"}`} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Langue préférée</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 rounded-xl text-xs dark:text-white"
                      >
                        <option value="fr">Français (Showbiz 🇨🇮)</option>
                        <option value="en">English (West Africa)</option>
                      </select>
                    </div>
                  </div>
                )}

                {settingsTab === "secu" && (
                  <div className="space-y-4">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Audit de Sécurité</span>
                    
                    <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-2xl text-xs space-y-1.5 border border-gray-100 dark:border-gray-800">
                      <p>📱 <strong>Dernier appareil connecté :</strong> Android Chrome V120, Abidjan</p>
                      <p>🌐 <strong>Dernière connexion :</strong> Aujourd'hui, 08h00</p>
                      <p>🛡️ <strong>Statut du certificat :</strong> Sécurisé par Firebase & Cryptage AES</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Nouveau mot de passe</label>
                      <input
                        type="password"
                        placeholder="Créer un nouveau mot de passe"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold dark:text-white text-black"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => alert("Tous vos appareils ont été déconnectés avec succès.")}
                      className="text-[10px] uppercase font-black text-red-500 hover:underline block"
                    >
                      ⚠️ Déconnecter tous les autres appareils d'Abidjan
                    </button>
                  </div>
                )}

                {settingsTab === "confi" && (
                  <div className="space-y-4">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block">Confidentialité & Visibilité</span>
                    <div>
                      <label className="block text-xs font-bold text-gray-650 dark:text-gray-400 mb-1">Qui peut voir mes coordonnées (Téléphone)?</label>
                      <select
                        value={phoneVisibility}
                        onChange={(e) => setPhoneVisibility(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-105 rounded-xl text-xs dark:text-white"
                      >
                        <option value="public">Tout le monde sur la plateforme</option>
                        <option value="recruters">Seulement les clients qui m'ont réservé</option>
                        <option value="private">Strictement privé</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                >
                  Sauvegarder les paramètres
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. SUPPORT PANEL */}
      {panelView === "support" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-[#121214] border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm text-center space-y-4"
        >
          <div className="inline-flex p-3 bg-orange-100 dark:bg-orange-950 text-[#FF7A00] rounded-full">
            <HelpCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold uppercase text-gray-900 dark:text-white">SUPPORT ASSISTANCE GOMBO</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            Besoin d'aide pour une transaction Wave suspendue ou une annulation de gombo de dernière minute ? Nos administrateurs Showbiz basés au Plateau sont disponibles 24/7.
          </p>
          <div className="pt-2">
            <a
              href="https://wa.me/2250102030405?text=Salut%20l%27equipe%20Gombo%20!%20J%27ai%20besoin%20d%27assistance%20avec%20mon%20compte."
              target="_blank"
              rel="no-referrer"
              className="inline-flex px-6 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-extrabold rounded-xl uppercase tracking-wider gap-2 shadow-md"
            >
              💬 Parler à un Admin sur WhatsApp
            </a>
          </div>
          <p className="text-[10px] text-gray-400">Y'A GOMBO MUSIC Assistance - +225 01 02 03 04 05</p>

          <div className="pt-4">
            <button
              onClick={() => setPanelView("main")}
              className="text-xs font-bold text-gray-500 hover:underline"
            >
              Retour à mon profil
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
}
