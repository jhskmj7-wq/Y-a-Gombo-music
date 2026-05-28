import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, Send, AlignLeft, Video, X } from "lucide-react";
import { gomboDB } from "../firebase";
import { Gombo, UserProfile } from "../types";

interface GomboApplyProps {
  gombo: Gombo;
  currentUserProfile: UserProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GomboApply({ gombo, currentUserProfile, onSuccess, onCancel }: GomboApplyProps) {
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");
    setLoading(true);

    if (!message) {
      setErrorMSG("Veuillez rédiger un court message d'introduction !");
      setLoading(false);
      return;
    }

    try {
      await gomboDB.applyToGombo({
        gomboId: gombo.id,
        gomboTitle: gombo.title,
        musicianId: currentUserProfile.uid,
        musicianName: `${currentUserProfile.firstName} ${currentUserProfile.lastName}`,
        musicianSpecialty: currentUserProfile.specialty || "Musicien polyvalent",
        musicianPhone: currentUserProfile.phone || "Non renseigné",
        musicianAvatar: currentUserProfile.avatarUrl,
        message,
        mediaUrl
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMSG("Échec de la soumission de votre candidature. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-[#1e1e24] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8"
      >
        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full bg-gray-50 dark:bg-gray-800/40 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 pr-8">
          <span className="text-[10px] font-bold tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400 px-2.5 py-1 rounded-full uppercase">
            Candidature rapide
          </span>
          <h3 className="mt-2 text-xl font-extrabold text-gray-950 dark:text-white leading-tight">
            Postuler à : {gombo.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Proposé par {gombo.clientName} (Cachet : {gombo.budget.toLocaleString()} FCFA)
          </p>
        </div>

        {errorMSG && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs font-semibold rounded-xl border-l-4 border-red-500">
            {errorMSG}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Pitch Message */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Votre message d'intérêt (Pitch)</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-450">
                <AlignLeft className="w-4 h-4" />
              </span>
              <textarea
                rows={4}
                required
                placeholder="Présentez-vous brièvement : vos morceaux phares, vos disponibilités, pourquoi vous êtes la personne idéale pour Y’A GOMBO MUSIC..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
              />
            </div>
          </div>

          {/* Media Link (Optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Lien Vidéo / Audio de scène (Optionnel)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Video className="w-4 h-4" />
              </span>
              <input
                type="url"
                placeholder="e.g. YouTube, SoundCloud ou Google Drive de vos démos"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#1e1e24] dark:text-white"
              />
            </div>
            <p className="mt-1 text-[10px] text-gray-400 leading-normal">
              Partagez une vidéo en live pour rassurer le client sur votre présence scénique et votre justesse musicale.
            </p>
          </div>

          {/* Dynamic Profile Summary preview */}
          <div className="bg-gray-55/40 dark:bg-gray-800/20 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs">
            <span className="font-bold text-gray-500 block uppercase mb-1">Résumé de vos coordonnées attachées :</span>
            <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-300">
              <p>🎛️ Spécialité : <strong className="text-gray-900 dark:text-white">{currentUserProfile.specialty || "Musicien"}</strong></p>
              <p>🏅 Expérience : <strong className="text-gray-900 dark:text-white">{currentUserProfile.experience || "Pro"}</strong></p>
              <p>📞 Téléphone : <strong className="text-gray-900 dark:text-white">{currentUserProfile.phone || "Non renseigné"}</strong></p>
              <p>📍 Commune : <strong className="text-gray-900 dark:text-white">{currentUserProfile.commune}</strong></p>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all text-sm"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-98 flex items-center gap-1.5 text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer ma candidature
                </>
              )}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
