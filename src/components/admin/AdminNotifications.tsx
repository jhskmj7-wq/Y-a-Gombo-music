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
  Monitor
} from "lucide-react";
import { gomboDB } from "../../firebase";
import { useAuth } from "../../AuthContext";
import { AppNotification, NotificationType, NotificationAudience, NotificationStatus } from "../../types";
import { motion, AnimatePresence } from "motion/react";

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
      scheduledAt,
      status: isDraft ? "draft" : (scheduledAt ? "scheduled" : "published"),
      createdBy: profile?.artisticName || profile?.name || adminEmail,
    };

    try {
      await gomboDB.addNotification(newNotif);
      setSuccess(true);
      setShowForm(false);
      resetForm();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Erreur lors de l'envoi de la notification :", err);
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

  const toggleStatus = async (id: string, currentStatus: NotificationStatus) => {
    const nextStatus: NotificationStatus = currentStatus === "inactive" ? "published" : "inactive";
    try {
      await gomboDB.updateNotification(id, { status: nextStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette notification impériale ?")) return;
    try {
      await gomboDB.deleteNotification(id);
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

  // Stats logic
  const totalSent = notifications.length;
  const totalReads = notifications.reduce((acc, n) => acc + (n.readCount || 0), 0);
  const totalClicks = notifications.reduce((acc, n) => acc + (n.clickCount || 0), 0);
  const activeNotifs = notifications.filter(n => n.status === "published").length;

  return (
    <div className="min-h-screen bg-afri-bg-sec text-left pb-24 overflow-x-hidden relative">
      {/* IMPERIAL OVERLAY */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#D4AF37]/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 pt-12 relative z-10 space-y-12">
        {/* HERO HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex flex-col items-center gap-4">
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA8811] p-0.5 shadow-[0_0_50px_rgba(212,175,55,0.2)]"
            >
              <div className="w-full h-full rounded-full bg-afri-bg flex items-center justify-center">
                <Bell className="w-10 h-10 text-[#D4AF37]" />
              </div>
            </motion.div>
            <div>
              <h2 className="text-4xl font-black text-afri-text tracking-tighter uppercase mb-2">Centre de Notifications Impérial</h2>
              <p className="text-[#D4AF37] font-mono text-sm tracking-widest uppercase opacity-80">
                Le Temple du Gombo informe sa communauté.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-10 py-4 bg-afri-bg-sec text-black font-black text-xs uppercase rounded-full hover:scale-105 transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(212,175,55,0.3)]"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? "Masquer le Temple" : "Forger une Annonce"}
            </button>
          </div>
        </motion.div>

        {/* STATS BENTO */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Annonces", value: totalSent, icon: Megaphone, color: "text-blue-400" },
            { label: "Actives", value: activeNotifs, icon: Activity, color: "text-emerald-400" },
            { label: "Lectures", value: totalReads, icon: Eye, color: "text-amber-400" },
            { label: "Clics", value: totalClicks, icon: MousePointerClick, color: "text-indigo-400" }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-afri-bg border border-afri-border rounded-3xl group hover:border-[#D4AF37]/30 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-2xl bg-afri-bg border border-afri-border flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-afri-text-sec font-bold">{stat.label}</span>
              </div>
              <div className="text-3xl font-black text-afri-text">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* FEEDBACK */}
        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-sm flex items-center justify-center gap-3"
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="font-bold">Décret royal publié avec succès sur tout le réseau.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EDITOR FORM */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-8 bg-afri-bg border border-[#D4AF37]/30 rounded-3xl relative shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-afri-bg-sec/5 blur-[100px] rounded-full pointer-events-none" />
                
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-afri-text-sec block font-black">Titre du Décret</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="EX: ÉVÉNEMENT HISTORIQUE À ABIDJAN"
                          className="w-full bg-afri-bg border border-afri-border rounded-2xl p-4 text-sm text-afri-text focus:border-[#D4AF37] outline-none transition-all font-black uppercase tracking-tight"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-afri-text-sec block font-black">Message Impérial</label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Détaillez la volonté du Fondateur..."
                          rows={6}
                          className="w-full bg-afri-bg border border-afri-border rounded-2xl p-6 text-sm font-sans text-afri-text focus:border-[#D4AF37] outline-none transition-all resize-none leading-relaxed"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-afri-text-sec block font-black">Type & Audience</label>
                        <div className="grid grid-cols-1 gap-3">
                          <select
                            value={type}
                            onChange={(e) => setType(e.target.value as NotificationType)}
                            className="w-full bg-afri-bg border border-afri-border rounded-xl p-4 text-xs text-afri-text focus:border-[#D4AF37] outline-none appearance-none"
                          >
                            {NOTIFICATION_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.value}</option>
                            ))}
                          </select>
                          <select
                            value={audience}
                            onChange={(e) => setAudience(e.target.value as NotificationAudience)}
                            className="w-full bg-afri-bg border border-afri-border rounded-xl p-4 text-xs text-afri-text focus:border-[#D4AF37] outline-none appearance-none"
                          >
                            {AUDIENCES.map(a => (
                              <option key={a} value={a}>Destinataires : {a}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-afri-text-sec block font-black">Programmation (Optionnel)</label>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="date"
                            value={scheduledAtDate}
                            onChange={(e) => setScheduledAtDate(e.target.value)}
                            className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text focus:border-[#D4AF37] outline-none"
                          />
                          <input
                            type="time"
                            value={scheduledAtTime}
                            onChange={(e) => setScheduledAtTime(e.target.value)}
                            className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text focus:border-[#D4AF37] outline-none"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-afri-bg border border-afri-border rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-afri-text-sec uppercase font-black">Priorité</span>
                          <span className="text-xs font-black text-[#D4AF37]">{priority}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={priority}
                          onChange={(e) => setPriority(parseInt(e.target.value))}
                          className="w-full h-1 bg-afri-bg-ter rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-afri-border">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-afri-text-sec block font-black flex items-center gap-2">
                        <ImageIcon className="w-3 h-3" /> URL de l'Image
                      </label>
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-afri-text-sec block font-black flex items-center gap-2">
                        <Monitor className="w-3 h-3" /> Libellé du Bouton
                      </label>
                      <input
                        type="text"
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        placeholder="Ex: Voir l'annonce"
                        className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-afri-text-sec block font-black flex items-center gap-2">
                        <LinkIcon className="w-3 h-3" /> URL d'Action
                      </label>
                      <input
                        type="url"
                        value={actionUrl}
                        onChange={(e) => setActionUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-afri-bg border border-afri-border rounded-xl p-3 text-xs text-afri-text focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsDraft(!isDraft)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase transition-all border ${
                        isDraft 
                          ? "bg-afri-bg-sec text-black border-[#D4AF37]" 
                          : "bg-afri-bg text-afri-text-sec border-afri-border hover:text-afri-text"
                      }`}
                    >
                      {isDraft ? <Clock className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                      {isDraft ? "Enregistrer comme Brouillon" : "Passer en Brouillon"}
                    </button>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-8 py-4 text-afri-text-sec hover:text-afri-text text-[10px] font-black uppercase transition-all"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={!title.trim() || !message.trim() || isSending}
                        className="px-12 py-4 bg-afri-bg-sec disabled:bg-afri-bg-ter text-black font-black text-xs uppercase rounded-full flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(212,175,55,0.2)]"
                      >
                        {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isSending ? "Fonderie en cours..." : "Sceller & Diffuser"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FEED / HISTORY */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-afri-border pb-4">
            <h4 className="text-xl font-black text-afri-text uppercase tracking-tight flex items-center gap-3">
              <Bell className="w-6 h-6 text-[#D4AF37]" />
              Sillage Impérial
            </h4>
            <div className="flex gap-4">
              <span className="text-[10px] font-mono text-afri-text-sec uppercase flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Temps Réel Actif
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {notifications.length === 0 ? (
              <div className="p-20 text-center bg-afri-bg border border-afri-border rounded-3xl">
                <Bell className="w-12 h-12 text-zinc-900 mx-auto mb-4" />
                <p className="text-afri-text-sec font-mono text-[10px] uppercase tracking-widest">Le registre impérial est vide.</p>
              </div>
            ) : (
              notifications.map((notif, idx) => {
                const typeInfo = NOTIFICATION_TYPES.find(t => t.value === notif.type) || NOTIFICATION_TYPES[0];
                const Icon = typeInfo.icon;
                const isInactive = notif.status === "inactive" || notif.status === "draft";
                const isScheduled = notif.status === "scheduled";
                
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-6 bg-afri-bg border rounded-3xl flex flex-col lg:flex-row gap-8 transition-all hover:border-[#D4AF37]/40 relative overflow-hidden group ${
                      isInactive ? "border-afri-border grayscale opacity-60" : 
                      notif.priority > 7 ? "border-red-900/50" : "border-afri-border"
                    }`}
                  >
                    {/* PRIORITY GLOW */}
                    {notif.priority > 7 && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[50px] rounded-full pointer-events-none" />
                    )}

                    <div className="flex items-start gap-6 lg:w-3/4">
                      <div className={`w-16 h-16 rounded-2xl bg-afri-bg border border-afri-border flex items-center justify-center shrink-0 ${typeInfo.color} shadow-lg`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h5 className="text-lg font-black text-afri-text uppercase tracking-tight">{notif.title}</h5>
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              notif.status === "published" ? "bg-emerald-500/10 text-emerald-400" :
                              notif.status === "scheduled" ? "bg-blue-500/10 text-blue-400" :
                              "bg-afri-bg-ter text-afri-text-sec"
                            }`}>
                              {notif.status}
                            </span>
                            <span className="px-3 py-1 bg-afri-bg-sec text-afri-text-sec border border-afri-border rounded-full text-[8px] font-black uppercase tracking-widest">
                              Priorité {notif.priority}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-afri-text-sec font-sans leading-relaxed line-clamp-3">
                          {notif.message}
                        </p>

                        <div className="flex flex-wrap gap-4 items-center">
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-afri-text-sec uppercase font-black">
                            <Target className="w-3.5 h-3.5" /> {notif.audience}
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-afri-text-sec uppercase font-black">
                            <Users className="w-3.5 h-3.5" /> Créé par {notif.createdBy}
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-afri-text-sec uppercase font-black">
                            <Clock className="w-3.5 h-3.5" /> {new Date(notif.createdAt).toLocaleDateString()}
                          </div>
                          {isScheduled && notif.scheduledAt && (
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-blue-400 uppercase font-black">
                              <Calendar className="w-3.5 h-3.5" /> Programmé le {new Date(notif.scheduledAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-1/4 border-t lg:border-t-0 lg:border-l border-afri-border pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1">
                          <div className="text-[8px] font-mono text-afri-text-sec uppercase font-black flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Vues
                          </div>
                          <div className="text-xl font-black text-afri-text">{notif.readCount || 0}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[8px] font-mono text-afri-text-sec uppercase font-black flex items-center gap-1">
                            <MousePointerClick className="w-3 h-3" /> Clics
                          </div>
                          <div className="text-xl font-black text-[#D4AF37]">{notif.clickCount || 0}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => duplicateNotification(notif)}
                          className="flex-1 h-10 bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border text-afri-text rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                        >
                          <Copy className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                          <span className="text-[9px] font-black uppercase">Cloner</span>
                        </button>
                        <button
                          onClick={() => toggleStatus(notif.id, notif.status)}
                          className={`flex-1 h-10 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                            notif.status === "inactive"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-afri-bg-sec border-afri-border text-afri-text-sec hover:text-afri-text"
                          }`}
                        >
                          {notif.status === "inactive" ? "Publier" : "Désactiver"}
                        </button>
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="w-10 h-10 bg-red-950/20 hover:bg-red-500 border border-red-950/30 text-red-400 hover:text-afri-text rounded-xl transition-all flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
