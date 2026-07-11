import React, { useState, useEffect } from "react";
import { Megaphone, Send, Bell, Trash2, ShieldCheck, Image as ImageIcon, Link as LinkIcon, Calendar, Target, AlertTriangle, Info, Clock, Activity, Users, Settings, Plus, X } from "lucide-react";
import { db } from "../../firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { useAuth } from "../../AuthContext";

export interface GlobalNotification {
  id?: string;
  titre: string;
  description: string;
  image?: string;
  lien?: string;
  type: string;
  priority: "Normale" | "Importante" | "Urgente";
  target: string;
  createdAt: string;
  expiresAt: string;
  createdBy: string;
  isActive: boolean;
  readCount?: number;
}

const NOTIFICATION_TYPES = [
  { value: "Actualité AFRIGOMBO", icon: Info },
  { value: "Nouvelle fonctionnalité", icon: Plus },
  { value: "Maintenance", icon: Settings },
  { value: "Événement", icon: Calendar },
  { value: "Promotion", icon: Activity },
  { value: "Message du Fondateur", icon: Megaphone },
  { value: "Alerte importante", icon: AlertTriangle }
];

const TARGETS = [
  "Tous les utilisateurs",
  "Tous les musiciens",
  "Tous les créateurs",
  "Tous les Premium",
  "Tous les administrateurs",
  "Groupe personnalisé"
];

interface AdminNotificationsProps {
  adminEmail?: string;
}

export default function AdminNotifications({ adminEmail = "Admin" }: AdminNotificationsProps) {
  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { currentUser, profile } = useAuth();

  // Form states
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [lien, setLien] = useState("");
  const [type, setType] = useState("Actualité AFRIGOMBO");
  const [priority, setPriority] = useState<"Normale" | "Importante" | "Urgente">("Normale");
  const [target, setTarget] = useState("Tous les utilisateurs");
  const [expiresInDays, setExpiresInDays] = useState(7);

  useEffect(() => {
    const q = query(collection(db, "global_notifications"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: GlobalNotification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as GlobalNotification);
      });
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim() || !description.trim()) return;
    
    if (!currentUser || !profile) {
      alert("Vous devez être connecté pour publier une annonce.");
      return;
    }
    
    setIsSending(true);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const newNotif: GlobalNotification = {
      titre: titre.trim(),
      description: description.trim(),
      image: image.trim() || undefined,
      lien: lien.trim() || undefined,
      type,
      priority,
      target,
      createdAt: now.toISOString(),
      expiresAt,
      createdBy: profile.displayName || currentUser.email || adminEmail,
      isActive: true,
      readCount: 0
    };

    try {
      await addDoc(collection(db, "global_notifications"), newNotif);
      setSuccess(true);
      setShowForm(false);
      resetForm();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Erreur lors de l'envoi de la notification :", err);
      alert("Erreur lors de la publication de l'annonce.");
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setTitre("");
    setDescription("");
    setImage("");
    setLien("");
    setType("Actualité AFRIGOMBO");
    setPriority("Normale");
    setTarget("Tous les utilisateurs");
    setExpiresInDays(7);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "global_notifications", id), { isActive: !currentStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette notification ?")) return;
    try {
      await deleteDoc(doc(db, "global_notifications", id));
    } catch (err) {
      console.error(err);
    }
  };

  // Stats
  const activeCount = notifications.filter(n => n.isActive && new Date(n.expiresAt) > new Date()).length;
  const expiredCount = notifications.filter(n => new Date(n.expiresAt) <= new Date() || !n.isActive).length;
  const totalReadCount = notifications.reduce((acc, n) => acc + (n.readCount || 0), 0);

  return (
    <div className="space-y-6 text-left pb-24 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-white/5 pb-4 flex justify-between items-end">
        <div>
          <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
            <Megaphone className="w-4 h-4" />
            Centre de Diffusion Mondial
          </h3>
          <p className="text-[10px] text-zinc-400 mt-1">
            Gérez et diffusez des annonces globales en temps réel.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#D4AF37] text-black font-black text-[10px] uppercase rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Fermer l'éditeur" : "Nouvelle Annonce"}
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-white">{notifications.length}</div>
            <div className="text-[9px] font-mono uppercase text-zinc-500">Envoyées</div>
          </div>
        </div>
        <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-white">{activeCount}</div>
            <div className="text-[9px] font-mono uppercase text-zinc-500">Actives</div>
          </div>
        </div>
        <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-white">{expiredCount}</div>
            <div className="text-[9px] font-mono uppercase text-zinc-500">Expirées / Inactives</div>
          </div>
        </div>
        <div className="p-4 bg-[#050505] border border-zinc-900 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-white">{totalReadCount}</div>
            <div className="text-[9px] font-mono uppercase text-zinc-500">Lectures Totales</div>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <ShieldCheck className="w-4 h-4" />
          <span>Annonce diffusée avec succès sur tout le réseau.</span>
        </div>
      )}

      {/* Editor Form */}
      {showForm && (
        <div className="p-6 bg-[#070707] border border-[#D4AF37]/30 rounded-2xl relative overflow-hidden animate-fadeIn">
          <div className="absolute right-0 top-0 w-32 h-32 bg-[#D4AF37]/10 blur-3xl rounded-full" />
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">Titre</label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Mise à jour 2.0 déployée"
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">Type de Notification</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                >
                  {NOTIFICATION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.value}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">Message Complet</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détaillez votre annonce ici..."
                rows={4}
                className="w-full bg-black border border-zinc-800 rounded-lg p-4 text-xs font-sans text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Image URL (Optionnel)
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> Lien d'action (Optionnel)
                </label>
                <input
                  type="url"
                  value={lien}
                  onChange={(e) => setLien(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">Cible</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                >
                  {TARGETS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">Priorité</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                >
                  <option value="Normale">Normale (Bleu)</option>
                  <option value="Importante">Importante (Orange)</option>
                  <option value="Urgente">Urgente (Rouge)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">Expiration (Jours)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-xs text-white focus:border-[#D4AF37] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!titre.trim() || !description.trim() || isSending}
                className="px-6 py-3 rounded-xl bg-[#D4AF37] disabled:bg-zinc-800 text-black font-black text-xs uppercase flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/20"
              >
                <Send className="w-4 h-4" />
                {isSending ? "Envoi en cours..." : "Publier l'Annonce"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      <div className="space-y-4 pt-4">
        <h4 className="text-xs font-mono uppercase font-black tracking-wider text-white flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-[#D4AF37]" />
          Historique des Publications
        </h4>
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="p-8 text-center bg-[#050505] border border-zinc-900 rounded-2xl text-zinc-500 text-[10px] font-mono uppercase">
              Aucune annonce globale n'a été diffusée.
            </div>
          ) : (
            notifications.map((notif) => {
              const isExpired = new Date(notif.expiresAt) <= new Date();
              const StatusIcon = NOTIFICATION_TYPES.find(t => t.value === notif.type)?.icon || Bell;
              
              return (
                <div
                  key={notif.id}
                  className={`p-4 bg-[#050505] border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    !notif.isActive || isExpired ? "border-zinc-900 opacity-60" : 
                    notif.priority === "Urgente" ? "border-red-900/50" : 
                    notif.priority === "Importante" ? "border-amber-900/50" : 
                    "border-[#D4AF37]/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      notif.priority === "Urgente" ? "bg-red-500/10 text-red-400" :
                      notif.priority === "Importante" ? "bg-amber-500/10 text-amber-400" :
                      "bg-[#D4AF37]/10 text-[#D4AF37]"
                    }`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-black text-white">{notif.titre}</h5>
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-mono font-bold ${
                          notif.priority === "Urgente" ? "bg-red-500/20 text-red-300" :
                          notif.priority === "Importante" ? "bg-amber-500/20 text-amber-300" :
                          "bg-blue-500/20 text-blue-300"
                        }`}>
                          {notif.priority}
                        </span>
                        {(!notif.isActive || isExpired) && (
                          <span className="px-2 py-0.5 rounded text-[8px] uppercase font-mono font-bold bg-zinc-800 text-zinc-400">
                            Inactif
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed max-w-2xl">{notif.description}</p>
                      <div className="flex flex-wrap gap-3 pt-1 text-[9px] font-mono text-zinc-550">
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {notif.target}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Exp. {new Date(notif.expiresAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {notif.readCount || 0} vues</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 md:pl-4 md:border-l border-zinc-900 shrink-0">
                    <button
                      onClick={() => toggleActive(notif.id!, notif.isActive)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                        notif.isActive 
                          ? "bg-zinc-900 text-zinc-400 hover:text-white" 
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {notif.isActive ? "Désactiver" : "Réactiver"}
                    </button>
                    <button
                      onClick={() => deleteNotification(notif.id!)}
                      className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-red-950/30 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-all"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
