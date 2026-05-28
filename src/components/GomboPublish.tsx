import React, { useState } from "react";
import { motion } from "motion/react";
import { Calendar, Clock, DollarSign, MapPin, AlignLeft, Users, Zap, Check, Music } from "lucide-react";
import { gomboDB } from "../firebase";
import { UserProfile } from "../types";

const ABIDJAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", "Abobo", 
  "Koumassi", "Adjamé", "Port-Bouët", "Attécoubé", "Grand-Bassam", "Bingerville"
];

const EVENT_TYPES = [
  "Bar / Restaurant",
  "Café-Concert-Cabaret",
  "Mariage (Cérémonie & Soirée)",
  "Anniversaire",
  "Concert Public / Festival",
  "Corporate / Soirée de Gala",
  "Événement Privé / Baptême",
  "Studio Session / Enregistrement"
];

interface GomboPublishProps {
  currentUserProfile: UserProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GomboPublish({ currentUserProfile, onSuccess, onCancel }: GomboPublishProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [commune, setCommune] = useState("Cocody");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [budget, setBudget] = useState<number>(30000);
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [musiciansCount, setMusiciansCount] = useState<number>(1);
  const [urgent, setUrgent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");
    setLoading(true);

    if (!title || !description || !location || !date || !time || !budget) {
      setErrorMSG("Veuillez remplir tous les champs !");
      setLoading(false);
      return;
    }

    try {
      await gomboDB.publishGombo({
        clientId: currentUserProfile.uid,
        clientName: `${currentUserProfile.firstName} ${currentUserProfile.lastName}`,
        title,
        description,
        location,
        commune,
        date,
        time,
        budget: Number(budget),
        eventType,
        musiciansCount: Number(musiciansCount),
        urgent
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMSG("Impossible de publier la prestation. Vérifiez vos permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1e1e24] rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-xl"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-gray-950 dark:text-white flex items-center gap-2">
            <Music className="w-6 h-6 text-orange-500 fill-orange-500" />
            Publier un Gombo Musical
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Proposez un contrat d'animation ou de prestation musicale et recevez instantanément les candidatures de musiciens qualifiés d'Abidjan.
          </p>
        </div>

        {errorMSG && (
          <div className="mb-5 p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 font-medium text-sm rounded-xl border-l-4 border-red-500">
            {errorMSG}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Titre & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Titre du Gombo</label>
              <input
                type="text"
                required
                placeholder="e.g. Recherche Bassiste Rumba / Soukous"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Type d'Événement</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
              >
                {EVENT_TYPES.map((evt) => (
                  <option key={evt} value={evt}>{evt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Présentation détaillée du show</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-400">
                <AlignLeft className="w-4 h-4" />
              </span>
              <textarea
                rows={4}
                required
                placeholder="Décrivez précisément votre événement, le style, les morceaux à maîtriser, l'équipement présent sur place, le dress-code..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
              />
            </div>
          </div>

          {/* Lieu, Commune */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Adresse / Lieu exact</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Espace Las Palmas, Rue 12"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Commune</label>
              <select
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
              >
                {ABIDJAN_COMMUNES.map((com) => (
                  <option key={com} value={com}>{com}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Heure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Date du concert ou répétition</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Heure de début</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Clock className="w-4 h-4" />
                </span>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Budget & Artistes recherchés */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Cachet Proposé (FCFA)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-450 font-bold text-sm">
                  CFA
                </span>
                <input
                  type="number"
                  required
                  min={1000}
                  placeholder="30000"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                Idéalement pour un cachet équitable et attractif d'Abidjan Showbiz.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Nombre d'artistes recherchés</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <Users className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  required
                  min={1}
                  max={15}
                  value={musiciansCount}
                  onChange={(e) => setMusiciansCount(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Urgent Feature */}
          <div className="bg-orange-50/50 dark:bg-amber-950/20 p-4 border border-orange-100 dark:border-orange-950 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-orange-100 dark:bg-orange-950/80 rounded-xl text-orange-600 dark:text-orange-400">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-950 dark:text-white">Marquer comme Urgent !</p>
                <p className="text-xs text-gray-500">
                  Le gombo s'affichera en haut de liste avec une étoile de priorité pour recruter très vite.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-750 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500" />
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-98 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4.5 h-4.5" />
                  Publier l'annonce
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
