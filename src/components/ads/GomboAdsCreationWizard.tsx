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
  PlusCircle,
  Coins
} from "lucide-react";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { GomboAdsType, GomboAdsPlacement } from "../../types";
import { GomboAdsService, GomboAdsOffer } from "../../services/GomboAdsService";
import { GawaEngineService } from "../../lib/GawaEngineService";
import { AndroidBottomSheet } from "../common/AndroidBottomSheet";

interface GomboAdsCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: any;
  initialType?: GomboAdsType;
  onSuccess: (campaignId: string) => void;
  onOpenWalletDeposit: () => void;
  initialTargetId?: string;
}

export const GomboAdsCreationWizard: React.FC<GomboAdsCreationWizardProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  initialType,
  onSuccess,
  onOpenWalletDeposit,
  initialTargetId
}) => {
  const userId = currentUserProfile?.uid || currentUserProfile?.id;

  // Wizard Step: 1 = Type, 2 = Select Content, 3 = Select Offer, 4 = Confirmation
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

  // Offers state
  const [offers, setOffers] = useState<GomboAdsOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<GomboAdsOffer | null>(null);
  const [loadingOffers, setLoadingOffers] = useState<boolean>(true);
  const [gawaBalance, setGawaBalance] = useState<number>(0);

  // Processing state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showInsufficientBalanceSheet, setShowInsufficientBalanceSheet] = useState<boolean>(false);

  // Sync initial type when changed
  useEffect(() => {
    if (initialType) {
      setSelectedType(initialType);
    }
  }, [initialType]);

  // Load offers on open
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchOffers = async () => {
      setLoadingOffers(true);
      try {
        const list = await GomboAdsService.getOffers();
        const activeOffers = list.filter(o => o.enabled);
        setOffers(activeOffers);
        if (activeOffers.length > 0) {
          setSelectedOffer(activeOffers[0]);
        }
      } catch (err) {
        console.error("Failed to load offers:", err);
      } finally {
        setLoadingOffers(false);
      }
    };

    fetchOffers();
  }, [isOpen]);

  // Subscribe to real-time Gawa balance
  useEffect(() => {
    if (!isOpen || !userId) return;
    const unsub = GawaEngineService.subscribeUserGawaBalance(userId, (bal) => {
      setGawaBalance(bal);
    });
    return () => unsub();
  }, [isOpen, userId]);

  // Preselect Gombo if initialTargetId is provided
  useEffect(() => {
    if (!isOpen || !userId || !initialTargetId) return;

    const fetchPreselectedGombo = async () => {
      setLoadingItems(true);
      try {
        const gRef = doc(db, "gombos", initialTargetId);
        const gSnap = await getDoc(gRef);
        if (gSnap.exists()) {
          const d = gSnap.data();
          const item = {
            id: gSnap.id,
            title: d.title || "Titre du Gombo",
            description: d.description || d.summary || "",
            mediaUrl: d.imageUrl || d.mediaURL || d.mediaUrl || "",
            locationName: d.commune || d.locationName || "Abidjan",
            category: d.category || "Gombo"
          };
          selectItem(item);
          setSelectedType("gombo");
          setStep(3); // Go straight to offer selection
        } else {
          const pRef = doc(db, "posts", initialTargetId);
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            const d = pSnap.data();
            const item = {
              id: pSnap.id,
              title: d.title || d.content?.substring(0, 50) || "Publication",
              description: d.content || "",
              mediaUrl: d.mediaUrl || d.photoURL || "",
              locationName: d.commune || "Abidjan",
              category: "Publication"
            };
            selectItem(item);
            setSelectedType("gombo");
            setStep(3);
          }
        }
      } catch (err) {
        console.error("Failed to fetch preselected gombo:", err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchPreselectedGombo();
  }, [isOpen, userId, initialTargetId]);

  const costGawa = selectedOffer ? selectedOffer.priceGawa : 0;
  const balanceAfterPayment = gawaBalance - costGawa;

  // Load user items for Step 2
  useEffect(() => {
    if (!isOpen || !userId || initialTargetId) return; // Skip standard loading if preselected

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
    if (submitting || !selectedOffer) return;

    // Validate balance first
    if (gawaBalance < selectedOffer.priceGawa) {
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
        offerId: selectedOffer.id,
        targetId: selectedItem.id,
        title: customTitle || selectedItem.title,
        description: customDescription || selectedItem.description,
        mediaUrl: mediaUrl || selectedItem.mediaUrl,
        locationName: customLocation || selectedItem.locationName,
        commune: customLocation || selectedItem.locationName,
        category: customCategory || selectedItem.category
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
                  {step === 3 && "Choisis une offre Gombo Ads"}
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
                      <span className="inline-block mt-1 text-[11px] font-bold text-[#D4AF37] font-mono">
                        Paiement sécurisé en GAWA
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
                      <span className="inline-block mt-1 text-[11px] font-bold text-[#D4AF37] font-mono">
                        Paiement sécurisé en GAWA
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
                      <span className="inline-block mt-1 text-[11px] font-bold text-[#D4AF37] font-mono">
                        Paiement sécurisé en GAWA
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
                  <span>CONTINUER VERS LES OFFRES</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 3: Select Offer Pack */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400">
                  Sélectionne un pack publicitaire pour ta campagne :
                </p>

                {loadingOffers ? (
                  <div className="py-8 flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin mb-2" />
                    <span className="text-xs text-zinc-500 font-mono">Chargement des tarifs Gawa...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {offers.map((offer) => {
                      const isSel = selectedOffer?.id === offer.id;
                      return (
                        <button
                          key={offer.id}
                          onClick={() => setSelectedOffer(offer)}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center ${
                            isSel 
                              ? "bg-[#D4AF37]/15 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10" 
                              : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white uppercase tracking-wide">
                                {offer.name}
                              </span>
                              <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] font-black px-2 py-0.5 rounded-full uppercase">
                                {offer.durationDays} {offer.durationDays === 1 ? "jour" : "jours"}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-tight">
                              Placements : {offer.placements.join(", ")}
                            </p>
                          </div>

                          <div className="text-right flex items-center gap-3">
                            <div>
                              <span className="text-base font-black text-[#D4AF37] block font-mono">
                                {offer.priceGawa} G
                              </span>
                              <span className="text-[9px] text-zinc-500 block font-mono">
                                ~{Math.round(offer.priceGawa / offer.durationDays)} G / jour
                              </span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                              isSel ? "bg-[#D4AF37] border-[#D4AF37]" : "border-zinc-700"
                            }`}>
                              {isSel && <Check className="w-3.5 h-3.5 text-black font-extrabold" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedOffer && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Offre publicitaire</span>
                      <span className="text-white font-bold">{selectedOffer.name}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Durée de livraison</span>
                      <span className="text-white font-medium">{selectedOffer.durationDays} jour(s)</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Budget total alloué</span>
                      <span className="text-white font-mono">{selectedOffer.budgetGawa} Gawa (G)</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-extrabold text-white">
                      <span>Total à régler</span>
                      <span className="text-[#D4AF37] text-base font-mono">{selectedOffer.priceGawa} G</span>
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setStep(4)}
                  disabled={!selectedOffer}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#b89327] text-black font-extrabold text-xs flex items-center justify-center gap-2"
                >
                  <span>VÉRIFIER & CONFIRMER</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 4: Confirmation & Payment */}
            {step === 4 && selectedOffer && (
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
                      <span className="text-zinc-500 block text-[10px]">Offre sélectionnée</span>
                      <span className="text-white font-bold">{selectedOffer.name} ({selectedOffer.durationDays}j)</span>
                    </div>
                  </div>
                </div>

                {/* Gawa Balance Box */}
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Coins className="w-4 h-4 text-[#D4AF37]" />
                      Solde Gawa disponible
                    </span>
                    <span className="font-extrabold text-white font-mono">
                      {gawaBalance.toLocaleString("fr-FR")} G
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-zinc-300">
                    <span>Coût de la campagne</span>
                    <span className="font-extrabold text-red-400 font-mono">
                      -{selectedOffer.priceGawa.toLocaleString("fr-FR")} G
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                    <span className="font-bold text-zinc-200">Solde Gawa après paiement</span>
                    <span className={`font-black text-sm font-mono ${balanceAfterPayment >= 0 ? "text-emerald-400" : "text-red-500"}`}>
                      {balanceAfterPayment.toLocaleString("fr-FR")} G
                    </span>
                  </div>
                </div>

                {/* Insufficient Funds warning inline if needed */}
                {balanceAfterPayment < 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <span className="text-xs text-amber-200 font-semibold">
                        Gawa insuffisant pour régler cette campagne.
                      </span>
                    </div>
                    <button 
                      onClick={onOpenWalletDeposit}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs whitespace-nowrap"
                    >
                      Acheter Gawa
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
                      <span>DEBIT SECURISÉ DU COMPTE...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 LANCER LA CAMPAGNE</span>
                      <span className="bg-black/20 text-black px-2 py-0.5 rounded-lg text-[11px] font-mono">
                        {selectedOffer.priceGawa} G
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
        title="Solde Gawa Insuffisant"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Coins className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-extrabold text-white">Acquérir du Gawa</h4>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Votre solde Gawa actuel est de <strong className="text-white">{gawaBalance.toLocaleString("fr-FR")} G</strong>. Il vous manque <strong className="text-amber-400">{Math.abs(balanceAfterPayment).toLocaleString("fr-FR")} G</strong> pour lancer cette campagne Gombo Ads.
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
              <span>ACHETER DU GAWA</span>
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

