import React, { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Music, Calendar, Clock, MapPin, Search, Plus, User, 
  Flame, Sparkles, Filter, Check, X, Phone, Users, 
  ChevronDown, MessageCircle, AlertCircle, RefreshCw, Send, Trash2
} from "lucide-react";
import { gomboDB } from "../firebase";
import { Renfort, RenfortApplication, UserProfile } from "../types";

// Static Options
const REQUEST_TYPES = [
  "Répétition",
  "Remplacement urgent",
  "Chorale",
  "Église",
  "Orchestre",
  "Mariage",
  "Maquis",
  "Concert",
  "Événement privé",
  "Autre"
];

const COMMUNES_ABIDJAN = [
  "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", 
  "Marcory", "Plateau", "Port-Bouët", "Treichville", 
  "Yopougon", "Bingerville", "Songon", "Anyama"
];

const AUTRES_VILLES_CI = [
  "Bouaké", "Yamoussoukro", "Daloa", "San Pedro", 
  "Korhogo", "Man", "Abengourou", "Gagnoa", "Bondoukou", 
  "Odienné", "Divo", "Aboisso", "Soubré", "Ferkessédougou"
];

const SPECIALTIES_LIST = [
  "Chant", "Chœur", "Piano", "Clavier", "Guitare Solo", 
  "Guitare Rythmique", "Guitare Basse", "Batterie", "Percussions", 
  "Djembé", "Balafon", "Saxophone", "Trompette", "Violon", "Flûte", 
  "Accordéon", "DJ", "Beatmaker", "Producteur Musical", "Arrangeur", 
  "Compositeur", "Auteur", "Sound Engineer", "Choriste", "Chef d'Orch"
];

const GENRES_LIST = [
  "Coupé-Décalé", "Zouglou", "Wôyô", "Afrobeat", "Amapiano", 
  "Gospel", "Reggae", "Dancehall", "Rap Ivoire", "Drill", "RnB", 
  "Soul", "Jazz", "Blues", "Rock", "Variété", "Traditionnel", 
  "Mandingue", "Baoulé", "Bété", "Sénoufo", "Ébrié"
];

interface RenfortExpressProps {
  currentUserProfile: UserProfile | null;
  onShowAuth: () => void;
}

export default function RenfortExpress({ currentUserProfile, onShowAuth }: RenfortExpressProps) {
  // DB States
  const [renforts, setRenforts] = useState<Renfort[]>([]);
  const [applications, setApplications] = useState<RenfortApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestType, setRequestType] = useState("Répétition");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [musiciansCount, setMusiciansCount] = useState(1);
  const [budget, setBudget] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Cocody");
  const [customLocation, setCustomLocation] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [customGenre, setCustomGenre] = useState("");

  // Filter states
  const [searchFilter, setSearchFilter] = useState("");
  const [filterType, setFilterType] = useState("Tous");
  const [filterLocation, setFilterLocation] = useState("Tous");
  const [filterSpecialty, setFilterSpecialty] = useState("Tous");
  const [filterGenre, setFilterGenre] = useState("Tous");
  const [filterAvail, setFilterAvail] = useState("Tous"); // "Tous" | "Disponible uniquement"

  // UI States
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [viewApplicantsPostId, setViewApplicantsPostId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load and Listen to DB real-time
  useEffect(() => {
    setLoading(true);
    const unsubRenforts = gomboDB.listenAllRenforts((list) => {
      setRenforts(list);
      setLoading(false);
    });

    const unsubApps = gomboDB.listenRenfortApplications((list) => {
      setApplications(list);
    });

    return () => {
      unsubRenforts();
      unsubApps();
    };
  }, []);

  // Set default WhatsApp if user profile offers it
  useEffect(() => {
    if (currentUserProfile?.whatsapp) {
      setWhatsapp(currentUserProfile?.whatsapp);
    } else if (currentUserProfile?.phone) {
      setWhatsapp(currentUserProfile?.phone);
    }
  }, [currentUserProfile]);

  const triggerToast = (type: "success" | "error", text: string) => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Submit Form
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      onShowAuth();
      return;
    }

    if (!title || !description || !date || !time || !whatsapp) {
      triggerToast("error", "Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    // Process Location
    let finalLocation = selectedLocation;
    if (selectedLocation === "Autre" && customLocation) {
      finalLocation = customLocation;
    }

    // Process Instruments / Specialties
    let finalSpecialties = [...selectedSpecialties];
    if (customSpecialty) {
      finalSpecialties.push(customSpecialty);
    }
    if (finalSpecialties.length === 0) {
      triggerToast("error", "Veuillez sélectionner au moins un instrument recherché.");
      return;
    }

    // Process Genres
    let finalGenres = [...selectedGenres];
    if (customGenre) {
      finalGenres.push(customGenre);
    }

    try {
      await gomboDB.publishRenfort({
        userId: currentUserProfile.uid,
        userName: `${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || ""}`.trim() || currentUserProfile.artistName || "Artiste",
        userAvatar: currentUserProfile.avatarUrl || currentUserProfile.photoURL || "",
        title,
        description,
        instrument: finalSpecialties[0], // Compat primary
        instruments: finalSpecialties,
        date,
        time,
        musiciansCount,
        budget: Number(budget) || 0,
        commune: finalLocation,
        whatsapp,
        requestType,
        genres: finalGenres
      });

      // Clear Form & Close
      setTitle("");
      setDescription("");
      setSelectedSpecialties([]);
      setCustomSpecialty("");
      setDate("");
      setTime("");
      setMusiciansCount(1);
      setBudget("");
      setCustomLocation("");
      setSelectedGenres([]);
      setCustomGenre("");
      setShowForm(false);

      triggerToast("success", "Votre demande Renfort Express a été publiée avec succès ! 🎼");
    } catch (err: any) {
      triggerToast("error", "Erreur lors de la publication : " + err.message);
    }
  };

  // Quick Apply: "🔥 Disponible"
  const handleQuickApply = async (renfort: Renfort) => {
    if (!currentUserProfile) {
      onShowAuth();
      return;
    }

    // Prevent creator from applying
    if (renfort.userId === currentUserProfile.uid) {
      triggerToast("error", "Vous ne pouvez pas postuler à votre propre demande d'aide.");
      return;
    }

    // Check if already applied
    const alreadyApplied = applications.some(
      app => app.renfortId === renfort.id && app.musicianId === currentUserProfile.uid
    );

    if (alreadyApplied) {
      triggerToast("error", "Vous avez déjà postulé à ce renfort !");
      return;
    }

    try {
      await gomboDB.applyToRenfort({
        renfortId: renfort.id,
        renfortTitle: renfort.title,
        musicianId: currentUserProfile.uid,
        musicianName: `${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || ""}`.trim() || currentUserProfile.artistName || "Musicien",
        musicianPhone: currentUserProfile.whatsapp || currentUserProfile.phone || "",
        musicianAvatar: currentUserProfile.avatarUrl || currentUserProfile.photoURL || "",
        musicianSpecialties: currentUserProfile.specialties || (currentUserProfile.specialty ? [currentUserProfile.specialty] : [])
      });

      // Add dynamic real-time local / database notification to the poster
      await gomboDB.sendNotification({
        userId: renfort.userId,
        title: "🔥 Nouveau Renfort Express !",
        message: `${currentUserProfile.artistName || currentUserProfile.firstName || "Un musicien"} s’est déclaré Disponible pour : "${renfort.title}".`,
        type: "general"
      });

      triggerToast("success", "Disponibilité envoyée directement à l'organisateur ! 🔥");
    } catch (err: any) {
      triggerToast("error", "Erreur : " + err.message);
    }
  };

  // Handle Application State (Accept/Refuse)
  const handleUpdateAppStatus = async (app: RenfortApplication, newStatus: "accepte" | "refuse") => {
    try {
      await gomboDB.updateRenfortApplicationStatus(app.id, newStatus);
      
      // Notify candidate
      const notificationTitle = newStatus === "accepte" ? "🎉 Renfort Accepté !" : "📢 Renfort Express";
      const notificationMsgText = newStatus === "accepte" 
        ? `L'organisateur a accepté votre renfort pour : "${app.renfortTitle}". Contactez-le vite !`
        : `Votre candidature pour le renfort : "${app.renfortTitle}" n’a pas été retenue.`;

      await gomboDB.sendNotification({
        userId: app.musicianId,
        title: notificationTitle,
        message: notificationMsgText,
        type: newStatus === "accepte" ? "application_accepted" : "general"
      });

      triggerToast("success", `Statut mis à jour avec succès (${newStatus === "accepte" ? "Accepté" : "Refusé"}) !`);
    } catch (err: any) {
      triggerToast("error", "Erreur lors de la mise à jour : " + err.message);
    }
  };

  // Hand delete
  const handleDeleteRenfort = async (id: string) => {
    if (!window.confirm("Voulez-vous supprimer cette publication de renfort ?")) return;
    try {
      await gomboDB.deleteRenfort(id);
      triggerToast("success", "Publication supprimée !");
    } catch (err: any) {
      triggerToast("error", "Erreur : " + err.message);
    }
  };

  // Multiple Specialties toggle
  const toggleSpecialty = (spec: string) => {
    if (selectedSpecialties.includes(spec)) {
      setSelectedSpecialties(prev => prev.filter(s => s !== spec));
    } else {
      setSelectedSpecialties(prev => [...prev, spec]);
    }
  };

  // Multiple Genres toggle
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(prev => prev.filter(g => g !== genre));
    } else {
      setSelectedGenres(prev => [...prev, genre]);
    }
  };

  // Filter application algorithms
  const filteredRenforts = renforts.filter(renfort => {
    // 1. Text Search query
    const textStr = `${renfort.title} ${renfort.description} ${renfort.userName}`.toLowerCase();
    if (searchFilter && !textStr.includes(searchFilter.toLowerCase())) return false;

    // 2. Filter Request Type
    if (filterType !== "Tous" && renfort.requestType !== filterType) return false;

    // 3. Filter Location
    if (filterLocation !== "Tous" && renfort.commune !== filterLocation) return false;

    // 4. Filter Specialities / Instrument
    if (filterSpecialty !== "Tous") {
      const matchSpec = renfort.instruments?.some(s => s.toLowerCase() === filterSpecialty.toLowerCase()) 
        || renfort.instrument?.toLowerCase() === filterSpecialty.toLowerCase();
      if (!matchSpec) return false;
    }

    // 5. Filter Genre style-wise
    if (filterGenre !== "Tous") {
      const matchGenre = renfort.genres?.some(g => g.toLowerCase() === filterGenre.toLowerCase());
      if (!matchGenre) return false;
    }

    // 6. Availability filter (active unassigned only)
    if (filterAvail === "Disponible uniquement" && renfort.status === "termine") return false;

    return true;
  });

  return (
    <div className="space-y-8" id="renfort-express-container">
      {/* Toast notifications panel */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 p-4 rounded-xl shadow-2xl flex items-start gap-3 border ${
              notificationMsg.type === "success" 
                ? "bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" 
                : "bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900"
            }`}
          >
            {notificationMsg.type === "success" ? <Check className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold text-sm">
                {notificationMsg.type === "success" ? "Succès !" : "Attention !"}
              </p>
              <p className="text-xs mt-0.5">{notificationMsg.text}</p>
            </div>
            <button onClick={() => setNotificationMsg(null)} className="ml-auto text-afri-text-sec hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner Section */}
      <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-orange-600 text-afri-text rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="px-3.5 py-1 bg-white/20 text-afri-text text-[11px] font-black uppercase rounded-full tracking-wider border border-white/20">
            ⚡️ Solution de secours instantanée
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase" id="renfort-title-head">
            🎼 Renfort Express
          </h2>
          <p className="text-sm sm:text-base text-gray-100 leading-relaxed">
            Trouve rapidement un musicien disponible pour une répétition, un remplacement urgent ou un événement culturel en Côte d'Ivoire. Simple, rapide et direct !
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (!currentUserProfile) {
                  onShowAuth();
                } else {
                  setShowForm(!showForm);
                }
              }}
              className="px-6 py-3 bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text font-extrabold rounded-xl transition-all active:scale-97 flex items-center justify-center gap-2 text-xs shadow-lg shadow-orange-700/20"
            >
              <Plus className="w-4 h-5 stroke-[2.5px]" /> Demander de l'aide / un Renfort
            </button>
            <button 
              onClick={() => {
                setFilterType("Tous");
                setFilterLocation("Tous");
                setFilterSpecialty("Tous");
                setFilterGenre("Tous");
                setFilterAvail("Tous");
                setSearchFilter("");
              }}
              className="px-4 py-3 bg-white/10 hover:bg-white/25 border border-white/20 font-black rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Réinitialiser filtres
            </button>
          </div>
        </div>
      </div>

      {/* Form Overlay Section */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-afri-text uppercase flex items-center gap-2">
                  <Flame className="text-orange-500 w-5 h-5 fill-current" /> Publier une Demande de Renfort
                </h3>
                <p className="text-xs text-afri-text-sec mt-1">Fournissez les détails pour cibler instantanément les meilleurs musiciens libres.</p>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className="p-1 text-afri-text-sec hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Demand type Choice */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-600 dark:text-afri-text-sec">Type de demande *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {REQUEST_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRequestType(type)}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center ${
                          requestType === type 
                            ? "bg-afri-bg-sec text-afri-text border-transparent shadow" 
                            : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-750"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Titre */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-600 dark:text-afri-text-sec">Titre de la demande *</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Ex: Pianiste Gospel disponible ce dimanche matin"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black uppercase text-gray-600 dark:text-afri-text-sec">Description détaillée *</label>
                  <textarea
                    required
                    maxLength={1500}
                    rows={4}
                    placeholder="Précisez le répertoire à maîtriser, l'ambiance attendue, les heures de répétition, s'il y a des transports de prévus..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Multi-specialty Instrument wanted */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black uppercase text-gray-600 dark:text-afri-text-sec">
                    Instruments / Spécialités recherchées * (Multiselect)
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-900/50 max-h-44 overflow-y-auto">
                    {SPECIALTIES_LIST.map(spec => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialty(spec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          selectedSpecialties.includes(spec)
                            ? "bg-orange-500 text-afri-text border-transparent"
                            : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {selectedSpecialties.includes(spec) ? "✓ " : ""}{spec}
                      </button>
                    ))}
                  </div>

                  {/* Autre Speciality free entry */}
                  <div className="flex gap-2 items-center pt-1">
                    <span className="text-xs text-afri-text-sec font-semibold">Autre spécialité non listée :</span>
                    <input
                      type="text"
                      placeholder="Ex: Saxophone Ténor"
                      value={customSpecialty}
                      onChange={(e) => setCustomSpecialty(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-850 dark:text-afri-text"
                    />
                  </div>
                </div>

                {/* Genre Musical Style Checkbox */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black uppercase text-gray-600 dark:text-afri-text-sec">
                    Styles & Genres musicaux souhaités (Multiselect)
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-900/50 max-h-40 overflow-y-auto">
                    {GENRES_LIST.map(genre => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          selectedGenres.includes(genre)
                            ? "bg-purple-600 text-afri-text border-transparent"
                            : "bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {selectedGenres.includes(genre) ? "✓ " : ""}{genre}
                      </button>
                    ))}
                  </div>

                  {/* Autre Genre Style free entry */}
                  <div className="flex gap-2 items-center pt-1">
                    <span className="text-xs text-afri-text-sec font-semibold">Autre style musical :</span>
                    <input
                      type="text"
                      placeholder="Ex: Afro-Jazz"
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-850 dark:text-afri-text"
                    />
                  </div>
                </div>

                {/* Date constraint */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-600 dark:text-afri-text-sec">Date de l'événement *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Heure constraint */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-600 dark:text-afri-text-sec">Heure de début *</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Number of musicians wanted */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-600 dark:text-afri-text-sec">Nombre de musiciens recherchés *</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={musiciansCount}
                    onChange={(e) => setMusiciansCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Rémunération check */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-600 dark:text-afri-text-sec">Rémunération par musicien (FCFA, 0 si bénévole)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Ex: 25000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Location with other input options */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-600 dark:text-afri-text-sec">Commune / Ville *</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <optgroup label="Communes d'Abidjan">
                      {COMMUNES_ABIDJAN.map(com => (
                        <option key={com} value={com}>{com}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Autres Villes de Côte d'Ivoire">
                      {AUTRES_VILLES_CI.map(ville => (
                        <option key={ville} value={ville}>{ville}</option>
                      ))}
                    </optgroup>
                    <option value="Autre">Autre commune / autre ville...</option>
                  </select>

                  {selectedLocation === "Autre" && (
                    <motion.input
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      type="text"
                      required
                      placeholder="Saisissez la ville / commune"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-xs focus:ring-1 focus:ring-[#7C3AED]"
                    />
                  )}
                </div>

                {/* Contact Connection */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-600 dark:text-afri-text-sec">Numéro WhatsApp * (Requis)</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 0707070707"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text font-extrabold rounded-xl text-xs transition-all shadow shadow-purple-600/25 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Publier l'appel de Renfort
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTER CONTROLS GRID */}
      <div className="bg-white dark:bg-afri-bg-sec border border-gray-150 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-150 dark:border-gray-800 pb-3">
          <Filter className="w-4.5 h-4.5 text-[#7C3AED]" />
          <span className="text-xs font-black tracking-wider text-gray-700 dark:text-afri-text uppercase">Affiner la recherche</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Keyword search input */}
          <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-afri-text-sec">Mots-CLés / Artistes</label>
            <div className="relative">
              <Search className="w-4 h-4 text-afri-text-sec absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-xs border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
          </div>

          {/* Request Category Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-afri-text-sec">Catégorie</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-xs border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              <option value="Tous">Tous</option>
              {REQUEST_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Location selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-afri-text-sec">Localité</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-xs border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              <option value="Tous">Toutes Villes / Communes</option>
              <optgroup label="Abidjan">
                {COMMUNES_ABIDJAN.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
              <optgroup label="Autres villes">
                {AUTRES_VILLES_CI.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Specialty Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-afri-text-sec">Instrument</label>
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-xs border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              <option value="Tous">Tous instruments</option>
              {SPECIALTIES_LIST.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Genre selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-afri-text-sec">Style musical</label>
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 dark:text-afri-text text-xs border border-gray-200 dark:border-gray-700 rounded-xl"
            >
              <option value="Tous">Tous les styles</option>
              {GENRES_LIST.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Quick availability switcher list */}
        <div className="flex gap-2 items-center text-xs pt-1 border-t border-gray-100 dark:border-gray-850">
          <span className="text-afri-text-sec font-bold">Disponibilité :</span>
          <button
            onClick={() => setFilterAvail(filterAvail === "Disponible uniquement" ? "Tous" : "Disponible uniquement")}
            className={`px-3 py-1 bg-gray-50 dark:bg-gray-800 font-extrabold rounded-full transition-all border ${
              filterAvail === "Disponible uniquement" 
                ? "bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400" 
                : "text-afri-text-sec border-gray-200 dark:border-gray-700"
            }`}
          >
            🔥 Actifs non pourvus uniquement
          </button>
        </div>
      </div>

      {/* RENDER LIST OF POSTINGS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" id="renfort-loading-bar">
          <RefreshCw className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-sm text-afri-text-sec font-bold animate-pulse">Chargement des opportunités de renfort...</p>
        </div>
      ) : filteredRenforts.length === 0 ? (
        <div className="bg-white dark:bg-afri-bg-sec border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center" id="renfort-empty-list">
          <AlertCircle className="w-12 h-12 text-gray-350 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="font-extrabold text-[#7C3AED] uppercase text-sm tracking-wide">Aucun appel de renfort trouvé</h4>
          <p className="text-xs text-afri-text-sec mt-2 max-w-sm mx-auto">
            Utilisez d'autres critères de recherche ou soyez le premier à publier une demande si vous cherchez de l'assistance !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="renfort-items-grid">
          {filteredRenforts.map(renfort => {
            const isCreator = currentUserProfile?.uid === renfort.userId;
            const hasApplied = applications.some(
              app => app.renfortId === renfort.id && app.musicianId === currentUserProfile?.uid
            );
            const myApplication = applications.find(
              app => app.renfortId === renfort.id && app.musicianId === currentUserProfile?.uid
            );

            // Filter applicants list of this specific post
            const postApplicants = applications.filter(app => app.renfortId === renfort.id);

            // Format Remuneration amount Nice Display
            const remunerationDisplay = renfort.budget > 0 
              ? `${renfort.budget.toLocaleString("fr-FR")} FCFA` 
              : "Prestation Bénévole";

            // Nice badges Colors based on requestType
            let typeBadgeStyle = "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900";
            if (renfort.requestType === "Remplacement urgent") {
              typeBadgeStyle = "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900 animate-pulse";
            } else if (renfort.requestType === "Église" || renfort.requestType === "Chorale") {
              typeBadgeStyle = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";
            } else if (renfort.requestType === "Mariage" || renfort.requestType === "Événement privé") {
              typeBadgeStyle = "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900";
            } else if (renfort.requestType === "Maquis" || renfort.requestType === "Concert") {
              typeBadgeStyle = "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900";
            }

            return (
              <motion.div
                key={renfort.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-afri-bg-sec border rounded-3xl p-6 transition-all shadow-xs space-y-4 hover:shadow-md ${
                  hasApplied 
                    ? "border-purple-300 dark:border-purple-800"
                    : "border-gray-150 dark:border-gray-800"
                }`}
              >
                {/* Creator header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {renfort.userAvatar ? (
                      <img 
                        src={renfort.userAvatar} 
                        alt={renfort.userName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-850 flex items-center justify-center text-afri-text-sec">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-black text-gray-800 dark:text-afri-text uppercase leading-snug">{renfort.userName}</p>
                      <p className="text-[10px] text-afri-text-sec mt-0.5">demandé par l'artiste</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Event demand category badge */}
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${typeBadgeStyle}`}>
                      {renfort.requestType}
                    </span>
                    {isCreator && (
                      <button
                        onClick={() => handleDeleteRenfort(renfort.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-950/20 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                        title="Supprimer la demande"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Info titles */}
                <div className="space-y-1.5">
                  <h4 className="text-base font-extrabold text-gray-900 dark:text-afri-text leading-snug">
                    {renfort.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {expandedPostId === renfort.id 
                      ? renfort.description 
                      : `${renfort.description.substring(0, 180)}${renfort.description.length > 180 ? "..." : ""}`
                    }
                    {renfort.description.length > 180 && (
                      <button
                        onClick={() => setExpandedPostId(expandedPostId === renfort.id ? null : renfort.id)}
                        className="text-[11px] font-black uppercase text-[#7C3AED] ml-1.5 hover:underline"
                      >
                        {expandedPostId === renfort.id ? "Afficher moins" : "Lire la suite"}
                      </button>
                    )}
                  </p>
                </div>

                {/* Grid criteria info */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50/50 dark:bg-gray-900/40 p-3.5 rounded-2xl text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-850">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span>{renfort.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span>{renfort.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>{renfort.commune}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span>{renfort.musiciansCount} recherché{renfort.musiciansCount > 1 && "s"}</span>
                  </div>
                </div>

                {/* Instruments searched checklist array */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-afri-text-sec">Instrument(s) recherché(s) :</span>
                  <div className="flex flex-wrap gap-1">
                    {renfort.instruments?.map(spec => (
                      <span 
                        key={spec} 
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-[10px] font-bold"
                      >
                        🎹 {spec}
                      </span>
                    )) || (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-[10px] font-bold">
                        🎹 {renfort.instrument}
                      </span>
                    )}
                  </div>
                </div>

                {/* Show style tags if present */}
                {renfort.genres && renfort.genres.length > 0 && (
                  <div className="space-y-1 pt-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-afri-text-sec">Style musical :</span>
                    <div className="flex flex-wrap gap-1">
                      {renfort.genres.map(genre => (
                        <span 
                          key={genre} 
                          className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/20 text-[#7C3AED] dark:text-purple-300 rounded text-[9px] font-extrabold"
                        >
                          # {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remuneration bottom bar row */}
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-850 pt-3.5 mt-2">
                  <div>
                    <p className="text-[10px] font-black uppercase text-afri-text-sec leading-tight">Rémunération</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{remunerationDisplay}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCreator ? (
                      <button
                        onClick={() => setViewApplicantsPostId(viewApplicantsPostId === renfort.id ? null : renfort.id)}
                        className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-[#7C3AED] font-extrabold rounded-xl text-[11px] uppercase transition-all flex items-center gap-1.5 border border-purple-200 dark:border-purple-850"
                      >
                        Applicants
                        <span className="bg-purple-600 text-afri-text font-black text-[10px] rounded-full h-5 px-1.5 flex items-center justify-center">
                          {postApplicants.length}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${viewApplicantsPostId === renfort.id ? "rotate-180" : ""}`} />
                      </button>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        {hasApplied ? (
                          <div className="flex items-center gap-2">
                            {myApplication?.status === "accepte" ? (
                              <a
                                href={`https://wa.me/225${renfort.whatsapp}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-afri-text font-black rounded-xl text-[11px] uppercase transition-all flex items-center gap-1.5 shadow shadow-emerald-600/20"
                              >
                                <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp ({renfort.whatsapp})
                              </a>
                            ) : (
                              <span className="px-4 py-2.5 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-xl text-[11px] font-extrabold uppercase border border-purple-200 dark:border-purple-900 flex items-center gap-1">
                                <Check className="w-4 h-4 text-purple-600" /> Postulé
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleQuickApply(renfort)}
                            className="px-5 py-2.5 bg-afri-bg-sec hover:bg-afri-bg-sec text-afri-text font-black rounded-xl text-[11px] uppercase transition-all active:scale-97 flex items-center gap-1 shadow-md shadow-orange-700/15"
                          >
                            🔥 Disponible
                          </button>
                        )}
                        {/* Short candidacy state display text feedback */}
                        {myApplication && (
                          <span className={`text-[10px] font-black uppercase ${
                            myApplication.status === "en_attente" ? "text-amber-500" :
                            myApplication.status === "accepte" ? "text-emerald-500 font-extrabold animate-bounce" : "text-afri-text-sec"
                          }`}>
                            {myApplication.status === "en_attente" && "⏳ En attente de validation..."}
                            {myApplication.status === "accepte" && "🎉 Accepté ! Contactez l'artiste."}
                            {myApplication.status === "refuse" && "❌ Non retenu"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Creator Candidates slide drawer list */}
                <AnimatePresence>
                  {isCreator && viewApplicantsPostId === renfort.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-100 dark:border-gray-850 pt-4 mt-3 space-y-3 overflow-hidden"
                    >
                      <h5 className="text-[11px] font-black uppercase tracking-wider text-afri-text-sec">
                        Candidats déclarés disponibles ({postApplicants.length}) :
                      </h5>

                      {postApplicants.length === 0 ? (
                        <p className="text-xs text-afri-text-sec italic">Aucun artiste ne s'est encore déclaré disponible pour l'instant.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {postApplicants.map(app => (
                            <div 
                              key={app.id} 
                              className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/30 flex flex-col sm:flex-row gap-3 sm:items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5">
                                {app.musicianAvatar ? (
                                  <img 
                                    src={app.musicianAvatar} 
                                    alt={app.musicianName}
                                    className="w-9 h-9 rounded-full object-cover border border-gray-150"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-850 flex items-center justify-center text-afri-text-sec shrink-0">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-black text-gray-800 dark:text-afri-text uppercase">{app.musicianName}</p>
                                  {app.musicianSpecialties && app.musicianSpecialties.length > 0 ? (
                                    <p className="text-[9px] text-[#7C3AED] uppercase font-bold mt-0.5">
                                      🎸 {app.musicianSpecialties.join(" • ")}
                                    </p>
                                  ) : (
                                    <p className="text-[9px] text-afri-text-sec font-bold mt-0.5">Musicien de la Côte d'Ivoire</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {app.status === "en_attente" ? (
                                  <>
                                    <button
                                      onClick={() => handleUpdateAppStatus(app, "refuse")}
                                      className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 rounded-xl transition-colors text-[10px] font-bold"
                                      title="Refuser"
                                    >
                                      <X className="w-4 h-4 stroke-[2.5]" />
                                    </button>
                                    <button
                                      onClick={() => handleUpdateAppStatus(app, "accepte")}
                                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-afri-text font-extrabold rounded-xl text-[10px] uppercase transition-all shadow flex items-center gap-1"
                                      title="Accepter le renfort"
                                    >
                                      <Check className="w-4 h-4 stroke-[2.5]" /> Retenir
                                    </button>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-full tracking-wider ${
                                      app.status === "accepte" 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900 border" 
                                        : "bg-gray-100 text-afri-text-sec border-gray-200 dark:bg-gray-850 dark:text-afri-text-sec border"
                                    }`}>
                                      {app.status === "accepte" ? "Retenu ✓" : "Refusé"}
                                    </span>
                                    
                                    {app.status === "accepte" && app.musicianPhone && (
                                      <a
                                        href={`https://wa.me/225${app.musicianPhone}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 rounded-xl transition-colors"
                                        title="Contacter le candidat par WhatsApp"
                                      >
                                        <MessageCircle className="w-4 h-4 fill-emerald-600" />
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
