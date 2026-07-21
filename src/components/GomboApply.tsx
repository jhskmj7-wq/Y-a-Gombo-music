import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, Send, AlignLeft, Video, X, Music, Phone, Briefcase, Calendar } from "lucide-react";
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
  const [whatsapp, setWhatsapp] = useState(currentUserProfile.phone || "");
  const [specialty, setSpecialty] = useState(currentUserProfile.specialty || "");
  const [disponibilite, setDisponibilite] = useState("Disponible pour les dates prévues");
  const [audioUrl, setAudioUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMSG("");
    setLoading(true);

    if (!message.trim()) {
      setErrorMSG("Veuillez rédiger un court message de motivation (Pitch) !");
      setLoading(false);
      return;
    }

    if (!whatsapp.trim()) {
      setErrorMSG("Veuillez renseigner votre numéro WhatsApp de contact direct !");
      setLoading(false);
      return;
    }

    if (!specialty.trim()) {
      setErrorMSG("Veuillez préciser votre spécialité ou instrument !");
      setLoading(false);
      return;
    }

    if (!disponibilite.trim()) {
      setErrorMSG("Veuillez renseigner vos disponibilités pour ce gombo !");
      setLoading(false);
      return;
    }

    try {
      // Apply real-time gombo application through database layer
      const applicantName = `${currentUserProfile.firstName} ${currentUserProfile.lastName}`;
      const app = await gomboDB.applyToGombo({
        gomboId: gombo.id,
        gomboTitle: gombo.title,
        musicianId: currentUserProfile.uid,
        userId: currentUserProfile.uid,
        musicianName: applicantName,
        musicianSpecialty: specialty.trim(),
        musicianPhone: whatsapp.trim(),
        musicianAvatar: currentUserProfile.avatarUrl,
        message: message.trim(),
        mediaUrl: videoUrl.trim() || audioUrl.trim() || "",
        
        applicantId: currentUserProfile.uid,
        applicantName: applicantName,
        applicantPhoto: currentUserProfile.avatarUrl,
        whatsapp: whatsapp.trim(),
        specialty: specialty.trim(),
        disponibilite: disponibilite.trim(),
        availability: disponibilite.trim(),
        audioUrl: audioUrl.trim(),
        videoUrl: videoUrl.trim()
      });

      // Send a high-fidelity real-time notification to the gombo creator client
      if (gombo.clientId) {
        await gomboDB.sendNotification({
          userId: gombo.clientId,
          type: "general",
          title: "Nouvelle candidature ! 🔥",
          message: `${applicantName} a postulé à votre gombo "${gombo.title}" ! Visitez votre dashboard pour étudier sa démo.`
        });
      }

      onSuccess();
    } catch (err: any) {
      console.error("Candidature Submission Error:", err);
      setErrorMSG("Échec de la soumission de votre candidature. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-afri-bg/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-afri-bg-sec w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8"
      >
        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-afri-text-sec hover:text-gray-600 dark:hover:text-afri-text rounded-full bg-gray-50 dark:bg-gray-800/40 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 pr-8">
          <span className="text-[10px] font-bold tracking-wider text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 px-2.5 py-1 rounded-full uppercase">
            Candidature Gombo
          </span>
          <h3 className="mt-2 text-xl font-extrabold text-gray-950 dark:text-afri-text leading-tight">
            Postuler à : {gombo.title}
          </h3>
          <p className="text-xs text-afri-text-sec mt-1">
            Proposé par {gombo.clientName} (Cachet : {gombo.budget.toLocaleString()} FCFA)
          </p>
        </div>

        {errorMSG && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs font-semibold rounded-xl border-l-4 border-red-500">
            {errorMSG}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Motivation Message */}
          <div>
            <label className="block text-xs font-bold text-afri-text-sec dark:text-afri-text-sec mb-1.5 uppercase">Message de motivation (Pitch)</label>
            <div className="relative">
              <span className="absolute top-3 left-3 text-gray-450">
                <AlignLeft className="w-4 h-4" />
              </span>
              <textarea
                rows={3}
                required
                maxLength={1000}
                placeholder="Présentez-vous : pourquoi vous êtes chaud pour ce gombo, votre rigueur, votre matériel de scène..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white dark:focus:bg-afri-bg-sec dark:text-afri-text"
              />
            </div>
          </div>

          {/* WhatsApp Field */}
          <div>
            <label className="block text-xs font-bold text-afri-text-sec dark:text-afri-text-sec mb-1.5 uppercase">Numéro WhatsApp de contact</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-afri-text-sec">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Ex: 07 45 89 12 00"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white dark:focus:bg-afri-bg-sec dark:text-afri-text"
              />
            </div>
          </div>

          {/* Specialty Field */}
          <div>
            <label className="block text-xs font-bold text-afri-text-sec dark:text-afri-text-sec mb-1.5 uppercase">Votre Spécialité / Instrument pour ce plan</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-afri-text-sec">
                <Briefcase className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Ex: Guitariste Soliste, Chanteuse Lead, Pianiste, Batteur, Chœur..."
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white dark:focus:bg-afri-bg-sec dark:text-afri-text"
              />
            </div>
          </div>

          {/* Availability Field */}
          <div>
            <label className="block text-xs font-bold text-afri-text-sec dark:text-afri-text-sec mb-1.5 uppercase">Votre Disponibilité</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-afri-text-sec">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Ex: Libre toutes les dates, disponible aussi pour répétitions"
                value={disponibilite}
                onChange={(e) => setDisponibilite(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white dark:focus:bg-afri-bg-sec dark:text-afri-text"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Audio demo link */}
            <div>
              <label className="block text-xs font-bold text-afri-text-sec dark:text-afri-text-sec mb-1.5 uppercase">Lien Audio démo (Optionnel)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-450">
                  <Music className="w-3.5 h-3.5" />
                </span>
                <input
                  type="url"
                  placeholder="e.g. SoundCloud, Drive..."
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white dark:focus:bg-afri-bg-sec dark:text-afri-text"
                />
              </div>
            </div>

            {/* Video performance link */}
            <div>
              <label className="block text-xs font-bold text-afri-text-sec dark:text-afri-text-sec mb-1.5 uppercase">Lien Vidéo scène (Optionnel)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-450">
                  <Video className="w-3.5 h-3.5" />
                </span>
                <input
                  type="url"
                  placeholder="e.g. YouTube, TikTok, Drive..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white dark:focus:bg-afri-bg-sec dark:text-afri-text"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Profile Summary preview */}
          <div className="bg-purple-50/30 dark:bg-purple-950/10 p-3.5 rounded-2xl border border-purple-100/50 dark:border-purple-900/20 text-xs">
            <span className="font-bold text-purple-700 dark:text-purple-400 block uppercase mb-1">Coordonnées de l'artiste :</span>
            <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-300">
              <p>🎛️ Spécialité : <strong className="text-gray-900 dark:text-afri-text">{currentUserProfile.specialty || "Musicien"}</strong></p>
              <p>🏅 Expérience : <strong className="text-gray-900 dark:text-afri-text">{currentUserProfile.experienceYears ? `${currentUserProfile.experienceYears} ans` : (currentUserProfile.experience || "Pro")}</strong></p>
              <p>📍 Commune : <strong className="text-gray-900 dark:text-afri-text">{currentUserProfile.commune || "Abidjan"}</strong></p>
              <p>📅 Membre depuis : <strong className="text-gray-900 dark:text-afri-text">{currentUserProfile.createdAt ? new Date(currentUserProfile.createdAt).toLocaleDateString("fr-FR") : "Récemment"}</strong></p>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-gray-105 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all text-sm"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-afri-text font-bold rounded-xl shadow-md transition-all active:scale-98 flex items-center gap-1.5 text-sm"
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
