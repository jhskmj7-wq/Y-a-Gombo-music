import React, { useState, useEffect } from "react";
import { 
  Megaphone, 
  Send, 
  Bell, 
  Trash2, 
  ShieldCheck, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Calendar, 
  Target, 
  AlertTriangle, 
  Info, 
  Clock, 
  Activity, 
  Users, 
  Settings, 
  Plus, 
  X, 
  Star, 
  Shield, 
  Zap, 
  RefreshCw, 
  Copy, 
  Eye, 
  MousePointerClick, 
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { gomboDB } from "../../firebase";
import { db } from "../../lib/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { useAuth } from "../../AuthContext";
import { AppNotification, NotificationType, NotificationAudience } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { FounderBottomSheet } from "./FounderBottomSheet";

const NOTIFICATION_TYPES: { value: NotificationType; icon: any; color: string }[] = [
  { value: "INFO", icon: Info, color: "text-blue-400" },
  { value: "GOMBO", icon: Zap, color: "text-emerald-400" },
  { value: "URGENT", icon: AlertTriangle, color: "text-red-400" },
  { value: "ÉVÉNEMENT", icon: Calendar, color: "text-purple-400" },
  { value: "MISE À JOUR", icon: RefreshCw, color: "text-orange-400" },
  { value: "PREMIUM", icon: Star, color: "text-amber-400" },
  { value: "SÉCURITÉ", icon: Shield, color: "text-indigo-400" }
];

const AUDIENCES: NotificationAudience[] = [
  "Tous",
  "Premium",
  "Musiciens",
  "Organisateurs",
  "Administrateurs",
  "Super Fondateur"
];

interface AdminNotificationsProps {
  adminEmail?: string;
}

export default function AdminNotifications({ adminEmail = "Fondateur" }: AdminNotificationsProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [activeTab, setActiveTab] = useState<"TOUTES" | "IMPORTANTES" | "A_TRAITER" | "LUES">("TOUTES");
  const { profile } = useAuth();

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [action, setAction] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [type, setType] = useState<NotificationType>("INFO");
  const [audience, setAudience] = useState<NotificationAudience>("Tous");
  const [priority, setPriority] = useState(0);
  const [scheduledAtDate, setScheduledAtDate] = useState("");
  const [scheduledAtTime, setScheduledAtTime] = useState("");
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    const unsubscribe = gomboDB.listenAdminNotifications((notifs) => {
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    
    setIsSending(true);
    
    let scheduledAt = null;
    if (scheduledAtDate && scheduledAtTime) {
      scheduledAt = new Date(`${scheduledAtDate}T${scheduledAtTime}`).toISOString();
    }

    const newNotif: Partial<AppNotification> = {
      title: title.trim(),
      message: message.trim(),
      image: image.trim() || undefined,
      action: action.trim() || undefined,
      actionUrl: actionUrl.trim() || undefined,
      type,
      audience,
      priority,
      status: isDraft ? "draft" : scheduledAt ? "scheduled" : "published",
      scheduledAt: scheduledAt || undefined,
      createdAt: new Date().toISOString(),
      createdBy: profile?.displayName || adminEmail || "Super Fondateur",
      readCount: 0,
      clickCount: 0
    };

    try {
      await gomboDB.addNotification(newNotif);
      setSuccess(true);
      resetForm();
      setShowForm(false);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setImage("");
    setAction("");
    setActionUrl("");
    setType("INFO");
    setAudience("Tous");
    setPriority(0);
    setScheduledAtDate("");
    setScheduledAtTime("");
    setIsDraft(false);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "published" ? "inactive" : "published";
      await updateDoc(doc(db, "notifications", id), { status: nextStatus });
      if (selectedNotif && selectedNotif.id === id) {
        setSelectedNotif({ ...selectedNotif, status: nextStatus as any });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette notification impériale ?")) return;
    try {
      await gomboDB.deleteNotification(id);
      if (selectedNotif?.id === id) {
        setSelectedNotif(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const duplicateNotification = async (notif: AppNotification) => {
    try {
      const { id, ...data } = notif;
      await gomboDB.addNotification({
        ...data,
        title: `${data.title} (Copie)`,
        createdAt: new Date().toISOString(),
        status: "draft"
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Filter counts
  const countAll = notifications.length;
  const countImportantes = notifications.filter(n => n.priority >= 5 || n.type === "URGENT" || n.type === "SÉCURITÉ").length;
  const countATraiter = notifications.filter(n => n.status === "draft" || n.status === "scheduled").length;
  const countLues = notifications.filter(n => (n.readCount || 0) > 0).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "IMPORTANTES") return n.priority >= 5 || n.type === "URGENT" || n.type === "SÉCURITÉ";
    if (activeTab === "A_TRAITER") return n.status === "draft" || n.status === "scheduled";
    if (activeTab === "LUES") return (n.readCount || 0) > 0;
    return true;
  });

  return (
    <div className="w-full bg-zinc-950 text-left overflow-x-hidden relative select-none">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Top Header with Compact Actions */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-[#D4AF37]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white uppercase tracking-wider font-display">
                  CENTRE DE DIFFUSION & DÉCRETS
                </h2>
                <span className="text-[10px] font-mono font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full">
                  CANAL IMPÉRIAL
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Notifications push, bannières broadcast et messages prioritaires.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#bfa032] text-black font-mono font-black text-xs uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? "Fermer le Formulaire" : "Nouvelle Diffusion"}</span>
          </button>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-mono font-bold flex items-center gap-3"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Décret diffusé avec succès sur tout l'écosystème AFRIGOMBO.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Broadcast Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-zinc-900/90 border border-[#D4AF37]/40 rounded-3xl relative shadow-2xl space-y-6">
                <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>Rédiger une nouvelle diffusion</span>
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Titre de l'Annonce</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="EX: NOUVELLE FONCTIONNALITÉ DISPONIBLE"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:border-[#D4AF37] outline-none font-bold uppercase"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Audience Cible</label>
                        <select
                          value={audience}
                          onChange={(e) => setAudience(e.target.value as NotificationAudience)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                        >
                          {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Type</label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as NotificationType)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                        >
                          {NOTIFICATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Message du Décret</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Texte détaillé du message..."
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:border-[#D4AF37] outline-none resize-none leading-relaxed"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Texte Bouton Action (Optionnel)</label>
                      <input
                        type="text"
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        placeholder="EX: VOIR L'ANNONCE"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Lien de Redirection (URL / Route)</label>
                      <input
                        type="text"
                        value={actionUrl}
                        onChange={(e) => setActionUrl(e.target.value)}
                        placeholder="EX: /wallet ou /gombos"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-mono font-bold transition cursor-pointer"
                    >
                      Effacer
                    </button>
                    <button
                      type="submit"
                      disabled={!title.trim() || !message.trim() || isSending}
                      className="px-6 py-2.5 bg-[#D4AF37] text-black font-mono font-black text-xs uppercase rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>{isSending ? "Diffusion..." : "Diffuser Immédiatement"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {[
            { id: "TOUTES", label: "TOUTES", count: countAll },
            { id: "IMPORTANTES", label: "IMPORTANTES", count: countImportantes },
            { id: "A_TRAITER", label: "À TRAITER", count: countATraiter },
            { id: "LUES", label: "LUES", count: countLues },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-[#D4AF37] text-black shadow-md font-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <span>{t.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === t.id ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-300"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Compact List of Notifications (does NOT hog the screen) */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="p-10 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              <Bell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400 font-mono text-xs">Aucune notification dans cette vue.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const typeInfo = NOTIFICATION_TYPES.find(t => t.value === notif.type) || NOTIFICATION_TYPES[0];
              const Icon = typeInfo.icon;
              const isUrgent = notif.priority >= 5 || notif.type === "URGENT";

              return (
                <div
                  key={notif.id}
                  onClick={() => setSelectedNotif(notif)}
                  className="p-3.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-[#D4AF37]/50 rounded-2xl transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-white uppercase tracking-tight truncate">
                          {notif.title}
                        </h4>
                        {isUrgent && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                            Important
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-zinc-500">
                          {new Date(notif.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-zinc-500 group-hover:text-[#D4AF37] transition flex items-center gap-1">
                      <span>Détails</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Notification Bottom Sheet (maxHeight 75dvh) */}
      <FounderBottomSheet
        isOpen={!!selectedNotif}
        onClose={() => setSelectedNotif(null)}
        title={
          selectedNotif ? (
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#D4AF37]" />
              <span className="font-mono uppercase font-black">{selectedNotif.title}</span>
            </div>
          ) : "Notification"
        }
        subtitle={selectedNotif ? `Audience : ${selectedNotif.audience} • Type : ${selectedNotif.type}` : ""}
        maxHeight="75dvh"
      >
        {selectedNotif && (
          <div className="space-y-5 text-left font-sans">
            {/* Header info */}
            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <span>Statut : <strong className="text-emerald-400 uppercase">{selectedNotif.status}</strong></span>
                <span>•</span>
                <span>Priorité : <strong className="text-[#D4AF37]">{selectedNotif.priority}</strong></span>
              </div>
              <div className="text-[11px] font-mono text-zinc-500">
                {new Date(selectedNotif.createdAt).toLocaleString("fr-FR")}
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase font-black text-zinc-400">Corps du Message</h4>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {selectedNotif.message}
              </div>
            </div>

            {/* Context details */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-[10px] text-zinc-500 block">Origine / Émetteur</span>
                <span className="text-zinc-200 font-bold">{selectedNotif.createdBy || "Super Fondateur"}</span>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-[10px] text-zinc-500 block">Public Ciblé</span>
                <span className="text-zinc-200 font-bold">{selectedNotif.audience}</span>
              </div>
            </div>

            {/* Action associated if any */}
            {selectedNotif.action && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-amber-300 font-bold">Action : {selectedNotif.action}</span>
                {selectedNotif.actionUrl && (
                  <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                    {selectedNotif.actionUrl} <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl">
              <div>
                <span className="text-[10px] text-zinc-500 block">Vues / Ouvertures</span>
                <span className="text-white font-bold text-base">{selectedNotif.readCount || 0}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">Clics sur Action</span>
                <span className="text-[#D4AF37] font-bold text-base">{selectedNotif.clickCount || 0}</span>
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => duplicateNotification(selectedNotif)}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Dupliquer</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStatus(selectedNotif.id, selectedNotif.status)}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                >
                  {selectedNotif.status === "inactive" ? "Publier" : "Désactiver"}
                </button>
                <button
                  onClick={() => deleteNotification(selectedNotif.id)}
                  className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </FounderBottomSheet>
    </div>
  );
}
