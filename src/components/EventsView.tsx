import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  User, 
  Users, 
  Clock, 
  Plus, 
  Check, 
  X, 
  Tag, 
  AlertTriangle, 
  Flame, 
  Music, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Loader2 
} from "lucide-react";
import { db } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove 
} from "firebase/firestore";
import { useAuth } from "../AuthContext";

interface EventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  lieu: string;
  organisateur: string;
  participants: string[]; // List of user displayNames or emails
  status: "Confirmé" | "En attente" | "Urgent" | "Clôturé";
  category: "Répétition" | "Concert" | "Casting" | "Festival" | "Contrat" | "Alerte";
  description: string;
}

interface EventsViewProps {
  onBack: () => void;
  addToTerminal?: (msg: string) => void;
}

export default function EventsView({ onBack, addToTerminal }: EventsViewProps) {
  const { currentUser, profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 6, 15)); // Simulated July 15, 2026
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD format
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Add Event Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formTitle, setFormTitle] = useState<string>("");
  const [formCategory, setFormCategory] = useState<EventItem["category"]>("Concert");
  const [formDate, setFormDate] = useState<string>("2026-07-15");
  const [formTime, setFormTime] = useState<string>("20:00");
  const [formLieu, setFormLieu] = useState<string>("");
  const [formOrganisateur, setFormOrganisateur] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formStatus, setFormStatus] = useState<EventItem["status"]>("Confirmé");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Sync with Firestore
  useEffect(() => {
    const eventsRef = collection(db, "events");
    const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
      const list: EventItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as EventItem);
      });

      // Sort by date and time
      list.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });

      // If no events exist in DB, seed with initial mock data
      if (list.length === 0) {
        seedInitialEvents();
      } else {
        setEvents(list);
        setLoading(false);
      }
    }, (err) => {
      console.error("Error syncing events:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Seed default high-quality localized events for Abidjan / Ivory Coast in July 2026
  const seedInitialEvents = async () => {
    const initialEvents: Omit<EventItem, "id">[] = [
      {
        title: "FEMUA 2026 — Répétition Générale d'Ouverture",
        date: "2026-07-18",
        time: "14:00",
        lieu: "Stade d'Anoumabo, Marcory",
        organisateur: "A'Salfo / Gaou Productions",
        participants: ["Didier Drogba", "A'Salfo", "Magic System"],
        status: "Urgent",
        category: "Répétition",
        description: "Répétition générale des rythmes kpanlogo et kora pour la cérémonie d'ouverture. Tous les membres d'Alliance doivent assister."
      },
      {
        title: "Festival National des Cordes d'Or",
        date: "2026-07-22",
        time: "19:30",
        lieu: "Palais de la Culture, Treichville",
        organisateur: "Ministère de la Culture & BURIDA",
        participants: ["Sona Jobarteh", "Toumani Diabaté Jr."],
        status: "Confirmé",
        category: "Festival",
        description: "La plus grande célébration de kora, balafon et guitare acoustique traditionnelle d'Afrique de l'Ouest."
      },
      {
        title: "Casting Voix d'Or d'Abidjan 2026",
        date: "2026-07-25",
        time: "09:00",
        lieu: "Studio d'Enregistrement National, Cocody",
        organisateur: "Gombo Musik Records",
        participants: ["Meiway", "Josey"],
        status: "Confirmé",
        category: "Casting",
        description: "Auditions ouvertes pour la signature d'un contrat d'album de 3 ans. Venez avec deux compositions originales nouchi/français."
      },
      {
        title: "Concert Acoustique Privé de l'Alliance",
        date: "2026-07-15",
        time: "21:00",
        lieu: "Le Balafon Chic, Plateau",
        organisateur: "Club Élite AFRIGOMBO",
        participants: ["Alpha Blondy (Special Guest)"],
        status: "Confirmé",
        category: "Concert",
        description: "Soirée acoustique haut de gamme pour célébrer l'intégration de la bêta publique AFRIGOMBO."
      },
      {
        title: "Signature Contrat d'Alliance Souverain",
        date: "2026-07-29",
        time: "11:00",
        lieu: "Cabinet Juridique Gombo, Zone 4",
        organisateur: "Maître Bamba (Notaire d'Héritage)",
        participants: ["Conseil d'Administration AFRIGOMBO"],
        status: "Confirmé",
        category: "Contrat",
        description: "Validation des droits d'auteur, de propriété intellectuelle et de versement de cachets automatisés via Wallet."
      },
      {
        title: "Alerte Sécurité — Mise à jour des GOMBO IDs",
        date: "2026-07-16",
        time: "08:00",
        lieu: "Serveur Central Souverain",
        organisateur: "Support Technique Élite",
        participants: [],
        status: "Urgent",
        category: "Alerte",
        description: "Tous les artistes doivent vérifier et soumettre leur certificat national pour conserver la certification TrustScore verte."
      }
    ];

    try {
      const eventsRef = collection(db, "events");
      for (const evt of initialEvents) {
        await addDoc(eventsRef, evt);
      }
      if (addToTerminal) {
        addToTerminal("📅 [Calendrier] 6 événements de référence synchronisés avec succès dans Firestore !");
      }
    } catch (err) {
      console.error("Error seeding events:", err);
    }
  };

  // Date manipulation helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = (getFirstDayOfMonth(currentDate) + 6) % 7; // Adjust to Monday start

  const monthsList = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 15));
  };

  // Toggle interest/participation in an event
  const handleToggleParticipation = async (event: EventItem) => {
    if (!currentUser) {
      alert("Veuillez vous connecter pour participer à un événement !");
      return;
    }

    const userName = profile?.artisticName || profile?.fullName || currentUser.email || "Artiste Élite";
    const hasJoined = event.participants.includes(userName);
    const eventDocRef = doc(db, "events", event.id);

    try {
      if (hasJoined) {
        await updateDoc(eventDocRef, {
          participants: arrayRemove(userName)
        });
        if (addToTerminal) {
          addToTerminal(`📅 [Calendrier] Retrait de la participation à : ${event.title}`);
        }
      } else {
        await updateDoc(eventDocRef, {
          participants: arrayUnion(userName)
        });
        if (addToTerminal) {
          addToTerminal(`📅 [Calendrier] Participation confirmée pour : ${event.title}`);
        }
      }
    } catch (err) {
      console.error("Error updating participation:", err);
      alert("Une erreur est survenue lors de la synchronisation.");
    }
  };

  // Submit new event form to Firestore
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formLieu || !formOrganisateur) {
      alert("Veuillez remplir les champs obligatoires (Titre, Lieu, Organisateur) !");
      return;
    }

    setSubmitting(true);
    const newEvent: Omit<EventItem, "id"> = {
      title: formTitle,
      category: formCategory,
      date: formDate,
      time: formTime,
      lieu: formLieu,
      organisateur: formOrganisateur,
      description: formDescription || "Aucune description supplémentaire.",
      status: formStatus,
      participants: profile?.artisticName ? [profile.artisticName] : []
    };

    try {
      await addDoc(collection(db, "events"), newEvent);
      
      if (addToTerminal) {
        addToTerminal(`📅 [Calendrier] Nouvel événement créé : ${formTitle} (${formCategory})`);
      }

      // Reset form & close
      setFormTitle("");
      setFormLieu("");
      setFormOrganisateur("");
      setFormDescription("");
      setIsFormOpen(false);
      alert("Événement planifié et synchronisé sur Firestore en temps réel ! 🎉");
    } catch (err) {
      console.error("Error adding event:", err);
      alert("Erreur de synchronisation Firestore.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter events
  const filteredEvents = events.filter((evt) => {
    const matchesCategory = selectedCategory === "All" || evt.category === selectedCategory;
    const matchesDate = !selectedDate || evt.date === selectedDate;
    return matchesCategory && matchesDate;
  });

  // Get color themes for different categories
  const getCategoryStyles = (category: EventItem["category"]) => {
    switch (category) {
      case "Répétition":
        return {
          bg: "bg-blue-500/10 border-blue-500/30 text-blue-400",
          icon: Music,
          dotColor: "bg-blue-500"
        };
      case "Concert":
        return {
          bg: "bg-afri-bg-sec/10 border-[#D4AF37]/30 text-[#D4AF37]",
          icon: Sparkles,
          dotColor: "bg-afri-bg-sec"
        };
      case "Casting":
        return {
          bg: "bg-purple-500/10 border-purple-500/30 text-purple-400",
          icon: User,
          dotColor: "bg-purple-500"
        };
      case "Festival":
        return {
          bg: "bg-pink-500/10 border-pink-500/30 text-pink-400",
          icon: Flame,
          dotColor: "bg-pink-500"
        };
      case "Contrat":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          icon: Briefcase,
          dotColor: "bg-emerald-500"
        };
      case "Alerte":
        return {
          bg: "bg-red-500/10 border-red-500/30 text-red-400",
          icon: AlertTriangle,
          dotColor: "bg-red-500"
        };
      default:
        return {
          bg: "bg-zinc-500/10 border-zinc-500/30 text-afri-text-sec",
          icon: CalendarIcon,
          dotColor: "bg-zinc-500"
        };
    }
  };

  const getStatusBadgeStyles = (status: EventItem["status"]) => {
    switch (status) {
      case "Urgent":
        return "bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse";
      case "Confirmé":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "En attente":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Clôturé":
        return "bg-afri-bg-ter text-afri-text-sec border border-afri-border/55";
    }
  };

  return (
    <div className="flex flex-col space-y-6 w-full max-w-5xl mx-auto px-4 pb-24 text-left animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-afri-border pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-afri-bg border border-afri-border flex items-center justify-center text-afri-text-sec hover:text-afri-text hover:border-[#D4AF37] cursor-pointer transition-all shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-afri-text uppercase tracking-tight flex items-center gap-2">
              <span className="text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">📅</span>
              Événements Élite
            </h1>
            <p className="text-[10px] sm:text-xs font-mono text-afri-text-sec uppercase tracking-wider">
              Agenda & Calendrier Souverain d'Alliance
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-afri-bg-sec hover:bg-afri-bg-sec text-[#050505] font-black text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isFormOpen ? "Fermer Formulaire" : "Planifier un Gombo"}
        </button>
      </div>

      {/* PLANIFIER FORM DRAWER */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-afri-bg-sec border-2 border-[#D4AF37]/50 rounded-2xl shadow-[0_4px_30px_rgba(212,175,55,0.15)]"
          >
            <form onSubmit={handleCreateEvent} className="p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-2 border-b border-afri-border pb-2">
                <Sparkles className="w-4 h-4" /> PLANIFIER UN NOUVEL ÉVÉNEMENT
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase font-black">Titre de l'événement *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="ex: Concert live de fin d'année"
                    className="w-full bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-xs text-afri-text placeholder-zinc-600 outline-none transition-all"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase font-black">Catégorie</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as EventItem["category"])}
                    className="w-full bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-xs text-afri-text outline-none transition-all"
                  >
                    <option value="Concert">🎤 Concert</option>
                    <option value="Répétition">🎸 Répétition</option>
                    <option value="Casting">🎭 Casting</option>
                    <option value="Festival">🔥 Festival</option>
                    <option value="Contrat">💼 Date de Contrat</option>
                    <option value="Alerte">⚠️ Alerte Importante</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase font-black">Date de l'événement *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-xs text-afri-text outline-none transition-all"
                    required
                  />
                </div>

                {/* Time */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase font-black">Heure *</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-xs text-afri-text outline-none transition-all"
                    required
                  />
                </div>

                {/* Lieu */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase font-black">Lieu (Salle / Commune) *</label>
                  <input
                    type="text"
                    value={formLieu}
                    onChange={(e) => setFormLieu(e.target.value)}
                    placeholder="ex: Palais de la Culture, Treichville"
                    className="w-full bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-xs text-afri-text placeholder-zinc-600 outline-none transition-all"
                    required
                  />
                </div>

                {/* Organizer */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase font-black">Organisateur / Promoteur *</label>
                  <input
                    type="text"
                    value={formOrganisateur}
                    onChange={(e) => setFormOrganisateur(e.target.value)}
                    placeholder="ex: Gaou Productions"
                    className="w-full bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-xs text-afri-text placeholder-zinc-600 outline-none transition-all"
                    required
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase font-black">Statut initial</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as EventItem["status"])}
                    className="w-full bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-xs text-afri-text outline-none transition-all"
                  >
                    <option value="Confirmé">🟢 Confirmé</option>
                    <option value="En attente">🟡 En attente</option>
                    <option value="Urgent">🔴 Urgent</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-mono text-afri-text-sec uppercase font-black">Description détaillée</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Indiquez les détails importants, le matériel à apporter, le cachet indicatif..."
                    rows={3}
                    className="w-full bg-afri-bg border border-afri-border focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-xs text-afri-text placeholder-zinc-600 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-afri-border">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-afri-border text-afri-text-sec hover:text-afri-text hover:bg-afri-bg-sec transition-all text-xs font-bold uppercase"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-afri-bg-sec hover:bg-afri-bg-sec text-black text-xs font-black uppercase transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Publier l'événement
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOADING STATE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-afri-bg/40 rounded-3xl border border-afri-border text-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mb-3" />
          <p className="text-xs text-afri-text-sec font-mono uppercase">Synchronisation avec l'agenda Firestore Élite...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: MONTHLY CALENDAR GRID & FILTER CHIPS */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* MONTHLY CALENDAR CARD */}
            <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-afri-border pb-3">
                <h3 className="text-xs font-black text-afri-text uppercase tracking-wider font-mono">
                  {monthsList[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrevMonth}
                    className="w-7 h-7 bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleNextMonth}
                    className="w-7 h-7 bg-afri-bg hover:bg-afri-bg-sec border border-afri-border text-afri-text-sec hover:text-afri-text rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-black text-afri-text-sec uppercase">
                <span>Lu</span><span>Ma</span><span>Me</span><span>Je</span><span>Ve</span><span>Sa</span><span>Di</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Prefills for empty slots */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-9" />
                ))}

                {/* Days list */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNumber = idx + 1;
                  const monthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
                  const dateStr = `${currentDate.getFullYear()}-${monthStr}-${String(dayNumber).padStart(2, "0")}`;
                  
                  const isToday = dayNumber === 15 && currentDate.getMonth() === 6 && currentDate.getFullYear() === 2026;
                  const isSelected = selectedDate === dateStr;
                  
                  // Check if day has events
                  const dayEvents = events.filter((e) => e.date === dateStr);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <button
                      key={`day-${dayNumber}`}
                      onClick={() => {
                        setSelectedDate(isSelected ? null : dateStr);
                        try {
                          // Audio micro feedback on calendar select
                          const synth = (window as any).audioSynth;
                          if (synth) synth.playTamTam(false);
                        } catch(e){}
                      }}
                      className={`h-9 rounded-xl flex flex-col items-center justify-center relative cursor-pointer text-xs font-mono font-bold transition-all ${
                        isSelected 
                          ? "bg-afri-bg-sec text-black scale-105 font-black shadow-[0_0_12px_rgba(212,175,55,0.4)]" 
                          : isToday 
                            ? "bg-afri-bg-sec border border-[#D4AF37]/50 text-afri-text font-black"
                            : "hover:bg-afri-bg-sec text-afri-text"
                      }`}
                    >
                      <span>{dayNumber}</span>
                      
                      {/* Dots for events */}
                      {hasEvents && !isSelected && (
                        <span className="flex gap-0.5 absolute bottom-1 justify-center w-full">
                          {dayEvents.slice(0, 3).map((e, eIdx) => {
                            const colors = getCategoryStyles(e.category);
                            return (
                              <span 
                                key={eIdx} 
                                className={`w-1 h-1 rounded-full ${colors.dotColor}`} 
                              />
                            );
                          })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Clear Filter Prompt */}
              {selectedDate && (
                <div className="flex items-center justify-between bg-afri-bg p-2.5 rounded-xl border border-afri-border mt-2">
                  <span className="text-[10px] font-mono text-afri-text-sec">
                    Filtre actif : {selectedDate}
                  </span>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-[9px] font-mono text-[#D4AF37] uppercase font-black hover:underline cursor-pointer"
                  >
                    Effacer filtre [Tous]
                  </button>
                </div>
              )}
            </div>

            {/* CATEGORY CHIPS */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono text-afri-text-sec uppercase tracking-widest font-black">
                Filtrer par Catégorie
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {["All", "Répétition", "Concert", "Casting", "Festival", "Contrat", "Alerte"].map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        try {
                          const synth = (window as any).audioSynth;
                          if (synth) synth.playTamTam(false);
                        } catch(e){}
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                        isActive 
                          ? "bg-afri-bg-sec border-[#D4AF37] text-[#050505]" 
                          : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-afri-text hover:border-afri-border"
                      }`}
                    >
                      {cat === "All" ? "🔥 Tout" : cat}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT: REAL-TIME EVENTS LIST */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between border-b border-afri-border pb-2">
              <h3 className="text-xs font-black text-afri-text uppercase tracking-wider font-mono">
                Événements Trouvés ({filteredEvents.length})
              </h3>
              {selectedDate && (
                <span className="text-[10px] font-mono text-[#D4AF37]">
                  Jour sélectionné
                </span>
              )}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-afri-bg/40 rounded-3xl border border-dashed border-afri-border text-center min-h-[300px] space-y-3">
                <CalendarIcon className="w-10 h-10 text-afri-text-sec animate-pulse" />
                <div>
                  <h4 className="text-xs font-black text-afri-text uppercase">Aucun événement de ce type</h4>
                  <p className="text-[10px] text-afri-text-sec mt-1 max-w-xs mx-auto leading-relaxed">
                    Essayez de changer de catégorie, de sélectionner un autre jour dans le calendrier ou créez un nouvel événement !
                  </p>
                </div>
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="px-4 py-2 bg-afri-bg-sec hover:bg-afri-bg-sec border border-afri-border rounded-xl text-[10px] font-mono text-afri-text uppercase font-black cursor-pointer"
                  >
                    Afficher tous les jours
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1.5 scrollbar-none">
                {filteredEvents.map((evt) => {
                  const styles = getCategoryStyles(evt.category);
                  const CatIcon = styles.icon;
                  const isUserParticipating = currentUser && evt.participants.includes(
                    profile?.artisticName || profile?.fullName || currentUser.email || ""
                  );

                  return (
                    <motion.div
                      layout
                      key={evt.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/30 transition-all space-y-4 relative group"
                    >
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${styles.bg}`}>
                              {evt.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getStatusBadgeStyles(evt.status)}`}>
                              {evt.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-afri-text group-hover:text-[#D4AF37] transition-colors uppercase leading-snug">
                            {evt.title}
                          </h4>
                        </div>

                        <div className={`p-2.5 rounded-xl ${styles.bg} shrink-0`}>
                          <CatIcon className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] leading-relaxed text-afri-text-sec">
                        {evt.description}
                      </p>

                      {/* Meta information row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-afri-bg p-3 rounded-xl border border-afri-border text-[10px] font-mono text-afri-text-sec">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                          <span>
                            {new Date(evt.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} à <strong>{evt.time}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                          <span className="truncate">{evt.lieu}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                          <span className="truncate">Promoteur: <strong>{evt.organisateur}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                          <span className="truncate">Participants: <strong>{evt.participants?.length || 0} confirmés</strong></span>
                        </div>
                      </div>

                      {/* Participants list drawer on hover or always */}
                      {evt.participants && evt.participants.length > 0 && (
                        <div className="text-[9px] font-mono text-afri-text-sec border-t border-afri-border pt-3">
                          <span className="uppercase font-black text-afri-text-sec block mb-1">Confirmés :</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {evt.participants.map((part, pIdx) => (
                              <span key={pIdx} className="px-2 py-0.5 bg-afri-bg-sec border border-afri-border rounded text-afri-text">
                                @{part}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-afri-border/40">
                        <span className="text-[9px] text-afri-text-sec uppercase font-mono font-bold">
                          Statut de participation
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleParticipation(evt)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                            isUserParticipating 
                              ? "bg-emerald-500 text-[#050505] shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
                              : "bg-afri-bg border border-afri-border hover:border-[#D4AF37] text-afri-text hover:text-afri-text"
                          }`}
                        >
                          {isUserParticipating ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                          {isUserParticipating ? "Je participe ! 🟢" : "Rejoindre l'événement"}
                        </button>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
