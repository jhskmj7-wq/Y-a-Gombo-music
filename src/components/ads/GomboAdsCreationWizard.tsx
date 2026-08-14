import React, { useState, useEffect } from "react";
import { 
  X, 
  Megaphone, 
  UserCheck, 
  Calendar, 
  Check, 
  ChevronRight, 
  ArrowLeft, 
  Wallet, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  CreditCard,
  PlusCircle,
  MapPin
} from "lucide-react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { GomboAdsType, GomboAdsPlacement } from "../../types";
import { GomboAdsService, GOMBO_ADS_DAILY_RATES, CampaignCostBreakdown } from "../../services/GomboAdsService";
import { getCanonicalWalletBalance } from "../../lib/financial";
import { AndroidBottomSheet } from "../common/AndroidBottomSheet";

interface GomboAdsCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: any;
  initialType?: GomboAdsType;
  onSuccess: (campaignId: string) => void;
  onOpenWalletDeposit: () => void;
}

export const GomboAdsCreationWizard: React.FC<GomboAdsCreationWizardProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  initialType,
  onSuccess,
  onOpenWalletDeposit
}) => {
  const userId = currentUserProfile?.uid || currentUserProfile?.id;
  const walletBalance = getCanonicalWalletBalance(currentUserProfile) ?? 0;

  // Wizard Step: 1 = Type, 2 = Select Content, 3 = Select Duration, 4 = Confirmation
  const [step, setStep] = useState<number>(1);
  const [selectedType, setSelectedType] = useState<GomboAdsType>(initialType || "gombo");

  // Content Selection state
  const [userItems, setUserItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Form Fields
  const [customTitle, setCustomTitle] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string>("");
  const [customLocation, setCustomLocation] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [durationDays, setDurationDays] = useState<number>(7);

  // Processing state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showInsufficientBalanceSheet, setShowInsufficientBalanceSheet] = useState<boolean>(false);

  // Calculated cost
  const costBreakdown: CampaignCostBreakdown = GomboAdsService.calculateCampaignCost(
    selectedType,
    durationDays
  );

  const balanceAfterPayment = walletBalance - costBreakdown.totalCost;

  // Sync initial type when changed
  useEffect(() => {
    if (initialType) {
      setSelectedType(initialType);
    }
  }, [initialType]);

  // Load user items for Step 2
  useEffect(() => {
    if (!isOpen || !userId) return;

    if (selectedType === "profile") {
      // Profile item is current user
      const profileItem = {
        id: userId,
        title: currentUserProfile.artisticName || currentUserProfile.displayName || currentUserProfile.name || "Mon Profil",
        description: currentUserProfile.bio || "Membre actif AFRIGOMBO",
        mediaUrl: currentUserProfile.photoURL || currentUserProfile.avatarUrl || "",
        locationName: currentUserProfile.commune || "Cocody, Abidjan",
        category: currentUserProfile.specialties?.[0] || "Artiste / Prestataire"
      };
      setSelectedItem(profileItem);
      setCustomTitle(profileItem.title);
      setCustomDescription(profileItem.description);
      setCustomLocation(profileItem.locationName);
      setCustomCategory(profileItem.category);
      setMediaUrl(profileItem.mediaUrl);
    } else if (step === 2) {
      loadUserContent();
    }
  }, [step, selectedType, isOpen, userId]);

  const loadUserContent = async () => {
    setLoadingItems(true);
    setUserItems([]);
    try {
      if (selectedType === "gombo" || selectedType === "offer") {
        // Query published gombos or posts
        const qGombos = query(
          collection(db, "gombos"),
          where("createdBy", "==", userId),
          limit(20)
        );
        const snapG = await getDocs(qGombos);
        const gList: any[] = [];
        snapG.forEach((doc) => {
          const d = doc.data();
          gList.push({
            id: doc.id,
            title: d.title || "Titre du Gombo",
            description: d.description || d.summary || "",
            mediaUrl: d.imageUrl || d.mediaURL || d.mediaUrl || "",
            locationName: d.commune || d.locationName || "Abidjan",
            category: d.category || "Gombo"
          });
        });

        // Also check posts if empty
        if (gList.length === 0) {
          const qPosts = query(
            collection(db, "posts"),
            where("userId", "==", userId),
            limit(10)
          );
          const snapP = await getDocs(qPosts);
          snapP.forEach((doc) => {
            const d = doc.data();
            gList.push({
              id: doc.id,
              title: d.title || d.content?.substring(0, 50) || "Publication",
              description: d.content || "",
              mediaUrl: d.mediaUrl || d.photoURL || "",
              locationName: d.commune || "Abidjan",
              category: "Publication"
            });
          });
        }

        setUserItems(gList);
        if (gList.length > 0) {
          selectItem(gList[0]);
        }
      } else if (selectedType === "event") {
        const qEvents = query(
          collection(db, "events"),
          where("createdBy", "==", userId),
          limit(20)
        );
        const snapE = await getDocs(qEvents);
        const eList: any[] = [];
        snapE.forEach((doc) => {
          const d = doc.data();
          eList.push({
            id: doc.id,
            title: d.title || d.name || "Mon Événement",
            description: d.description || "",
            mediaUrl: d.imageUrl || d.coverUrl || "",
            locationName: d.venue || d.commune || "Abidjan",
            category: "Événement"
          });
        });
        setUserItems(eList);
        if (eList.length > 0) {
          selectItem(eList[0]);
        }
      }
    } catch (e) {
      console.warn("Error fetching user content:", e);
    } finally {
      setLoadingItems(false);
    }
  };

  const selectItem = (item: any) => {
    setSelectedItem(item);
    setCustomTitle(item.title);
    setCustomDescription(item.description);
    setCustomLocation(item.locationName || "Abidjan");
    setCustomCategory(item.category || "Gombo");
    setMediaUrl(item.mediaUrl || "");
  };

  const handleNextFromStep1 = (type: GomboAdsType) => {
    setSelectedType(type);
    if (type === "profile") {
      setStep(3); // Skip content selection for profile
    } else {
      setStep(2);
    }
  };

  const handleLaunchCampaign = async () => {
    if (submitting) return;

    // Validate balance first
    if (walletBalance < costBreakdown.totalCost) {
      setShowInsufficientBalanceSheet(true);
      return;
    }

    if (!selectedItem) {
      setErrorMsg("Veuillez sélectionner un élément à promouvoir.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await GomboAdsService.createCampaign(currentUserProfile, {
        type: selectedType,
        targetId: selectedItem.id,
        title: customTitle || selectedItem.title,
        description: customDescription || selectedItem.description,
        mediaUrl: mediaUrl || selectedItem.mediaUrl,
        locationName: customLocation || selectedItem.locationName,
        commune: customLocation || selectedItem.locationName,
        category: customCategory || selectedItem.category,
        durationDays
      });

      if (res.success && res.campaignId) {
        onSuccess(res.campaignId);
        onClose();
      } else {
        setErrorMsg(res.error || "Échec de la création de la campagne.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Erreur lors de la création de la campagne.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden font-sans">
        <div className="relative w-full max-w-lg bg-[#09090b] border border-[#D4AF37]/30 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              {step > 1 && (
                <button 
                  onClick={() => setStep(step === 3 && selectedType === "profile" ? 1 : step - 1)}
                  className="p-1.5 rounded-full bg-zinc-800 text-zinc-300 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <span className="text-[10px] font-bold text-[#D4AF37] tracking-widest uppercase block">
                  ÉTAPE {step} SUR {selectedType === "profile" ? "3" : "4"}
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {step === 1 && "Que veux-tu promouvoir ?"}
                  {step === 2 && "Sélectionne le contenu"}
                  {step === 3 && "Choisis la durée"}
                  {step === 4 && "Confirmation de campagne"}
                </h3>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-900 h-1">
            <div 
              className="bg-gradient-to-r from-[#D4AF37] to-[#f1d06b] h-full transition-all duration-300"
              style={{ width: `${(step / (selectedType === "profile" ? 3 : 4)) * 100}%` }}
            />
          </div>

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-200 font-medium">{errorMsg}</p>
              </div>
            )}

            {/* STEP 1: Select Type */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed mb-1">
                  Sélectionne le type d'élément auquel tu souhaites donner une visibilité maximale sur AFRIGOMBO.
                </p>

                {/* Card 1: Gombo */}
                <div 
                  onClick={() => handleNextFromStep1("gombo")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedType === "gombo" 
                      ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10" 
                      : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#b89327] flex items-center justify-center shadow-md">
                      <Megaphone className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">📣 PROMOUVOIR UN GOMBO</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Augmente la visibilité d'une publication ou offre de mission Gombo.</p>
                      <span className="inline-block mt-1 text-[11px] font-bold text-[#D4AF37]">
                        {GOMBO_ADS_DAILY_RATES.gombo.toLocaleString("fr-FR")} FCFA / jour
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                </div>

                {/* Card 2: Profil / Talent */}
                <div 
                  onClick={() => handleNextFromStep1("profile")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedType === "profile" 
                      ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10" 
                      : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#b89327] flex items-center justify-center shadow-md">
                      <UserCheck className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">⭐ PROMOUVOIR MON PROFIL</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Mets ton profil d'artiste ou prestataire davantage en avant dans l'annuaire.</p>
                      <span className="inline-block mt-1 text-[11px] font-bold text-[#D4AF37]">
                        {GOMBO_ADS_DAILY_RATES.profile.toLocaleString("fr-FR")} FCFA / jour
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                </div>

                {/* Card 3: Événement */}
                <div 
                  onClick={() => handleNextFromStep1("event")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedType === "event" 
                      ? "bg-[#D4AF37]/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10" 
                      : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#b89327] flex items-center justify-center shadow-md">
                      <Calendar className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">🎉 PROMOUVOIR UN ÉVÉNEMENT</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Fais connaître ton concert, showcase ou atelier au plus grand nombre.</p>
                      <span className="inline-block mt-1 text-[11px] font-bold text-[#D4AF37]">
                        {GOMBO_ADS_DAILY_RATES.event.toLocaleString("fr-FR")} FCFA / jour
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                </div>
              </div>
            )}

            {/* STEP 2: Content Selection */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Sélectionne le {selectedType === "event" ? "événement" : "Gombo"} que tu veux sponsoriser :
                </p>

                {loadingItems ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mb-2" />
                    <span className="text-xs text-zinc-400">Chargement de ton contenu...</span>
                  </div>
                ) : userItems.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center space-y-3">
                    <p className="text-xs text-zinc-300">
                      Aucun {selectedType === "event" ? "événement" : "Gombo"} trouvé sur votre compte.
                    </p>
                    <p className="text-xs text-zinc-500">
                      Vous pouvez personnaliser les informations directement ci-dessous pour créer une campagne sponsorisée dédiée.
                    </p>
                    <div className="pt-2 text-left space-y-2">
                      <label className="text-xs font-bold text-zinc-300">Titre de l'annonce</label>
                      <input 
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Ex: Soirée Acoustique / Recrutement Guitariste"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                      />

                      <label className="text-xs font-bold text-zinc-300">Description</label>
                      <textarea 
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="Décris brièvement ton opportunité..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-[#D4AF37] outline-none h-20 resize-none"
                      />

                      <label className="text-xs font-bold text-zinc-300">Lien Image / Média (Optionnel)</label>
                      <input 
                        type="url"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {userItems.map((item) => {
                      const isSelected = selectedItem?.id === item.id;
                      return (
                        <div 
                          key={item.id}
                          onClick={() => selectItem(item)}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-[#D4AF37]/15 border-[#D4AF37]" 
                              : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          {item.mediaUrl ? (
                            <img src={item.mediaUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                              <Megaphone className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                            <p className="text-[11px] text-zinc-400 line-clamp-1">{item.description}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "bg-[#D4AF37] border-[#D4AF37]" : "border-zinc-700"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-black font-extrabold" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button 
                  onClick={() => setStep(3)}
                  disabled={!selectedItem && !customTitle}
                  className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#b89327] text-black font-extrabold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>CONTINUER VERS LA DURÉE</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 3: Select Duration */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400">
                  Combien de temps souhaites-tu diffuser cette campagne ?
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[1, 3, 7, 14, 30].map((days) => {
                    const isSel = durationDays === days;
                    const previewCost = GomboAdsService.calculateCampaignCost(selectedType, days);

                    return (
                      <button
                        key={days}
                        onClick={() => setDurationDays(days)}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                          isSel 
                            ? "bg-[#D4AF37]/15 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10" 
                            : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        {previewCost.discountRate > 0 && (
                          <span className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
                            -{(previewCost.discountRate * 100).toFixed(0)}%
                          </span>
                        )}
                        <span className="text-sm font-extrabold text-white block">
                          {days} {days === 1 ? "Jour" : "Jours"}
                        </span>
                        <span className="text-xs font-bold text-[#D4AF37] block mt-1">
                          {previewCost.totalCost.toLocaleString("fr-FR")} FCFA
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          ~{Math.round(previewCost.totalCost / days).toLocaleString("fr-FR")} / jour
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Summary Card Preview */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Tarif de base journalier</span>
                    <span className="text-white font-medium">{costBreakdown.dailyRate.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Sous-total ({durationDays} jours)</span>
                    <span className="text-white font-medium">{costBreakdown.subtotal.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  {costBreakdown.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Réduction ({costBreakdown.discountRate * 100}%)</span>
                      <span>-{costBreakdown.discountAmount.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-extrabold text-white">
                    <span>Total à régler</span>
                    <span className="text-[#D4AF37] text-base">{costBreakdown.totalCost.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                </div>

                <button 
                  onClick={() => setStep(4)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#b89327] text-black font-extrabold text-xs flex items-center justify-center gap-2"
                >
                  <span>VÉRIFIER & CONFIRMER</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 4: Confirmation & Payment */}
            {step === 4 && (
              <div className="space-y-4">
                {/* Summary Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#18181b] to-[#09090b] border border-[#D4AF37]/40 space-y-3">
                  <div className="flex items-center gap-2 text-[#D4AF37] font-extrabold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    RÉCAPITULATIF DE LA CAMPAGNE
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white truncate">
                      {customTitle || selectedItem?.title || "Campagne Sponsorisée"}
                    </h4>
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {customDescription || selectedItem?.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Type</span>
                      <span className="text-white font-bold uppercase">{selectedType}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Durée</span>
                      <span className="text-white font-bold">{durationDays} jours</span>
                    </div>
                  </div>
                </div>

                {/* Wallet Balance Box */}
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Wallet className="w-4 h-4 text-[#D4AF37]" />
                      Solde Wallet actuel
                    </span>
                    <span className="font-extrabold text-white">
                      {walletBalance.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-zinc-300">
                    <span>Coût de la campagne</span>
                    <span className="font-extrabold text-red-400">
                      -{costBreakdown.totalCost.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                    <span className="font-bold text-zinc-200">Solde après paiement</span>
                    <span className={`font-black text-sm ${balanceAfterPayment >= 0 ? "text-emerald-400" : "text-red-500"}`}>
                      {balanceAfterPayment.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>

                {/* Insufficient Funds warning inline if needed */}
                {balanceAfterPayment < 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <span className="text-xs text-amber-200 font-semibold">
                        Solde insuffisant pour régler cette campagne.
                      </span>
                    </div>
                    <button 
                      onClick={onOpenWalletDeposit}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs whitespace-nowrap"
                    >
                      Recharger
                    </button>
                  </div>
                )}

                {/* CTA Launch */}
                <button 
                  onClick={handleLaunchCampaign}
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#f1d06b] to-[#D4AF37] text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#D4AF37]/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>TRAITEMENT SÉCURISÉ...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 LANCER LA CAMPAGNE</span>
                      <span className="bg-black/20 text-black px-2 py-0.5 rounded-lg text-[11px]">
                        {costBreakdown.totalCost.toLocaleString("fr-FR")} FCFA
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Insufficient Balance Bottom Sheet */}
      <AndroidBottomSheet
        isOpen={showInsufficientBalanceSheet}
        onClose={() => setShowInsufficientBalanceSheet(false)}
        title="Solde Wallet Insuffisant"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Wallet className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-extrabold text-white">Recharge requise</h4>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Votre solde disponible est de <strong className="text-white">{walletBalance.toLocaleString("fr-FR")} FCFA</strong>. Il vous manque <strong className="text-amber-400">{Math.abs(balanceAfterPayment).toLocaleString("fr-FR")} FCFA</strong> pour lancer cette campagne Gombo Ads.
            </p>
          </div>

          <div className="pt-3 space-y-2">
            <button 
              onClick={() => {
                setShowInsufficientBalanceSheet(false);
                onClose();
                onOpenWalletDeposit();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#b89327] text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ALIMENTER LE WALLET</span>
            </button>

            <button 
              onClick={() => setShowInsufficientBalanceSheet(false)}
              className="w-full py-2.5 rounded-2xl bg-zinc-900 text-zinc-400 font-bold text-xs"
            >
              ANNULER
            </button>
          </div>
        </div>
      </AndroidBottomSheet>
    </>
  );
};
