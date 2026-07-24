import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  User, 
  DollarSign, 
  Calendar, 
  ShieldAlert, 
  Sparkles,
  RefreshCw,
  ExternalLink,
  Zap
} from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, query, onSnapshot, doc, updateDoc, addDoc, getDocs, where } from "firebase/firestore";
import { audioSynth } from "../../lib/audio";

export interface PendingPublication {
  id: string;
  collectionName: "social_posts" | "gombos";
  title: string;
  authorName: string;
  authorId: string;
  budget?: number;
  totalAmountToDeposit?: number;
  createdAt: string;
  status: string;
  paymentMethod?: string;
  paymentProvider?: string;
  paymentStatus?: string;
  adminValidated?: boolean;
  visible?: boolean;
  activationCode?: string;
  commune?: string;
  type?: string;
}

interface PendingPublicationsAdminPanelProps {
  currentUser?: any;
}

export const PendingPublicationsAdminPanel: React.FC<PendingPublicationsAdminPanelProps> = ({
  currentUser
}) => {
  const [items, setItems] = useState<PendingPublication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Realtime listener for social_posts
    const unsubPosts = onSnapshot(collection(db, "social_posts"), (snap) => {
      const socialList: PendingPublication[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const isPending = 
          data.status === "pending_deposit" || 
          data.status === "pending" || 
          data.adminValidated === false || 
          data.visible === false;
        
        if (isPending && data.status !== "rejected" && data.status !== "refuse" && data.status !== "cancelled") {
          socialList.push({
            id: d.id,
            collectionName: "social_posts",
            title: data.title || data.caption || "Publication sans titre",
            authorName: data.authorName || data.userName || "Utilisateur Anonyme",
            authorId: data.authorId || data.userId || "",
            budget: Number(data.budget || data.feeAmount || 0),
            totalAmountToDeposit: Number(data.totalAmountToDeposit || data.budget || 0),
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || "pending_deposit",
            paymentMethod: data.paymentMethod || "manual_beta",
            paymentProvider: data.paymentProvider || "manual_beta",
            paymentStatus: data.paymentStatus || "waiting",
            adminValidated: !!data.adminValidated,
            visible: !!data.visible,
            activationCode: data.activationCode,
            commune: data.commune || "",
            type: data.type || data.postCategory || "Annonce"
          });
        }
      });

      // Realtime listener for gombos
      const unsubGombos = onSnapshot(collection(db, "gombos"), (snapGombos) => {
        const gombosList: PendingPublication[] = [];
        snapGombos.forEach((d) => {
          const data = d.data();
          const isPending = 
            data.status === "pending_deposit" || 
            data.status === "pending" || 
            data.adminValidated === false || 
            data.visible === false;
          
          if (isPending && data.status !== "rejected" && data.status !== "refuse" && data.status !== "cancelled") {
            // Avoid duplicate if already included from social_posts with same title & authorId
            const existsInSocial = socialList.some(
              p => p.title.toLowerCase() === (data.title || "").toLowerCase() && p.authorId === (data.clientId || data.authorId)
            );
            
            if (!existsInSocial) {
              gombosList.push({
                id: d.id,
                collectionName: "gombos",
                title: data.title || "Gombo sans titre",
                authorName: data.clientName || data.organizerName || "Client Gombo",
                authorId: data.clientId || data.organizerId || "",
                budget: Number(data.budget || 0),
                totalAmountToDeposit: Number(data.totalAmountToDeposit || data.budget || 0),
                createdAt: data.createdAt || new Date().toISOString(),
                status: data.status || "pending_deposit",
                paymentMethod: data.paymentMethod || "manual_beta",
                paymentProvider: data.paymentProvider || "manual_beta",
                paymentStatus: data.paymentStatus || "waiting",
                adminValidated: !!data.adminValidated,
                visible: !!data.visible,
                activationCode: data.activationCode,
                commune: data.commune || "",
                type: data.eventType || "Gombo"
              });
            }
          }
        });

        const merged = [...socialList, ...gombosList].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setItems(merged);
        setLoading(false);
      }, (err) => {
        console.warn("Gombos listener warning:", err);
        setItems(socialList);
        setLoading(false);
      });

      return () => unsubGombos();
    }, (err) => {
      console.warn("Social posts listener warning:", err);
      setLoading(false);
    });

    return () => unsubPosts();
  }, []);

  // Validation Action
  const handleValidate = async (item: PendingPublication) => {
    setActionLoadingId(item.id);
    const now = new Date().toISOString();
    try {
      if (!db) throw new Error("Base de données non initialisée");

      // Update primary document
      const docRef = doc(db, item.collectionName, item.id);
      await updateDoc(docRef, {
        status: "published",
        paymentStatus: "paid",
        adminValidated: true,
        visible: true,
        publishedAt: now,
        depositConfirmed: true,
        depositConfirmedAt: now
      });

      // Dual sync update on complementary collection if exists
      if (item.collectionName === "social_posts") {
        try {
          const qGombos = query(collection(db, "gombos"), where("clientId", "==", item.authorId), where("status", "==", "pending_deposit"));
          const snapGombos = await getDocs(qGombos);
          snapGombos.forEach((d) => {
            updateDoc(d.ref, {
              status: "published",
              paymentStatus: "paid",
              adminValidated: true,
              visible: true,
              publishedAt: now,
              depositConfirmed: true,
              depositConfirmedAt: now
            }).catch(() => {});
          });
        } catch (_) {}
      } else {
        try {
          const qPosts = query(collection(db, "social_posts"), where("userId", "==", item.authorId), where("status", "==", "pending_deposit"));
          const snapPosts = await getDocs(qPosts);
          snapPosts.forEach((d) => {
            updateDoc(d.ref, {
              status: "published",
              paymentStatus: "paid",
              adminValidated: true,
              visible: true,
              publishedAt: now,
              depositConfirmed: true,
              depositConfirmedAt: now
            }).catch(() => {});
          });
        } catch (_) {}
      }

      // Send confirmation notification to author
      if (item.authorId) {
        await addDoc(collection(db, "notifications"), {
          userId: item.authorId,
          title: "🎉 Publication Validée !",
          body: `Votre publication "${item.title}" a été validée par le Fondateur et est maintenant visible sur Le Terrain.`,
          type: "publication_validated",
          read: false,
          createdAt: now
        }).catch(() => {});
      }

      try { audioSynth.playValidationSuccess(); } catch (_) {}
      showToast(`✅ Publication "${item.title}" validée avec succès ! Elle est désormais visible.`);
    } catch (err: any) {
      showToast(`❌ Erreur : ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Generate Code Action
  const handleGenerateCode = async (item: PendingPublication) => {
    setActionLoadingId(item.id);
    try {
      const { createValidationCodeForPost } = await import("../../lib/validationCodeEngine");
      const code = await createValidationCodeForPost(item.id, item.collectionName);
      showToast(`🔑 Code de validation généré : ${code} pour "${item.title}".`);
    } catch (err: any) {
      showToast(`❌ Erreur lors de la génération du code : ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Refusal Action
  const handleRefuse = async (item: PendingPublication) => {
    setActionLoadingId(item.id);
    const now = new Date().toISOString();
    try {
      if (!db) throw new Error("Base de données non initialisée");

      const docRef = doc(db, item.collectionName, item.id);
      await updateDoc(docRef, {
        status: "rejected",
        paymentStatus: "rejected",
        adminValidated: false,
        visible: false,
        updatedAt: now
      });

      if (item.authorId) {
        await addDoc(collection(db, "notifications"), {
          userId: item.authorId,
          title: "❌ Publication Non Validée",
          body: `Votre publication "${item.title}" n'a pas été validée. Contactez le Support AFRIGOMBO pour plus d'informations.`,
          type: "publication_rejected",
          read: false,
          createdAt: now
        }).catch(() => {});
      }

      try { audioSynth.playKoraNote(200, 0, 0.2, 0.4); } catch (_) {}
      showToast(`❌ Publication "${item.title}" refusée.`);
    } catch (err: any) {
      showToast(`❌ Erreur : ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.authorName.toLowerCase().includes(q) ||
      item.commune.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-[#D4AF37] text-black font-mono text-xs font-black rounded-2xl shadow-xl flex items-center justify-between border border-amber-300"
          >
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Header & Search Bar */}
      <div className="p-4 bg-afri-bg/90 border border-sky-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-display font-black text-afri-text uppercase tracking-wider">
              Publications en attente ({items.length})
            </h3>
            <p className="text-[10px] text-afri-text-sec font-mono">
              Validation manuelle Escrow Bêta — Fournisseur actuel : <span className="text-[#D4AF37] font-bold">manual_beta</span>
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-afri-text-sec absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher titre, auteur..."
            className="w-full pl-9 pr-3 py-2 bg-afri-bg-sec border border-afri-border rounded-xl text-xs text-afri-text placeholder:text-afri-text-sec/60 focus:outline-none focus:border-sky-400 font-mono"
          />
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-afri-text-sec flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
          <span>Chargement des publications en attente...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-10 bg-afri-bg border border-afri-border rounded-3xl text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto text-xl">
            ✨
          </div>
          <h4 className="text-xs font-mono uppercase font-black text-afri-text">
            Toutes les publications sont traitées
          </h4>
          <p className="text-[10px] text-afri-text-sec font-mono max-w-sm mx-auto">
            Aucune publication n'est actuellement en attente de validation du dépôt.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isProcessing = actionLoadingId === item.id;
            return (
              <motion.div
                key={`${item.collectionName}_${item.id}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-afri-bg border-2 border-sky-500/30 hover:border-sky-400 rounded-3xl space-y-4 shadow-xl transition-all relative overflow-hidden"
              >
                {/* Status bar */}
                <div className="flex items-center justify-between border-b border-afri-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 font-mono font-black text-[9px] uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3 animate-pulse" />
                      🟡 EN ATTENTE DE DÉPÔT
                    </span>
                    <span className="text-[9px] font-mono text-afri-text-sec bg-afri-bg-sec px-2 py-0.5 rounded-md border border-afri-border">
                      {item.type}
                    </span>
                  </div>

                  <span className="text-[9px] font-mono text-afri-text-sec">
                    Provider: <strong className="text-sky-400">{item.paymentProvider || "manual_beta"}</strong>
                  </span>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
                  {/* Title & Commune */}
                  <div className="md:col-span-2 space-y-1">
                    <span className="text-[9px] text-afri-text-sec uppercase tracking-wider block">Titre de la publication</span>
                    <strong className="text-sm font-display font-black text-afri-text block leading-snug">
                      {item.title}
                    </strong>
                    {item.commune && (
                      <span className="text-[10px] text-sky-400 font-bold block">
                        📍 Commune : {item.commune}
                      </span>
                    )}
                  </div>

                  {/* Author */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-afri-text-sec uppercase tracking-wider block">Auteur / Promoteur</span>
                    <div className="flex items-center gap-1.5 text-afri-text font-bold">
                      <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="truncate">{item.authorName}</span>
                    </div>
                  </div>

                  {/* Budget & Date */}
                  <div className="space-y-1 text-right md:text-left">
                    <span className="text-[9px] text-afri-text-sec uppercase tracking-wider block">Cachet & Date</span>
                    <div className="text-[#D4AF37] font-black text-sm">
                      {item.budget ? `${item.budget.toLocaleString()} FCFA` : "Gratuit / Démo"}
                    </div>
                    <div className="text-[9px] text-afri-text-sec flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-afri-border/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[9.5px] font-mono text-afri-text-sec italic">
                    💡 La validation rendra cette publication immédiatement publique sur Le Terrain.
                  </span>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleGenerateCode(item)}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 font-mono text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                      title="Générer un code de validation à transmettre au client via WhatsApp"
                    >
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span>{item.activationCode ? `Code: ${item.activationCode}` : "Générer Code"}</span>
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() => handleRefuse(item)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/40 text-red-400 font-mono text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Refuser</span>
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() => handleValidate(item)}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-mono text-xs font-black uppercase rounded-xl transition-all shadow-lg shadow-[#D4AF37]/25 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Valider la publication</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
