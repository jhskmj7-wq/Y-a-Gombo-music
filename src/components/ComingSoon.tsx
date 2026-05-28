import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bell, Stars, Sparkles, Check, ChevronLeft } from "lucide-react";
import { gomboDB, gomboAuth } from "../firebase";

interface ComingSoonProps {
  featureId: "academie" | "groupe" | "marche" | "certification";
  onBack: () => void;
}

const FEATURE_INFOS = {
  academie: {
    title: "L'Académie Y’A GOMBO MUSIC",
    badge: "Formations & Masterclass",
    description: "Améliorez vos compétences de scène, apprenez la gestion des contrats artistiques, le solfège moderne et bénéficiez de conseils de légendes de la musique ivoirienne.",
    incentive: "Déjà plus de 150 artistes inscrits sur la liste d'attente d'Abidjan !",
    color: "from-orange-500 to-amber-600",
    bgPattern: "bg-grid-orange"
  },
  groupe: {
    title: "Le Coin des Groupes",
    badge: "Orchestration & Band Matching",
    description: "Créez votre orchestre, trouvez un batteur ou claviériste régulier pour vos répétitions, ou proposez les services complets de votre groupe d'animation woyo ou rumba.",
    incentive: "Idéal pour recruter un groupe complet pour les maquis chics et mariages.",
    color: "from-purple-500 to-indigo-600",
    bgPattern: "bg-grid-purple"
  },
  marche: {
    title: "Le Marché du Coin",
    badge: "Achat / Vente & Location de Matériel",
    description: "Louez une sono complète pour un concert d'urgence, ou achetez des guitares, synthétiseurs et micros d'occasion de qualité, négociés directement entre frères artistes.",
    incentive: "Paiements Wave ou Orange Money sécurisés à Abidjan.",
    color: "from-teal-500 to-emerald-600",
    bgPattern: "bg-grid-teal"
  },
  certification: {
    title: "Certification Musicien Pro",
    badge: "Badge de Vérification Gombo",
    description: "Obtenez le badge vert 'Certifié Gombo Pro'. Notre équipe d'experts showbiz auditionne vos vidéos de scène pour rassurer instantanément les clients fortunés du milieu.",
    incentive: "Les artistes certifiés reçoivent en moyenne 3 fois plus de propositions !",
    color: "from-blue-500 to-indigo-600",
    bgPattern: "bg-grid-blue"
  }
};

export default function ComingSoon({ featureId, onBack }: ComingSoonProps) {
  const currentFeature = FEATURE_INFOS[featureId];
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Listen to current auth state
    const unsubscribe = gomboAuth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleNotifyMe = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour vous inscrire sur la liste d'attente !");
      return;
    }

    setLoading(true);
    try {
      await gomboDB.registerWaitingFeature(user.uid, user.email, featureId);
      setIsSubscribed(true);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'enregistrement tiers.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Retour à l'accueil
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative bg-white dark:bg-[#1e1e24] rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800 p-8 text-center"
      >
        {/* Colorful top abstract blob */}
        <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${currentFeature.color}`} />

        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900">
          <Stars className="w-3.5 h-3.5" />
          {currentFeature.badge}
        </div>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {currentFeature.title}
        </h1>

        <div className="my-6 relative py-12 flex justify-center">
          <div className="absolute inset-0 opacity-10 flex justify-center items-center">
            <div className={`w-36 h-36 rounded-full blur-2xl bg-gradient-to-r ${currentFeature.color}`} />
          </div>

          {/* Animated Illustration */}
          <motion.div 
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative bg-gradient-to-tr from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-md"
          >
            <Sparkles className="w-12 h-12 text-orange-500" />
          </motion.div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base max-w-md mx-auto">
          {currentFeature.description}
        </p>

        <div className="mt-6 bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4 border border-dashed border-gray-200 dark:border-gray-700 max-w-md mx-auto">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            ⭐ {currentFeature.incentive}
          </p>
        </div>

        <div className="mt-8">
          {isSubscribed ? (
            <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-2xl text-emerald-800 dark:text-emerald-400">
              <div className="p-2 bg-emerald-500 text-white rounded-full mb-2">
                <Check className="w-5 h-5" />
              </div>
              <p className="font-bold">Vous êtes inscrit !</p>
              <p className="text-xs mt-1 text-center">Nous vous enverrons un SMS/Email dès l'activation de ce service.</p>
            </div>
          ) : (
            <button
              onClick={handleNotifyMe}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  Être averti du lancement
                </>
              )}
            </button>
          )}
          {!user && (
            <p className="mt-3 text-xs text-gray-400">
              Connectez-vous à votre compte pour activer les notifications de sortie.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
