import React from "react";
import { motion } from "motion/react";
import { Star, Award } from "lucide-react";
import { User } from "../../types";

const IVORIAN_COMMUNES = [
  "Cocody", "Yopougon", "Marcory", "Plateau", "Treichville", 
  "Port-Bouët", "Koumassi", "Adjamé", "Abobo", "Bingerville"
];

interface AdminUsersProps {
  activeMenu: string;
  users: User[];
  filteredUsers: User[];
  reviews: any[];
  kycActiveTab: "standard" | "express" | "approved" | "rejected" | "info_required" | "all";
  setKycActiveTab: React.Dispatch<React.SetStateAction<"standard" | "express" | "approved" | "rejected" | "info_required" | "all">>;
  editingProfileUserId: string | null;
  setEditingProfileUserId: React.Dispatch<React.SetStateAction<string | null>>;
  profileForm: any;
  setProfileForm: React.Dispatch<React.SetStateAction<any>>;
  specInput: string;
  setSpecInput: React.Dispatch<React.SetStateAction<string>>;
  groupInput: string;
  setGroupInput: React.Dispatch<React.SetStateAction<string>>;
  addSpecialty: () => void;
  removeSpecialty: (index: number) => void;
  addGroup: () => void;
  removeGroup: (index: number) => void;
  saveProfileEditing: () => void;
  handleApproveKYC: (userId: string, express?: boolean) => void;
  handleRejectKYC: (userId: string) => void;
  handleComplementaryInfoKYC: (userId: string, message: string) => void;
  startEditingProfile: (user: User) => void;
  infoMessages: Record<string, string>;
  setInfoMessages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function AdminUsers({
  activeMenu,
  users,
  filteredUsers,
  reviews,
  kycActiveTab,
  setKycActiveTab,
  editingProfileUserId,
  setEditingProfileUserId,
  profileForm,
  setProfileForm,
  specInput,
  setSpecInput,
  groupInput,
  setGroupInput,
  addSpecialty,
  removeSpecialty,
  addGroup,
  removeGroup,
  saveProfileEditing,
  handleApproveKYC,
  handleRejectKYC,
  handleComplementaryInfoKYC,
  startEditingProfile,
  infoMessages,
  setInfoMessages,
}: AdminUsersProps) {
  return (
    <div className="space-y-6">
      {/* SLOGAN & PROFILE SEARCH */}
      <div className="flex justify-between items-center bg-[#D4AF37]/5 p-5 border border-[#D4AF37]/10 rounded-lg text-left">
        <div>
          <h4 className="text-md font-display font-bold text-[#D4AF37]">
            ⚜️ Gestion d'Héritage Musical & Gombo ID
          </h4>
          <p className="text-xs text-[#F5F5F5]/60 italic font-mono mt-0.5">
            "🎼 Ton héritage attire les gombos."
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            id="kyc-tab-all"
            onClick={() => setKycActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "all" ? "bg-[#D4AF37] text-black font-bold" : "border border-[#D4AF37]/20 text-[#D4AF37]/80 hover:bg-[#D4AF37]/5"}`}
          >
            👥 Tous ({users.length})
          </button>
          <button
            id="kyc-tab-standard"
            onClick={() => setKycActiveTab("standard")}
            className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "standard" ? "bg-[#D4AF37] text-black font-bold" : "border border-[#D4AF37]/20 text-[#D4AF37]/80 hover:bg-[#D4AF37]/5"}`}
          >
            Standard ({users.filter(u => u.kycStatus === "pending" && u.kycType !== "express").length})
          </button>
          <button
            id="kyc-tab-express"
            onClick={() => setKycActiveTab("express")}
            className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "express" ? "bg-cyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]" : "border border-cyan-500/20 text-cyan-400/80 hover:bg-cyan-500/5"}`}
          >
            ⚡ Express ({users.filter(u => u.kycStatus === "pending" && u.kycType === "express").length})
          </button>
          <button
            id="kyc-tab-approved"
            onClick={() => setKycActiveTab("approved")}
            className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "approved" ? "bg-emerald-500 text-black font-bold" : "border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5"}`}
          >
            Validées ({users.filter(u => u.kycStatus === "approved").length})
          </button>
          <button
            id="kyc-tab-rejected"
            onClick={() => setKycActiveTab("rejected")}
            className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "rejected" ? "bg-red-500 text-white font-bold" : "border border-red-500/20 text-red-400 hover:bg-red-500/5"}`}
          >
            Refusées ({users.filter(u => u.kycStatus === "rejected").length})
          </button>
          <button
            id="kyc-tab-info"
            onClick={() => setKycActiveTab("info_required")}
            className={`px-3 py-1.5 text-xs font-mono uppercase rounded ${kycActiveTab === "info_required" ? "bg-amber-500 text-black font-bold" : "border border-amber-500/20 text-amber-400 hover:bg-amber-500/5"}`}
          >
            Infos Requises ({users.filter(u => u.kycStatus === "info_required").length})
          </button>
        </div>
      </div>

      {/* ACTIVE CONFIGURATION PROFILE MODIFIER (PHASE 5) */}
      {editingProfileUserId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-lg bg-[#050505] border border-[#D4AF37] space-y-4 text-left"
        >
          <div className="flex justify-between items-center border-b border-[#D4AF37]/20 pb-3">
            <h4 className="text-sm font-display font-bold text-[#D4AF37] uppercase tracking-wider">
              Editer Héritage Musical & Performance
            </h4>
            <span className="text-[10px] uppercase font-mono text-[#D4AF37] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
              Sauvegarde Automatique active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Nom Artistique</label>
              <input
                type="text"
                value={profileForm.artisticName || ""}
                onChange={(e) => setProfileForm((prev: any) => ({ ...prev, artisticName: e.target.value }))}
                className="w-full bg-[#050505] border border-[#D4AF37]/20 rounded p-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Commune</label>
              <select
                value={profileForm.commune || ""}
                onChange={(e) => setProfileForm((prev: any) => ({ ...prev, commune: e.target.value }))}
                className="w-full bg-[#050505] border border-[#D4AF37]/20 rounded p-2 text-xs text-white"
              >
                {IVORIAN_COMMUNES.map(com => (
                  <option key={com} value={com}>{com}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Niveau de Profil (1 - 5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={profileForm.level || 1}
                onChange={(e) => setProfileForm((prev: any) => ({ ...prev, level: Number(e.target.value) }))}
                className="w-full bg-[#050505] border border-[#D4AF37]/20 rounded p-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Score de Progression (0 - 100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={profileForm.score || 0}
                onChange={(e) => setProfileForm((prev: any) => ({ ...prev, score: Number(e.target.value) }))}
                className="w-full bg-[#050505] border border-[#D4AF37]/20 rounded p-2 text-xs text-white"
              />
            </div>

            {/* SPECIALTIES TAGS */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Spécialités</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={specInput}
                  onChange={(e) => setSpecInput(e.target.value)}
                  placeholder="Créer une spécialité..."
                  className="flex-1 bg-[#050505] border border-[#D4AF37]/20 rounded p-2 text-xs text-white"
                />
                <button
                  onClick={addSpecialty}
                  className="px-3 bg-[#D4AF37] text-black rounded text-xs cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profileForm.specialties?.map((spec: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 text-[10px] rounded bg-[#D4AF37]/10 text-[#D4AF37] font-mono flex items-center gap-1.5">
                    {spec}
                    <button onClick={() => removeSpecialty(i)} className="text-[#EF4444] font-bold cursor-pointer">&times;</button>
                  </span>
                ))}
              </div>
            </div>

            {/* GROUPS */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase text-[#F5F5F5]/60 font-mono">Groupes</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={groupInput}
                  onChange={(e) => setGroupInput(e.target.value)}
                  placeholder="Nom du groupe..."
                  className="flex-1 bg-[#050505] border border-[#D4AF37]/20 rounded p-2 text-xs text-white"
                />
                <button
                  onClick={addGroup}
                  className="px-3 bg-[#D4AF37] text-black rounded text-xs cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profileForm.groups?.map((grp: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 text-[10px] rounded bg-[#D4AF37]/10 text-[#D4AF37] font-mono flex items-center gap-1.5">
                    {grp}
                    <button onClick={() => removeGroup(i)} className="text-[#EF4444] font-bold cursor-pointer">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-3">
            <button
              onClick={() => setEditingProfileUserId(null)}
              className="px-4 py-2 border border-[#D4AF37]/20 text-xs rounded hover:bg-[#D4AF37]/5 transition-all uppercase cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={saveProfileEditing}
              className="px-5 py-2 bg-[#D4AF37] text-black text-xs font-semibold rounded hover:bg-[#B48F17] transition-all uppercase cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </motion.div>
      )}

      {/* PROFILES & CERTIFICATION REQUESTS LIST */}
      <div className="space-y-3 text-left">
        {filteredUsers
          .filter(u => {
            if (kycActiveTab === "standard") return u.kycStatus === "pending" && u.kycType !== "express";
            if (kycActiveTab === "express") return u.kycStatus === "pending" && u.kycType === "express";
            if (kycActiveTab === "approved") return u.kycStatus === "approved";
            if (kycActiveTab === "rejected") return u.kycStatus === "rejected";
            if (kycActiveTab === "info_required") return u.kycStatus === "info_required";
            return true;
          })
          .map(user => (
            <div key={user.id} className="p-5 rounded-lg border border-[#D4AF37]/25 bg-[#050505] space-y-4">
              <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-[#D4AF37] bg-black flex items-center justify-center font-bold text-[#D4AF37] text-lg shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      user.artisticName?.charAt(0) || user.name?.charAt(0) || "A"
                    )}
                  </div>
                  <div>
                    <h5 className="font-display font-semibold text-md text-[#F5F5F5] flex flex-wrap items-center gap-2">
                      {user.artisticName}
                      {user.isCertified && (
                        <span className="text-[9px] bg-[#D4AF37] text-black px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                          Elite Certifié
                        </span>
                      )}
                      {user.kycStatus === "pending" && (
                        <span className="text-[9px] bg-cyan-500 text-black px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                          {user.kycType === "express" ? "⚡ Express Prioritaire" : "⏳ File Standard"}
                        </span>
                      )}
                      {user.kycStatus === "info_required" && (
                        <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                          ↺ Infos Requises
                        </span>
                      )}
                      {user.kycStatus === "rejected" && (
                        <span className="text-[9px] bg-red-500/20 border border-red-500/30 text-red-500 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                          🚫 Refusé
                        </span>
                      )}
                    </h5>
                    <p className="text-xs text-[#F5F5F5]/60 mt-0.5">
                      {user.name} • Commune : <strong className="text-white">{user.commune}</strong> • Inscrit le : {user.registrationDate || "N/A"}
                    </p>
                    
                    {/* Render dynamic client star ratings for the musician */}
                    {(() => {
                      const artistReviews = reviews.filter(r => r.revieweeId === user.id && r.type === "client_to_musician");
                      const avgRating = artistReviews.length > 0 
                        ? parseFloat((artistReviews.reduce((sum, r) => sum + r.rating, 0) / artistReviews.length).toFixed(1))
                        : 5.0;
                      const hasReviews = artistReviews.length > 0;
                      return (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star 
                                key={star} 
                                className={`w-3.5 h-3.5 ${star <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-white/10"}`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono font-bold text-amber-300">
                            {avgRating.toFixed(1)} / 5.0
                          </span>
                          <span className="text-[9px] text-[#F5F5F5]/40 font-mono">
                            ({hasReviews ? `${artistReviews.length} avis` : "Pas encore d'évaluations"})
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Main permanent ID display if approved */}
                {user.gomboIdNumber && (
                  <div className="flex flex-col items-start lg:items-end shrink-0">
                    <span className="text-[8px] font-mono uppercase text-[#D4AF37] font-semibold tracking-widest">Identifiant GOMBO ID</span>
                    <span className="font-mono text-xs font-bold text-white bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-2.5 py-0.5 rounded mt-1">
                      {user.gomboIdNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Documents Preview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/40 border border-white/5 p-4 rounded-xl">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono text-[#D4AF37]/60 block font-semibold">1. Pièce d'Identité</span>
                  {user.kycDocs?.identityCardUrl ? (
                    <a
                      href={user.kycDocs.identityCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#D4AF37] hover:underline font-mono block truncate"
                    >
                      Voir la Pièce Libre ↗
                    </a>
                  ) : (
                    <span className="text-xs text-white/30 italic">Aucune pièce (Simulation active)</span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono text-[#D4AF37]/60 block font-semibold">2. Selfie de Contrôle</span>
                  {user.kycDocs?.selfieUrl ? (
                    <a
                      href={user.kycDocs.selfieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#D4AF37] hover:underline font-mono block truncate"
                    >
                      Voir le Selfie Libre ↗
                    </a>
                  ) : (
                    <span className="text-xs text-white/30 italic">Aucun selfie (Simulation active)</span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono text-[#D4AF37]/60 block font-semibold">3. Preuve Musicale</span>
                  {user.kycDocs?.activityUrl || user.kycDocUrl ? (
                    <a
                      href={user.kycDocs?.activityUrl || user.kycDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#D4AF37] hover:underline font-mono block truncate"
                    >
                      Voir la Preuve en Ligne ↗
                    </a>
                  ) : (
                    <span className="text-xs text-white/30 italic">Aucune preuve (Simulation active)</span>
                  )}
                </div>
              </div>

              {/* Complementary requested text note if applicable */}
              {user.kycStatus === "info_required" && user.kycComplementaryInfo && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs">
                  <span className="font-bold text-amber-400 block font-mono text-[10px] uppercase">↺ Message d'information demandée :</span>
                  <p className="text-white/80 mt-1 italic">"{user.kycComplementaryInfo}"</p>
                </div>
              )}

              {/* Administrative Actions */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-t border-white/5 pt-4">
                <div className="flex flex-wrap gap-2">
                  {user.kycStatus !== "approved" && (
                    <button
                      onClick={() => handleApproveKYC(user.id, user.kycType === "express")}
                      className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-[10px] uppercase px-3 py-1.5 rounded transition-all cursor-pointer"
                    >
                      {user.kycType === "express" ? "Certifier (⚡ Express)" : "Certifier le Talent"}
                    </button>
                  )}
                  
                  {user.kycStatus !== "rejected" && (
                    <button
                      onClick={() => handleRejectKYC(user.id)}
                      className="bg-[#EF4444]/20 border border-[#EF4444]/30 hover:bg-[#EF4444]/40 text-[#EF4444] font-semibold text-[10px] uppercase px-3 py-1.5 rounded transition-all cursor-pointer"
                    >
                      Refuser Dossier
                    </button>
                  )}

                  <button
                    onClick={() => startEditingProfile(user)}
                    className="bg-transparent border border-white/10 hover:border-[#D4AF37] text-white hover:text-[#D4AF37] text-[10px] uppercase font-mono px-3 py-1.5 rounded transition-all cursor-pointer"
                  >
                    Éditer Profil
                  </button>
                </div>

                {/* Direct Complementary Info Request Input */}
                {user.kycStatus !== "approved" && (
                  <div className="w-full md:max-w-md flex gap-2">
                    <input
                      type="text"
                      placeholder="Motif d'information manquante..."
                      value={infoMessages[user.id] || ""}
                      onChange={(e) => setInfoMessages((prev: any) => ({ ...prev, [user.id]: e.target.value }))}
                      className="flex-1 bg-black border border-white/15 focus:border-[#D4AF37] focus:outline-none rounded p-1.5 text-xs text-white"
                    />
                    <button
                      onClick={() => {
                        handleComplementaryInfoKYC(user.id, infoMessages[user.id] || "");
                        setInfoMessages((prev: any) => ({ ...prev, [user.id]: "" }));
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-[10px] uppercase px-3 py-1.5 rounded cursor-pointer shrink-0"
                    >
                      Demander Infos
                    </button>
                  </div>
                )}
              </div>

              {/* PROFILE PROGRESS BAR SLITS */}
              <div className="p-3.5 bg-white/5 border border-white/5 rounded grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#F5F5F5]/50 block">Spécialités de l'artiste</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(user.specialties || []).map((spec: string, idx: number) => (
                      <span key={idx} className="bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded text-[10px] font-mono">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                    <span className="uppercase text-[#F5F5F5]/50 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Niveau de Profil
                    </span>
                    <span className="font-bold text-[#D4AF37]">Niv. {user.performance?.level || 1} (Score: {user.performance?.score || 0}/100)</span>
                  </div>
                  {/* Glowing horizontal premium gold progress bar */}
                  <div className="w-full bg-[#D4AF37]/10 rounded-full h-2 overflow-hidden border border-[#D4AF37]/10">
                    <div
                      className="bg-gradient-to-r from-[#D4AF37] to-[#B48F17] h-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                      style={{ width: `${user.performance?.score || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* WRITTEN FEEDBACK AND REVIEWS DISPLAY PANEL */}
              {(() => {
                const artistReviews = reviews.filter(r => r.revieweeId === user.id);
                if (artistReviews.length === 0) return null;
                return (
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                    <span className="text-[10px] font-mono uppercase font-black text-[#D4AF37] block tracking-widest text-left">
                      💬 Témoignages & Évaluations du Réseau ({artistReviews.length})
                    </span>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin text-left">
                      {artistReviews.map(rev => (
                        <div key={rev.id} className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1.5 animate-fadeIn">
                          <div className="flex justify-between items-center flex-wrap gap-2 text-[10px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-white">{rev.reviewerName}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] font-mono">
                                {rev.type === "client_to_musician" ? "Client ➜ Musicien" : "Musicien ➜ Client"}
                              </span>
                            </div>
                            <span className="text-zinc-500 font-mono text-[9px]">{rev.timestamp.split("T")[0]}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} className={`w-3 h-3 ${star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-white/20"}`} />
                            ))}
                          </div>

                          <p className="text-xs text-[#F5F5F5]/85 italic leading-relaxed">
                            "{rev.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
      </div>
    </div>
  );
}
