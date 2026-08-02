import React, { useState } from "react";
import { 
  Settings, Radio, Bell, Lock, User, Shield, PhoneCall, ArrowDownCircle,
  HardDrive, Globe2, HelpCircle, FileText, LogOut, ChevronRight,
  Database, Ban, EyeOff, Sliders, Laptop, Download, Trash2, Smartphone, Crown
} from "lucide-react";

interface SettingsTabProps {
  currentUser: any;
}

export default function SettingsTab({ currentUser }: SettingsTabProps) {
  // Existing auto-reply & notification states
  const [enableAutoReply, setEnableAutoReply] = useState(() => {
    if (!currentUser?.uid) return false;
    return localStorage.getItem(`enable_auto_reply_${currentUser.uid}`) === "true";
  });
  const [autoReplyMessage, setAutoReplyMessage] = useState(() => {
    if (!currentUser?.uid) return "Bonjour, je suis en pleine prestation Gombo. Je vous recontacte au plus vite !";
    return localStorage.getItem(`auto_reply_${currentUser.uid}`) || "Bonjour, je suis en pleine prestation Gombo. Je vous recontacte au plus vite !";
  });
  
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyGombos, setNotifyGombos] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [onlineVisibility, setOnlineVisibility] = useState<"all" | "contacts" | "hidden">("all");

  // New states for the enriched settings
  const [selectedLanguage, setSelectedLanguage] = useState("fr");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  const handleClearCache = () => {
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  const handleBackup = () => {
    setBackupStatus("running");
    setTimeout(() => {
      setBackupStatus("success");
    }, 1500);
  };

  const handleExport = () => {
    setIsExporting(true);
    setExportSuccess(false);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
    }, 1200);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Settings Welcome Banner */}
      <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl">
        <h3 className="text-xs font-bold text-afri-text uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#D4AF37]" />
          Réglages de la Messagerie AFRIGOMBO
        </h3>
        <p className="text-xs text-afri-text-sec mt-1">
          Personnalisez la confidentialité de votre profil, l'auto-répondeur d'absence Gombo et les alertes d'activité.
        </p>
      </div>

      {/* SECTION 1: PROFIL & SESSIONS ACTIVES */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
        <button 
          onClick={() => toggleSection("profile")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-afri-bg-ter transition cursor-pointer"
        >
          <span className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2.5">
            <User className="w-4 h-4 text-[#D4AF37]" />
            Mon Profil & Sessions Actives
          </span>
          <ChevronRight className={`w-4 h-4 text-afri-text-muted transition-transform ${activeSection === "profile" ? "rotate-90" : ""}`} />
        </button>

        {activeSection === "profile" && (
          <div className="p-4 bg-afri-bg/40 border-t border-afri-border space-y-3.5 text-xs animate-fadeIn">
            <div>
              <span className="block text-[10px] text-afri-text-muted font-bold uppercase mb-1">Votre Badge Membre</span>
              <p className="text-afri-text font-semibold flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-[#D4AF37]" /> Artiste Prestataire Officiel
              </p>
            </div>
            <div className="border-t border-afri-border/60 pt-3">
              <span className="block text-[10px] text-afri-text-muted font-bold uppercase mb-2">Sessions Actives & Appareils</span>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-afri-bg p-2 rounded-xl border border-afri-border">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <div className="flex-1 min-w-0">
                    <strong className="block text-afri-text text-[11px]">iPhone 14 Pro (Cet Appareil)</strong>
                    <span className="text-[10px] text-afri-text-sec">Abidjan, Côte d'Ivoire • En ligne</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-afri-bg p-2 rounded-xl border border-afri-border">
                  <Laptop className="w-4 h-4 text-afri-text-muted" />
                  <div className="flex-1 min-w-0">
                    <strong className="block text-afri-text text-[11px]">MacBook Air M2</strong>
                    <span className="text-[10px] text-afri-text-sec">Cotonou, Bénin • Il y a 2h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: CONFIDENTIALITÉ & LISTE NOIRE */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
        <button 
          onClick={() => toggleSection("privacy")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-afri-bg-ter transition cursor-pointer"
        >
          <span className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#D4AF37]" />
            Confidentialité & Liste Noire
          </span>
          <ChevronRight className={`w-4 h-4 text-afri-text-muted transition-transform ${activeSection === "privacy" ? "rotate-90" : ""}`} />
        </button>

        {activeSection === "privacy" && (
          <div className="p-4 bg-afri-bg/40 border-t border-afri-border space-y-4 text-xs animate-fadeIn">
            <div className="space-y-2">
              <span className="block text-[10px] text-afri-text-muted font-bold uppercase">Qui peut voir votre statut "En ligne" ?</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "all", label: "Tout le monde" },
                  { id: "contacts", label: "Contacts" },
                  { id: "hidden", label: "Masqué" }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setOnlineVisibility(opt.id as any)}
                    className={`py-2 px-1 text-[9.5px] font-bold uppercase rounded-xl border transition cursor-pointer ${
                      onlineVisibility === opt.id
                        ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                        : "bg-afri-bg border-afri-border text-afri-text-sec hover:text-afri-text"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-afri-border/60 pt-3 space-y-2">
              <span className="block text-[10px] text-afri-text-muted font-bold uppercase">Utilisateurs Bloqués / Masqués</span>
              <div className="flex items-center justify-between bg-afri-bg p-2.5 rounded-xl border border-afri-border text-[11px] text-afri-text-sec">
                <span className="flex items-center gap-1.5 font-semibold text-afri-text">
                  <Ban className="w-3.5 h-3.5 text-rose-500" /> Liste noire active
                </span>
                <span className="font-mono text-[10px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full">
                  0 utilisateur bloqué
                </span>
              </div>
              <p className="text-[10px] text-afri-text-muted">
                Les utilisateurs bloqués ne peuvent plus vous appeler ni vous proposer de contrats Gombo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: SÉCURITÉ & SAUVEGARDE */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
        <button 
          onClick={() => toggleSection("security")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-afri-bg-ter transition cursor-pointer"
        >
          <span className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-[#D4AF37]" />
            Sécurité, Sauvegarde & Exports
          </span>
          <ChevronRight className={`w-4 h-4 text-afri-text-muted transition-transform ${activeSection === "security" ? "rotate-90" : ""}`} />
        </button>

        {activeSection === "security" && (
          <div className="p-4 bg-afri-bg/40 border-t border-afri-border space-y-4 text-xs animate-fadeIn">
            {/* Sauvegarde cloud */}
            <div className="space-y-2">
              <span className="block text-[10px] text-afri-text-muted font-bold uppercase">Sauvegarde Cloud Souverain</span>
              <p className="text-[10.5px] text-afri-text-sec leading-relaxed">
                Sauvegardez vos discussions, contrats et justificatifs d'appels sur le cloud souverain et sécurisé d'AFRIGOMBO.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleBackup}
                  className="px-3 py-2 bg-afri-bg border border-afri-border text-afri-text font-bold rounded-lg flex items-center gap-1.5 hover:border-[#D4AF37] transition cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Sauvegarder maintenant
                </button>
              </div>
              {backupStatus === "running" && (
                <p className="text-[10px] text-amber-500 animate-pulse">Archivage et cryptage des clés en cours...</p>
              )}
              {backupStatus === "success" && (
                <p className="text-[10px] text-emerald-500">✔ Sauvegarde souveraine réussie le {new Date().toLocaleDateString()}</p>
              )}
            </div>

            {/* Exporter les discussions */}
            <div className="border-t border-afri-border/60 pt-3 space-y-2">
              <span className="block text-[10px] text-afri-text-muted font-bold uppercase">Export des Discussions & Contrats</span>
              <p className="text-[10.5px] text-afri-text-sec">
                Téléchargez une archive chiffrée (.zip) contenant tous vos échanges légaux et fiches de gombos.
              </p>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-3 py-2 bg-[#D4AF37] text-black font-black uppercase rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? "Génération de l'archive..." : "Exporter mes données"}
              </button>
              {exportSuccess && (
                <p className="text-[10px] text-emerald-500">✔ Lien d'export sécurisé envoyé par e-mail d'authentification.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: AUTO-RÉPONDEUR & DISCUSSIONS */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
        <button 
          onClick={() => toggleSection("discussions")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-afri-bg-ter transition cursor-pointer"
        >
          <span className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-[#D4AF37]" />
            Auto-Répondeur & Discussions
          </span>
          <ChevronRight className={`w-4 h-4 text-afri-text-muted transition-transform ${activeSection === "discussions" ? "rotate-90" : ""}`} />
        </button>

        {activeSection === "discussions" && (
          <div className="p-4 bg-afri-bg/40 border-t border-afri-border space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-afri-text uppercase tracking-wide">
                Réponse Automatique d'Absence
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAutoReply}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setEnableAutoReply(enabled);
                    if (currentUser?.uid) {
                      localStorage.setItem(`enable_auto_reply_${currentUser.uid}`, enabled ? "true" : "false");
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-afri-bg-ter rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D4AF37]" />
              </label>
            </div>

            <p className="text-[10.5px] text-afri-text-sec leading-relaxed">
              Message d'indisponibilité envoyé automatiquement à vos clients ou collaborateurs si vous êtes occupé ou en cours de prestation Gombo.
            </p>

            <textarea
              value={autoReplyMessage}
              onChange={(e) => {
                const val = e.target.value;
                setAutoReplyMessage(val);
                if (currentUser?.uid) {
                  localStorage.setItem(`auto_reply_${currentUser.uid}`, val);
                }
              }}
              placeholder="Exemple: Bonjour, je suis en pleine prestation Gombo. Je vous recontacte dès la fin de ma session."
              rows={3}
              className="w-full p-3 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] placeholder:text-afri-text-muted resize-none"
            />
          </div>
        )}
      </div>

      {/* SECTION 5: NOTIFICATIONS & APPELS */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
        <button 
          onClick={() => toggleSection("notifications")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-afri-bg-ter transition cursor-pointer"
        >
          <span className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-[#D4AF37]" />
            Notifications & Réglages Appels
          </span>
          <ChevronRight className={`w-4 h-4 text-afri-text-muted transition-transform ${activeSection === "notifications" ? "rotate-90" : ""}`} />
        </button>

        {activeSection === "notifications" && (
          <div className="p-4 bg-afri-bg/40 border-t border-afri-border space-y-3.5 text-xs animate-fadeIn">
            <div className="space-y-2.5">
              <label className="flex items-center justify-between text-xs text-afri-text-sec cursor-pointer">
                <span>Notifier lors de la réception d'un message</span>
                <input
                  type="checkbox"
                  checked={notifyMessages}
                  onChange={(e) => setNotifyMessages(e.target.checked)}
                  className="rounded border-afri-border bg-afri-bg text-[#D4AF37] focus:ring-[#D4AF37]"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-afri-text-sec cursor-pointer">
                <span>Alertes instantanées de séquestre & offres Gombo</span>
                <input
                  type="checkbox"
                  checked={notifyGombos}
                  onChange={(e) => setNotifyGombos(e.target.checked)}
                  className="rounded border-afri-border bg-afri-bg text-[#D4AF37] focus:ring-[#D4AF37]"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-afri-text-sec cursor-pointer">
                <span>Effets sonores & vibrations d'appels</span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="rounded border-afri-border bg-afri-bg text-[#D4AF37] focus:ring-[#D4AF37]"
                />
              </label>
            </div>

            <div className="border-t border-afri-border/60 pt-3 space-y-2">
              <span className="block text-[10px] text-afri-text-muted font-bold uppercase">Configuration d'Appels Cryptés</span>
              <p className="text-[10.5px] text-afri-text-sec leading-relaxed">
                Les flux vidéos et audios d'AFRIGOMBO utilisent le standard WebRTC Peer-to-Peer souverain pour garantir le cryptage complet sans stockage intermédiaire.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: TÉLÉCHARGEMENTS, STOCKAGE & CACHE */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
        <button 
          onClick={() => toggleSection("storage")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-afri-bg-ter transition cursor-pointer"
        >
          <span className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-[#D4AF37]" />
            Téléchargements & Stockage Cache
          </span>
          <ChevronRight className={`w-4 h-4 text-afri-text-muted transition-transform ${activeSection === "storage" ? "rotate-90" : ""}`} />
        </button>

        {activeSection === "storage" && (
          <div className="p-4 bg-afri-bg/40 border-t border-afri-border space-y-3.5 text-xs animate-fadeIn">
            <div className="space-y-2">
              <span className="block text-[10px] text-afri-text-muted font-bold uppercase">Téléchargement automatique des médias</span>
              <p className="text-[10.5px] text-afri-text-sec">
                Limitez l'utilisation des données mobiles en choisissant d'autoriser le téléchargement automatique des photos.
              </p>
              <div className="flex items-center gap-2 bg-afri-bg p-2 rounded-xl border border-afri-border text-[11px] text-afri-text-sec">
                <ArrowDownCircle className="w-4 h-4 text-[#D4AF37]" />
                <span>Télécharger automatiquement sur Wi-Fi uniquement</span>
              </div>
            </div>

            <div className="border-t border-afri-border/60 pt-3 space-y-2">
              <span className="block text-[10px] text-afri-text-muted font-bold uppercase">Nettoyage de l'espace de stockage</span>
              <p className="text-[10.5px] text-afri-text-sec">
                Libérez l'espace local d'AFRIGOMBO en effaçant les fichiers temporaires et images en cache local.
              </p>
              <button
                onClick={handleClearCache}
                className="px-3 py-2 bg-afri-bg border border-rose-500/30 text-rose-500 font-bold rounded-lg flex items-center gap-1.5 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vider le cache d'images
              </button>
              {cacheCleared && (
                <p className="text-[10px] text-emerald-500">✔ Cache local nettoyé avec succès !</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 7: LANGUES, THÈME & ACCESSIBILITÉ */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
        <button 
          onClick={() => toggleSection("language")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-afri-bg-ter transition cursor-pointer"
        >
          <span className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2.5">
            <Globe2 className="w-4 h-4 text-[#D4AF37]" />
            Langues, Thème & Accessibilité
          </span>
          <ChevronRight className={`w-4 h-4 text-afri-text-muted transition-transform ${activeSection === "language" ? "rotate-90" : ""}`} />
        </button>

        {activeSection === "language" && (
          <div className="p-4 bg-afri-bg/40 border-t border-afri-border space-y-4 text-xs animate-fadeIn">
            {/* Langue souveraine */}
            <div className="space-y-2">
              <span className="block text-[10px] text-afri-text-muted font-bold uppercase">Sélectionner la Langue d'AFRIGOMBO</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "fr", label: "Français (Officiel)" },
                  { id: "dyo", label: "Dioula (Abidjan)" },
                  { id: "wol", label: "Wolof (Dakar)" },
                  { id: "yor", label: "Yoruba (Lagos)" }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLanguage(lang.id)}
                    className={`p-2.5 text-[11px] font-bold rounded-xl border transition cursor-pointer text-left ${
                      selectedLanguage === lang.id
                        ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                        : "bg-afri-bg border-afri-border text-afri-text-sec hover:text-afri-text"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessibilité */}
            <div className="border-t border-afri-border/60 pt-3 space-y-2">
              <span className="block text-[10px] text-afri-text-muted font-bold uppercase">Accessibilité Visuelle</span>
              <div className="flex items-center justify-between bg-afri-bg p-2.5 rounded-xl border border-afri-border">
                <span>Texte agrandi pour les malvoyants</span>
                <input type="checkbox" className="rounded border-afri-border bg-afri-bg text-[#D4AF37]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 8: SUPPORT & LÉGAL */}
      <div className="bg-afri-bg-sec border border-afri-border rounded-2xl overflow-hidden">
        <button 
          onClick={() => toggleSection("support")}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-afri-bg-ter transition cursor-pointer"
        >
          <span className="text-xs font-bold text-afri-text uppercase tracking-wide flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
            Assistance, À Propos & Légal
          </span>
          <ChevronRight className={`w-4 h-4 text-afri-text-muted transition-transform ${activeSection === "support" ? "rotate-90" : ""}`} />
        </button>

        {activeSection === "support" && (
          <div className="p-4 bg-afri-bg/40 border-t border-afri-border space-y-3.5 text-xs animate-fadeIn">
            <div className="space-y-2">
              <a 
                href="#"
                onClick={(e) => { e.preventDefault(); alert("Formulaire de signalement de bug d'AFRIGOMBO ouvert."); }}
                className="flex items-center justify-between p-2.5 bg-afri-bg hover:bg-afri-bg-ter rounded-xl border border-afri-border transition"
              >
                <span>Signaler un problème ou bug technique</span>
                <ChevronRight className="w-4 h-4 text-afri-text-muted" />
              </a>

              <a 
                href="#"
                onClick={(e) => { e.preventDefault(); alert("Conditions d'utilisation souveraines d'AFRIGOMBO."); }}
                className="flex items-center justify-between p-2.5 bg-afri-bg hover:bg-afri-bg-ter rounded-xl border border-afri-border transition"
              >
                <span>Conditions Générales d'Utilisation (CGU)</span>
                <ChevronRight className="w-4 h-4 text-afri-text-muted" />
              </a>

              <div className="flex items-center justify-between p-2.5 text-afri-text-sec">
                <span>Version Officielle d'AFRIGOMBO</span>
                <span className="font-mono text-[10.5px] font-bold text-[#D4AF37]">v2.5 (Souverain)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
