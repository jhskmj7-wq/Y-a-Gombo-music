import React, { useState } from "react";
import { 
  Activity, ShieldCheck, MessageSquare, Crown, Award, Users, FileText, 
  CheckCircle2, XCircle, ShieldAlert, Smartphone, TrendingUp, RefreshCw, Trash2
} from "lucide-react";

interface ActivityTabProps {
  currentProfile: any;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: Date;
  group: "today" | "yesterday" | "week" | "older";
  icon: any;
  color: string;
  meta?: string;
}

export default function ActivityTab({ currentProfile }: ActivityTabProps) {
  // Rich set of activity logs reflecting realistic events of a professional AFRIGOMBO platform
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: "act-1",
      type: "payment_received",
      title: "Paiement Séquestre Libéré 💰",
      description: "La somme de 75 000 FCFA pour la prestation 'Prestation Guitare Live' a été transférée sur votre solde.",
      time: new Date(Date.now() - 3600000 * 1), // 1 hour ago
      group: "today",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
      meta: "+75 000 FCFA"
    },
    {
      id: "act-2",
      type: "gombo_accepted",
      title: "Candidature Gombo Acceptée ✔",
      description: "Le recruteur 'Awa Touré' a validé votre offre pour la soirée gala du 15 août.",
      time: new Date(Date.now() - 3600000 * 3), // 3 hours ago
      group: "today",
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      id: "act-3",
      type: "new_follower",
      title: "Nouveau Follower 👤",
      description: "L'artiste peintre 'Moussa Diabaté' a commencé à s'abonner à votre book AFRIGOMBO.",
      time: new Date(Date.now() - 3600000 * 8), // 8 hours ago
      group: "today",
      icon: Users,
      color: "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20"
    },
    {
      id: "act-4",
      type: "security_alert",
      title: "Connexion Détectée 💻",
      description: "Nouvelle connexion de votre compte à Abidjan, Côte d'Ivoire (Safari / macOS).",
      time: new Date(Date.now() - 3600000 * 18), // 18 hours ago
      group: "today",
      icon: Smartphone,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    },
    {
      id: "act-5",
      type: "new_message",
      title: "Nouveau message reçu 💬",
      description: "Message de 'Koffi Yao' : 'Bonjour, pourrions-nous caler le raccordement technique...'",
      time: new Date(Date.now() - 3600000 * 25), // Yesterday
      group: "yesterday",
      icon: MessageSquare,
      color: "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20"
    },
    {
      id: "act-6",
      type: "verified",
      title: "Compte Officiel Vérifié 🛡",
      description: "Votre identité a été approuvée avec succès. Badge de confiance et visibilité maximale activés.",
      time: new Date(Date.now() - 3600000 * 32), // Yesterday
      group: "yesterday",
      icon: ShieldCheck,
      color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
    },
    {
      id: "act-7",
      type: "badge_earned",
      title: "Médaille d'Excellence Gagnée 👑",
      description: "Félicitations ! Vous venez d'obtenir la médaille 'Gombo d'Or' pour 10 prestations sans aucun litige.",
      time: new Date(Date.now() - 3600000 * 100), // This week
      group: "week",
      icon: Award,
      color: "text-[#D4AF37] bg-[#D4AF37]/15 border-[#D4AF37]/40"
    },
    {
      id: "act-8",
      type: "gombo_refused",
      title: "Offre Gombo Non Retenue ❌",
      description: "Votre candidature pour l'animation 'Mariage Cocody' a été déclinée par l'organisateur.",
      time: new Date(Date.now() - 3600000 * 120), // This week
      group: "week",
      icon: XCircle,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20"
    },
    {
      id: "act-9",
      type: "payment_sent",
      title: "Paiement Envoyé (Retrait) 💸",
      description: "Le retrait de 150 000 FCFA vers votre numéro Orange Money a été traité et exécuté.",
      time: new Date(Date.now() - 3600000 * 180), // This week
      group: "week",
      icon: TrendingUp,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      meta: "-150 000 FCFA"
    },
    {
      id: "act-10",
      type: "report_treated",
      title: "Signalement Traité ⚖",
      description: "La modération a examiné votre rapport contre l'utilisateur suspect. Le compte a été sanctionné.",
      time: new Date(Date.now() - 3600000 * 300), // Older
      group: "older",
      icon: ShieldAlert,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    },
    {
      id: "act-11",
      type: "application_new",
      title: "Candidature Reçue 📑",
      description: "L'artiste chanteuse 'Aminata' a postulé à votre offre d'embauche Gombo 'Chœurs Studio'.",
      time: new Date(Date.now() - 3600000 * 400), // Older
      group: "older",
      icon: FileText,
      color: "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20"
    }
  ]);

  const handleDeleteActivity = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivities(activities.filter(a => a.id !== id));
  };

  const clearAllActivities = () => {
    if (window.confirm("Voulez-vous effacer tout l'historique d'activité d'AFRIGOMBO ?")) {
      setActivities([]);
    }
  };

  // Function to group activities elegantly
  const groupTitles = {
    today: "Aujourd'hui",
    yesterday: "Hier",
    week: "Cette semaine",
    older: "Plus anciens"
  };

  const grouped = {
    today: activities.filter(a => a.group === "today"),
    yesterday: activities.filter(a => a.group === "yesterday"),
    week: activities.filter(a => a.group === "week"),
    older: activities.filter(a => a.group === "older")
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Activity Statistics & Trust Score Dashboard */}
      <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-afri-text uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#D4AF37]" />
            Centre d'Activité & Télémétrie
          </h3>
          {activities.length > 0 && (
            <button
              onClick={clearAllActivities}
              className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Tout effacer
            </button>
          )}
        </div>
        <p className="text-xs text-afri-text-sec leading-relaxed">
          Suivez l'activité en temps réel de votre compte, de vos candidatures, de vos followers et de la sécurité d'AFRIGOMBO.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-afri-text-muted font-bold uppercase">Indice de Confiance</span>
          <span className="text-xl font-black text-emerald-500 mt-2">{currentProfile?.trustScore || 100}%</span>
          <span className="text-[9px] text-afri-text-sec mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Excellence certifiée
          </span>
        </div>
        <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-afri-text-muted font-bold uppercase">Statut Membre</span>
          <span className="text-xl font-black text-[#D4AF37] mt-2">
            {currentProfile?.isPremium || currentProfile?.premium ? "Élite 👑" : "Standard"}
          </span>
          <span className="text-[9px] text-afri-text-sec mt-1">Privilèges réseau</span>
        </div>
      </div>

      {/* Grouped Notifications feed */}
      {activities.length === 0 ? (
        <div className="p-12 bg-afri-bg-sec border border-afri-border rounded-2xl text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-afri-text-muted mx-auto opacity-50" />
          <div>
            <p className="text-xs font-bold text-afri-text">Aucun événement récent</p>
            <p className="text-[11px] text-afri-text-sec mt-1">
              Les notifications et alertes s'afficheront ici en temps réel.
            </p>
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([groupKey, list]) => {
          if (list.length === 0) return null;
          return (
            <div key={groupKey} className="space-y-2">
              <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider px-1">
                📅 {groupTitles[groupKey as keyof typeof groupTitles]} ({list.length})
              </h4>
              <div className="space-y-2">
                {list.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37]/40 rounded-xl flex items-start gap-3 transition group relative"
                  >
                    {/* Activity Icon */}
                    <span className={`p-2 rounded-xl border shrink-0 flex items-center justify-center ${act.color}`}>
                      <act.icon className="w-4 h-4" />
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between gap-1">
                        <strong className="text-xs font-bold text-afri-text block truncate group-hover:text-[#D4AF37] transition">
                          {act.title}
                        </strong>
                        {act.meta && (
                          <span className="text-[10px] font-mono font-black text-[#D4AF37]">
                            {act.meta}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-afri-text-sec mt-0.5 leading-relaxed">
                        {act.description}
                      </p>
                      <span className="text-[9px] text-afri-text-muted font-mono block mt-1.5">
                        {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Single dismiss button */}
                    <button
                      onClick={(e) => handleDeleteActivity(act.id, e)}
                      className="absolute top-3 right-3 p-1 rounded-lg hover:bg-afri-bg-ter text-afri-text-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Masquer cette notification"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Footer telemetry */}
      <div className="p-4 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-3">
        <h4 className="text-[11px] font-bold text-afri-text uppercase tracking-wider">📜 Télémétrie du Profil</h4>
        <div className="divide-y divide-afri-border/40">
          <div className="py-2.5 flex justify-between text-xs text-afri-text-sec">
            <span>Identifiant Unique AFRI</span>
            <span className="font-mono text-[#D4AF37] font-bold text-[11px]">{currentProfile?.afriId || "AFRI-MEMBER"}</span>
          </div>
          <div className="py-2.5 flex justify-between text-xs text-afri-text-sec">
            <span>Date d'inscription</span>
            <span className="font-mono text-afri-text text-[11px]">
              {currentProfile?.createdAt ? new Date(currentProfile.createdAt).toLocaleDateString() : "Récemment"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
