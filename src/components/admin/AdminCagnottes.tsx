import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Pin, Search, Trash2, Edit3, Save, RefreshCw, HandCoins, Plus } from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { CrowdfundingCampaign } from "../../types";
import { AfriModal } from "../common/AfriModal";

interface AdminCagnottesProps {
  audioSynth?: any;
}

export default function AdminCagnottes({ audioSynth }: AdminCagnottesProps) {
  const [cagnottes, setCagnottes] = useState<CrowdfundingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    console.log("Loading cagnottes...");
    const q = query(collection(db, "cagnottes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      console.log("Cagnottes snapshot received, size:", snap.size);
      const data: CrowdfundingCampaign[] = [];
      snap.forEach(d => {
        const item = { id: d.id, ...d.data() } as CrowdfundingCampaign;
        data.push(item);
      });
      setCagnottes(data);
      setLoading(false);
    }, (err) => {
      console.error("Erreur chargement cagnottes:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6 text-left font-sans text-afri-text p-4 sm:p-6 bg-afri-bg-sec/30 rounded-3xl border border-afri-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-3xl bg-gradient-to-r from-afri-bg-sec via-afri-bg-sec to-afri-bg border border-[#D4AF37]/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-2xl text-[#D4AF37]">
            <HandCoins className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black uppercase text-afri-text tracking-wider">
                ADMINISTRATION — CAGNOTTES
              </h2>
            </div>
            <p className="text-xs text-afri-text-sec">
              Gestion du Crowdfunding et des appels de fonds solidaires.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => {
            // Placeholder: functionality to be added. Must not be empty.
            alert("Nouvelle cagnotte: fonctionnalité de création bientôt intégrée.");
          }}
          className="px-4 py-2 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#b8952b] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Cagnotte</span>
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center bg-afri-bg border border-afri-border rounded-2xl text-afri-text-sec text-xs font-mono">
            Chargement des cagnottes...
          </div>
        ) : cagnottes.length === 0 ? (
          <div className="p-8 text-center bg-afri-bg border border-afri-border rounded-2xl text-afri-text-sec text-xs font-mono">
            Aucune cagnotte active pour le moment.
          </div>
        ) : (
          cagnottes.map(c => (
            <div key={c.id} className="p-4 bg-afri-bg border border-afri-border rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="font-bold">{c.title}</h3>
                <p className="text-xs text-afri-text-sec mt-1">Objectif: {c.goal} FCFA</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => alert(`Éditer cagnotte ${c.id}`)}
                  className="text-afri-text-sec hover:text-white p-2"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => alert(`Supprimer cagnotte ${c.id}`)}
                  className="text-rose-500 hover:text-rose-400 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
