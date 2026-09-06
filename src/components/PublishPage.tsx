import React, { useState, useEffect } from "react";
import GomboPublish from "./GomboPublish";
import AudioPublishForm from "./AudioPublishForm";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { Briefcase, Music, FileText, Plus, Trash2, ArrowRight } from "lucide-react";
import { db } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function PublishPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [publishMode, setPublishMode] = useState<"gombo" | "audio">("gombo");
  const [step, setStep] = useState<"checking" | "choice" | "list" | "form">("checking");
  const [userDrafts, setUserDrafts] = useState<any[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<any>(null);

  // Check for active drafts in LocalStorage and Firestore
  useEffect(() => {
    if (!profile?.uid) return;

    let foundDrafts: any[] = [];
    try {
      const local = localStorage.getItem("gombo_publish_draft_v2") || localStorage.getItem("gombo_publish_draft");
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && (parsed.title || parsed.description || parsed.budget)) {
          foundDrafts.push({
            id: "local_draft",
            title: parsed.title || "Brouillon Local",
            description: parsed.description || "",
            budget: parsed.budget || "0",
            date: parsed.date || "",
            savedAt: parsed.savedAt || new Date().toISOString(),
            ...parsed
          });
        }
      }
    } catch (e) {
      console.warn("Local draft parse error:", e);
    }

    // Fetch Firestore drafts
    getDocs(query(collection(db, "gombos"), where("userId", "==", profile.uid), where("status", "==", "draft")))
      .then((snap) => {
        snap.forEach((d) => {
          const data = d.data();
          // Avoid duplicate if already in local
          if (!foundDrafts.some(f => f.id === d.id)) {
            foundDrafts.push({ id: d.id, ...data });
          }
        });
        setUserDrafts(foundDrafts);
        if (foundDrafts.length > 0) {
          setStep("choice");
        } else {
          setStep("form");
        }
      })
      .catch((err) => {
        console.warn("Could not fetch Firestore drafts:", err);
        setUserDrafts(foundDrafts);
        setStep(foundDrafts.length > 0 ? "choice" : "form");
      });
  }, [profile?.uid]);

  const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (draftId.startsWith("local")) {
      localStorage.removeItem("gombo_publish_draft_v2");
      localStorage.removeItem("gombo_publish_draft");
    } else {
      try {
        await deleteDoc(doc(db, "gombos", draftId));
      } catch (err) {
        console.error("Error deleting draft:", err);
      }
    }
    const updated = userDrafts.filter(d => d.id !== draftId);
    setUserDrafts(updated);
    if (updated.length === 0) {
      setStep("form");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-afri-bg-sec text-afri-text py-6 px-4">
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-center gap-3">
        <button
          onClick={() => {
            setPublishMode("gombo");
            if (userDrafts.length > 0) {
              setStep("choice");
            } else {
              setStep("form");
            }
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase transition cursor-pointer border ${
            publishMode === "gombo"
              ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg"
              : "bg-afri-bg text-afri-text-sec border-afri-border hover:text-afri-text"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Publier un Gombo
        </button>
        <button
          onClick={() => {
            setPublishMode("audio");
            setStep("form");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase transition cursor-pointer border ${
            publishMode === "audio"
              ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-lg"
              : "bg-afri-bg text-afri-text-sec border-afri-border hover:text-afri-text"
          }`}
        >
          <Music className="w-4 h-4" />
          Publier un Audio
        </button>
      </div>

      {!profile ? (
        <div className="flex justify-center items-center h-[50vh] text-afri-text-sec">
          Chargement du profil...
        </div>
      ) : publishMode === "audio" ? (
        <AudioPublishForm
          currentUserProfile={profile}
          onSuccess={() => navigate("/home")}
          onCancel={() => navigate(-1)}
        />
      ) : step === "checking" ? (
        <div className="flex justify-center items-center h-[40vh] text-afri-text-sec text-xs font-mono">
          Vérification des brouillons en cours...
        </div>
      ) : step === "choice" ? (
        <div className="max-w-lg mx-auto bg-afri-bg p-6 rounded-3xl border border-afri-border shadow-xl space-y-5 text-center mt-8">
          <div className="w-12 h-12 bg-[#D4AF37]/15 rounded-2xl flex items-center justify-center mx-auto text-[#D4AF37] border border-[#D4AF37]/30">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-black uppercase font-display text-afri-text">
              Brouillons de Gombo détectés
            </h2>
            <p className="text-xs text-afri-text-sec">
              Vous avez {userDrafts.length} brouillon(s) enregistré(s) non publié(s). Souhaitez-vous le(s) reprendre ou créer une nouvelle publication ?
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => setStep("list")}
              className="w-full py-3.5 px-4 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Voir mes brouillons ({userDrafts.length})
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            <button
              onClick={() => {
                setSelectedDraft(null);
                setStep("form");
              }}
              className="w-full py-3.5 px-4 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text border border-afri-border rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              Créer une nouvelle publication
            </button>
          </div>
        </div>
      ) : step === "list" ? (
        <div className="max-w-xl mx-auto space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-[#D4AF37]">Vos Brouillons Enregistrés</h2>
            <button
              onClick={() => setStep("choice")}
              className="text-xs text-afri-text-sec hover:text-afri-text underline cursor-pointer"
            >
              ← Retour
            </button>
          </div>

          <div className="space-y-3">
            {userDrafts.map((draft) => (
              <div
                key={draft.id}
                onClick={() => {
                  setSelectedDraft(draft);
                  setStep("form");
                }}
                className="p-4 bg-afri-bg hover:bg-afri-bg-ter border border-afri-border/80 hover:border-[#D4AF37]/50 rounded-2xl transition cursor-pointer flex items-center justify-between group shadow-sm"
              >
                <div className="space-y-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-md uppercase font-bold">
                      {draft.type || draft.selectedType || "Gombo"}
                    </span>
                    <span className="text-xs text-afri-text-sec">
                      {draft.date ? `📅 ${draft.date}` : ""}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-afri-text truncate">
                    {draft.title || "Gombo sans titre"}
                  </h3>
                  <p className="text-[11px] text-afri-text-sec truncate max-w-sm">
                    {draft.description || "Aucune description..."}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs font-bold text-[#D4AF37]">
                    {Number(draft.budget || 0).toLocaleString("fr-FR")} FCFA
                  </span>
                  <button
                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                    title="Supprimer ce brouillon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setSelectedDraft(null);
              setStep("form");
            }}
            className="w-full py-3 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 rounded-2xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <Plus className="w-4 h-4" />
            Créer une nouvelle publication vierge
          </button>
        </div>
      ) : (
        <GomboPublish
          currentUserProfile={profile}
          initialDraft={selectedDraft}
          onSuccess={() => navigate("/home")}
          onCancel={() => {
            if (userDrafts.length > 0) {
              setStep("choice");
            } else {
              navigate(-1);
            }
          }}
        />
      )}
    </div>
  );
}

