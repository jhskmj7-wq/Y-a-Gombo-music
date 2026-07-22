import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Shield, FileText, Trash2, ArrowLeft, Mail, Flame, Lock, CheckCircle, 
  Smartphone, AlertTriangle, MessageSquare, Info, Star, HelpCircle, 
  Send, Loader2, BookOpen, Heart, DollarSign, Globe, MapPin, Sparkles, Users, Award
} from "lucide-react";
import { gomboDB } from "../firebase";
import { UserProfile } from "../types";
import { supportConfig } from "../supportConfig";

import { CGUContent, PrivacyContent } from "./LegalContent";

interface PublicPageProps {
  onBack: () => void;
  darkMode?: boolean;
}

export function PrivacyPage({ onBack }: PublicPageProps) {
  return (
    <div className="min-h-screen bg-afri-bg text-afri-text py-10 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-4 border-b border-afri-border">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg-sec border border-afri-border rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Retour</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-[#D4AF37]">
            <Flame className="w-4.5 h-4.5 text-[#D4AF37] fill-current" />
            <span>AFRIGOMBO • CHARTE</span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-sm">
          <PrivacyContent />
        </div>

      </div>
    </div>
  );
}

export function TermsPage({ onBack }: PublicPageProps) {
  return (
    <div className="min-h-screen bg-afri-bg text-afri-text py-10 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-4 border-b border-afri-border">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg-sec border border-afri-border rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Retour</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-[#D4AF37]">
            <Flame className="w-4.5 h-4.5 text-[#D4AF37] fill-current" />
            <span>AFRIGOMBO • RÈGLEMENT</span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-sm">
          <CGUContent />
        </div>

      </div>
    </div>
  );
}

export function DeleteAccountPage({ onBack }: PublicPageProps) {
  return (
    <div className="min-h-screen bg-afri-bg text-afri-text py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-6 border-b border-afri-border">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg-sec border border-afri-border rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quitter</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-rose-500">
            <AlertTriangle className="w-4.5 h-4.5" />
            <span>SÉCURITÉ</span>
          </div>
        </div>

        {/* Title Block */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-rose-500/10 text-rose-500 rounded-2xl shadow-inner">
            <Trash2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-afri-text tracking-tight uppercase">
            Suppression du compte Y’A GOMBO MUSIC
          </h1>
          <p className="text-xs text-afri-text-sec max-w-sm mx-auto leading-relaxed">
            Vous souhaitez quitter la scène ? Voici la procédure simplifiée pour effacer définitivement vos informations.
          </p>
        </div>

        {/* Action card */}
        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="space-y-4">
            <span className="text-xs font-black text-[#D4AF37] uppercase tracking-widest block">Étapes de suppression</span>
            
            <div className="grid gap-4">
              
              {/* Etape 1 */}
              <div className="flex gap-4 p-4 bg-afri-bg-ter rounded-2xl border border-afri-border">
                <div className="w-8 h-8 rounded-full bg-afri-bg-sec/10 text-[#D4AF37] flex items-center justify-center font-black shrink-0 text-sm">
                  1
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-afri-text uppercase tracking-wider">Aller dans Mon Coin</h3>
                  <p className="text-xs text-afri-text-sec leading-relaxed">
                    Connectez-vous à votre compte et cliquez sur l'onglet <strong>Mes Plans / Mon Coin</strong> (votre profil personnel d'artiste) en bas à droite de l'écran mobile ou dans la barre latérale.
                  </p>
                </div>
              </div>

              {/* Etape 2 */}
              <div className="flex gap-4 p-4 bg-afri-bg-ter rounded-2xl border border-afri-border">
                <div className="w-8 h-8 rounded-full bg-afri-bg-sec/10 text-[#D4AF37] flex items-center justify-center font-black shrink-0 text-sm">
                  2
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-afri-text uppercase tracking-wider">Ouvrir Réglages</h3>
                  <p className="text-xs text-afri-text-sec leading-relaxed">
                    Cliquez sur le bouton <strong>Réglages</strong> (l'icône d'engrenage) à côté de vos statistiques de prestations artistiques pour afficher le sous-panneau de contrôle.
                  </p>
                </div>
              </div>

              {/* Etape 3 */}
              <div className="flex gap-4 p-4 bg-afri-bg-ter rounded-2xl border border-afri-border">
                <div className="w-8 h-8 rounded-full bg-afri-bg-sec/10 text-[#D4AF37] flex items-center justify-center font-black shrink-0 text-sm">
                  3
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-afri-text uppercase tracking-wider">Cliquer Supprimer mon compte</h3>
                  <p className="text-xs text-afri-text-sec leading-relaxed">
                    Sélectionnez l'onglet <strong>👨‍💻 Compte</strong>, puis à la section <strong>Zone de Danger ⚠️</strong>, cliquez sur le bouton rouge <strong>Supprimer mon compte</strong> et validez la confirmation.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Details */}
          <div className="pt-4 border-t border-afri-border space-y-4">
            <span className="text-xs font-black text-[#D4AF37] uppercase tracking-widest block">Quelles données sont supprimées ?</span>
            
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Dès la confirmation de votre suppression de compte, notre gestionnaire d'écosystème exécute les opérations de purge suivantes de manière automatique et irréversible :
            </p>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex flex-col gap-1.5">
                <Lock className="w-5 h-5 text-rose-500 shrink-0" />
                <h4 className="text-xs font-bold text-afri-text">Données Firebase</h4>
                <p className="text-[10px] text-afri-text-sec">Vos identifiants d'Authentification stockés chez Google Cloud sont purgés de la base de données de sécurité.</p>
              </div>

              <div className="p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex flex-col gap-1.5">
                <User className="w-5 h-5 text-rose-500 shrink-0" />
                <h4 className="text-xs font-bold text-afri-text">Votre Profil Pro</h4>
                <p className="text-[10px] text-afri-text-sec">Vos informations publiques d'artiste, vos genres musicaux, vos statuts de disponibilité et votre solde sont supprimés définitivement.</p>
              </div>

              <div className="p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex flex-col gap-1.5">
                <Smartphone className="w-5 h-5 text-rose-500 shrink-0" />
                <h4 className="text-xs font-bold text-afri-text">Vos Médias & Gombos</h4>
                <p className="text-[10px] text-afri-text-sec">Tous les fichiers audios, maquettes, vidéos, photos de profil et historiques de candidatures sont balayés à jamais de nos stockages.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export function AboutPage({ onBack }: PublicPageProps) {
  return (
    <div className="min-h-screen bg-afri-bg text-afri-text py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center justify-between pb-6 border-b border-afri-border">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg-sec border border-afri-border rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-[#D4AF37]">
            <Flame className="w-4.5 h-4.5 text-[#D4AF37] fill-current" />
            <span>AFRIGOMBO • Y’A GOMBO MUSIC</span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-afri-bg-sec/15 text-[#D4AF37] rounded-2xl animate-bounce">
            <Info className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-afri-text tracking-tight uppercase">
            À Propos de Nous
          </h1>
          <p className="text-xs text-afri-text-sec max-w-md mx-auto">
            La révolution numérique d'AFRIGOMBO : opportunités certifiées et cachets sécurisés du showbiz.
          </p>
        </div>

        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase border-b border-afri-border pb-2 flex items-center gap-2">
              <span className="text-[#D4AF37]">🇨🇮</span> Notre Mission
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              <strong>AFRIGOMBO</strong>, propulsé par la solution <strong>Y'A GOMBO MUSIC</strong>, a été conçu par et pour les artistes. Notre but ultime est de professionnaliser la recherche, la planification et le paiement certifié des contrats musicaux et gombos scéniques à Abidjan et partout en Afrique de l'Ouest.
            </p>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Fini les fausses promesses, les intermédiaires gourmands ou les cachets non payés après des heures de show live intense. Nous offrons une plateforme transparente de mise en relation directe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-afri-bg-sec/5 rounded-2xl border border-[#D4AF37]/10 space-y-2">
              <span className="text-lg">⚡</span>
              <h3 className="text-xs font-black uppercase text-afri-text">Confiance Mutuelle</h3>
              <p className="text-[11px] text-afri-text-sec leading-relaxed">Des profils de prestataires vérifiés, des avis sincères, et un annuaire transparent pour rassurer le showbiz.</p>
            </div>
            <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10 space-y-2">
              <span className="text-lg">💰</span>
              <h3 className="text-xs font-black uppercase text-afri-text">Paiement Garanti</h3>
              <p className="text-[11px] text-afri-text-sec leading-relaxed">Les fonds sont bloqués de manière sécurisée et débloqués instantanément dès que l'artiste monte sur scène.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-afri-border space-y-3">
            <h3 className="text-xs font-black uppercase text-[#D4AF37] tracking-wider">L'Équipe Fondatrice</h3>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Basée à Cocody, notre équipe rassemble des développeurs ivoiriens passionnés de musique et des promoteurs d'événements de confiance, résolus à digitaliser la culture ivoirienne de façon vertueuse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SupportPage({ onBack }: PublicPageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Gombos & Annuaire");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Sync current profile if logged in
    const stored = localStorage.getItem("gombo_current_user_profile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !subject.trim()) {
      alert("Veuillez remplir le sujet et votre message.");
      return;
    }

    setLoading(true);
    try {
      await gomboDB.publishSupportMessage({
        userId: profile?.uid || "visiteur_anonyme",
        email: profile?.email || "contacts@yagombo.com",
        subject,
        message,
        category
      });
      setSuccess(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi de votre requête de support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-afri-bg text-afri-text py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center justify-between pb-6 border-b border-afri-border">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg-sec border border-afri-border rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-[#D4AF37]">
            <Flame className="w-4.5 h-4.5 text-[#D4AF37] fill-current" />
            <span>SUPPORT EN DIRECT</span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-afri-bg-sec/10 text-[#D4AF37] rounded-2xl">
            <HelpCircle className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black text-afri-text tracking-tight uppercase">
            Centre d'Assistance 📞
          </h1>
          <p className="text-xs text-afri-text-sec max-w-md mx-auto">
            Des animateurs et conseillers disponibles 24h/7 pour régler vos soucis d'installation, paiement ou contrat d'artiste.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-afri-bg-sec border border-afri-border rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase text-afri-text tracking-wider">Canal de Support Officiel</h3>
            
            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-start gap-2 pt-1">
                <span className="text-emerald-550 font-bold shrink-0">🟢 Support :</span>
                <div>
                  <button 
                    onClick={() => supportConfig.openSupport("Centre d'Assistance")}
                    className="text-[#D4AF37] hover:underline block font-bold text-left cursor-pointer text-afri-gold"
                  >
                    Contacter le Support AFRIGOMBO
                  </button>
                  <span className="text-[10px] text-afri-text-muted font-medium">Support direct 24h/7</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-sm">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-4"
              >
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <h3 className="text-sm font-black uppercase text-afri-text">Message Envoyé !</h3>
                <p className="text-xs text-afri-text-sec max-w-xs mx-auto leading-relaxed">Votre requête de support a été enregistrée avec succès. Notre équipe à Cocody vous répondra dans un délai de 2 heures maximum.</p>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="px-4 py-2 bg-afri-bg-sec/10 text-[#D4AF37] text-xs font-bold rounded-xl"
                >
                  Envoyer un autre message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xs font-black uppercase text-afri-text mb-2 tracking-wider">Écrire au Support</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec mb-1.5 uppercase">Catégorie de Demande</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs font-bold text-afri-text"
                  >
                    <option value="Gombos & Annuaire">💼 Gombos & Annuaire</option>
                    <option value="Paiements & Wave / OM">💰 Paiements & Retrait Wave/OM</option>
                    <option value="Bug / Dysfonctionnement">🐛 Bug Technique</option>
                    <option value="Mon Compte / Certification">👤 Compte & Certification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec mb-1.5 uppercase">Sujet de la Demande</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Problème d'affichage de mon avatar"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs font-bold text-afri-text"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-afri-text-sec mb-1.5 uppercase">Description détaillée</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Saisissez votre problème ici..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs font-bold text-afri-text"
                  />
                  {profile && (
                    <span className="text-[10px] text-afri-text-muted mt-1 block">Votre email associé : {profile.email}</span>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#B48F17] hover:from-[#B48F17] hover:to-[#9A7A13] text-afri-text font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-afri-text" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-afri-text" />
                        <span>Envoyer le Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CachetsPage({ onBack }: PublicPageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("gombo_current_user_profile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  return (
    <div className="min-h-screen bg-afri-bg text-afri-text py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center justify-between pb-6 border-b border-afri-border">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-afri-text-sec hover:text-[#D4AF37] bg-afri-bg-sec border border-afri-border rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center gap-1.5 font-black uppercase text-xs tracking-widest text-[#D4AF37]">
            <Flame className="w-4.5 h-4.5 text-[#D4AF37] fill-current" />
            <span>TRANSPARENCE DES CACHETS</span>
          </div>
        </div>

        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-afri-bg-sec/10 text-[#D4AF37] rounded-2xl">
            <DollarSign className="w-8 h-8 animate-pulse text-emerald-550" />
          </div>
          <h1 className="text-3xl font-black text-afri-text tracking-tight uppercase">
            Gestion des Cachets 💰
          </h1>
          <p className="text-xs text-afri-text-sec max-w-sm mx-auto">
            Garantissez votre rémunération à 100%. Finies les pertes d'argent après les mariages ou les maquis.
          </p>
        </div>

        {/* Balance Showcase */}
        {profile && (
          <div className="p-6 bg-afri-bg-sec rounded-3xl border border-afri-border text-afri-text flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-afri-text-sec uppercase tracking-widest block">Votre solde de cachets actif</span>
              <span className="text-2xl font-black font-mono text-afri-gold">{(profile.balance || 0).toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="space-y-1.5 text-center sm:text-right">
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 bg-afri-bg-sec/25 text-afri-gold border border-afri-border rounded-full inline-block">Réseau d'épargne d'urgence</span>
              <p className="text-[10px] text-afri-text-muted">Retraits disponibles 24h/24 via Wave ou Orange Money.</p>
            </div>
          </div>
        )}

        <div className="bg-afri-bg-sec border border-afri-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-black text-afri-text uppercase flex items-center gap-2 border-b border-afri-border pb-2">
              <span className="text-[#D4AF37]">✓</span> Fonctionnement de l'Escrow de Y'A GOMBO MUSIC
            </h2>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Pour assurer l'honnêteté de toutes les parties, Y'A GOMBO MUSIC utilise un système exclusif de tiers-confiance de cachets :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4 bg-afri-bg-ter border border-afri-border rounded-2xl space-y-2">
                <span className="text-lg text-afri-gold font-bold">1</span>
                <h4 className="text-xs font-black uppercase text-afri-text">Le Client verse le cachet</h4>
                <p className="text-[11px] text-afri-text-sec leading-relaxed">Dès qu'un musicien est réservé pour un gombo, le client dépose la somme convenue sur la plateforme.</p>
              </div>

              <div className="p-4 bg-afri-bg-ter border border-afri-border rounded-2xl space-y-2">
                <span className="text-lg text-afri-gold font-bold">2</span>
                <h4 className="text-xs font-black uppercase text-afri-text">Fonds sécurisés</h4>
                <p className="text-[11px] text-afri-text-sec leading-relaxed">L'argent reste bloqué en lieu sûr. Le musicien joue en toute sérénité, sachant le cachet déjà disponible.</p>
              </div>

              <div className="p-4 bg-afri-bg-ter border border-afri-border rounded-2xl space-y-2">
                <span className="text-lg text-afri-gold font-bold">3</span>
                <h4 className="text-xs font-black uppercase text-afri-text">Déblocage instantané</h4>
                <p className="text-[11px] text-afri-text-sec leading-relaxed">Dès le concert terminé, le client valide, et les fonds sont versés directement au portefeuille de l'artiste.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-afri-border">
            <h3 className="text-xs font-black uppercase text-emerald-500 tracking-wider mb-2">Commissions de service : 0%</h3>
            <p className="text-xs text-afri-text-sec leading-relaxed">
              Y'A GOMBO MUSIC est un projet culturel d'Abidjan : nous ne prenons aucune commission sur les prestations artistiques directes en 2026. L'intégralité du cachet négocié va dans la poche des musiciens de scène.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const User = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

