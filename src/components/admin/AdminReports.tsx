import React from "react";
import { AlertTriangle, Trash2, ShieldAlert, CheckCircle, MessageSquare } from "lucide-react";
import { Alerte, Post } from "../../types";

interface AdminReportsProps {
  alerts: Alerte[];
  posts: Post[];
  onDismissAlert?: (alertId: string) => void;
  onDeletePost?: (postId: string) => void;
  onUnflagPost?: (postId: string) => void;
  audioSynth?: any;
}

export default function AdminReports({
  alerts = [],
  posts = [],
  onDismissAlert,
  onDeletePost,
  onUnflagPost,
  audioSynth
}: AdminReportsProps) {
  const flaggedPosts = posts.filter((p) => p.isFlagged);

  const handleDismissAlert = (id: string) => {
    if (onDismissAlert) {
      onDismissAlert(id);
      try { audioSynth?.playValidationSuccess(); } catch (err) {}
    }
  };

  const handleUnflagPost = (id: string) => {
    if (onUnflagPost) {
      onUnflagPost(id);
      try { audioSynth?.playValidationSuccess(); } catch (err) {}
    }
  };

  const handleDeletePost = (id: string) => {
    if (onDeletePost) {
      onDeletePost(id);
      try { audioSynth?.playValidationSuccess(); } catch (err) {}
    }
  };

  return (
    <div className="space-y-8 text-left pb-24 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-afri-border pb-4">
        <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          Rapports, Signalements & Vigilance
        </h3>
        <p className="text-xs text-afri-text-sec mt-1">
          Surveillance géolocalisée et notifications critiques provenant des communes principales d'Abidjan (Yopougon, Cocody, Marcory, etc.).
        </p>
      </div>

      {/* Critical System Alerts */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          Alertes Systèmes ({alerts.length})
        </h4>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="p-6 text-center bg-afri-bg/40 border border-afri-border rounded-2xl text-afri-text-sec text-xs font-mono">
              Aucune alerte critique en cours.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border ${
                  alert.severity === "high" ? "border-red-500/30 bg-red-500/5" : "border-[#D4AF37]/20 bg-afri-bg-sec"
                } flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${alert.severity === "high" ? "text-red-500" : "text-[#D4AF37]"}`} />
                  <div>
                    <span className="font-sans font-black text-sm text-afri-text block">
                      Alerte - {alert.userArtisticName || "Artiste Gombo"}
                    </span>
                    <span className="text-xs text-afri-text-sec leading-relaxed block mt-1">{alert.reason}</span>
                    <span className="text-[9px] font-mono text-afri-text-sec block mt-2">
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleString("fr-FR") : "Date inconnue"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto self-end sm:self-center">
                  {onDismissAlert && (
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="px-4 py-2 bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border text-afri-text font-mono font-bold text-[10px] uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Ignorer
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Flagged Posts */}
      <div className="space-y-4 pt-4">
        <h4 className="text-xs font-mono uppercase font-black tracking-wider text-[#D4AF37] flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          Publications Signalées ({flaggedPosts.length})
        </h4>

        <div className="space-y-3">
          {flaggedPosts.length === 0 ? (
            <div className="p-6 text-center bg-afri-bg/40 border border-afri-border rounded-2xl text-afri-text-sec text-xs font-mono">
              Aucune publication signalée pour le moment.
            </div>
          ) : (
            flaggedPosts.map((post) => (
              <div
                key={post.id}
                className="p-5 bg-gradient-to-br from-afri-bg-ter to-afri-bg border border-red-500/20 rounded-2xl space-y-4"
              >
                <div className="flex justify-between items-start border-b border-afri-border pb-3">
                  <div>
                    <span className="text-xs text-afri-text-sec block font-bold font-mono">Auteur</span>
                    <strong className="text-sm font-sans font-black text-afri-text">{post.authorArtisticName || post.authorName}</strong>
                  </div>
                  <span className="text-[9px] font-mono uppercase text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                    Raison: {post.flagReason || "Contenu inacceptable"}
                  </span>
                </div>

                <p className="text-xs text-afri-text leading-relaxed bg-afri-bg/60 p-4 border border-afri-border rounded-xl font-sans">
                  {post.content}
                </p>

                <div className="flex gap-2">
                  {onUnflagPost && (
                    <button
                      onClick={() => handleUnflagPost(post.id)}
                      className="flex-1 py-2 rounded-xl bg-afri-bg-sec hover:bg-afri-bg-ter border border-afri-border text-afri-text font-mono font-bold text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      Approuver (Ignorer signalement)
                    </button>
                  )}
                  {onDeletePost && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="flex-1 py-2 rounded-xl bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 text-red-400 font-mono font-bold text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer la publication
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
