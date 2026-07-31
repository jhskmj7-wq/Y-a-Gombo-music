import React, { useState, useEffect } from "react";
import { Compass, BarChart3, TrendingUp, Lightbulb, History } from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { RoadmapItem, Poll, CrowdfundingCampaign, IdeaDraft } from "../../types";

export default function AfrigomboLabs() {
  useEffect(() => {
    console.log("[MODULE: AfrigomboLabs] Mounted");
    return () => console.log("[MODULE: AfrigomboLabs] Unmounted");
  }, []);

  const [activeTab, setActiveTab] = useState("roadmap");
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [cagnottes, setCagnottes] = useState<CrowdfundingCampaign[]>([]);
  const [ideas, setIdeas] = useState<IdeaDraft[]>([]);

  useEffect(() => {
    const unsubRoadmap = onSnapshot(query(collection(db, "roadmap"), orderBy("createdAt", "desc")), (snapshot) => {
        setRoadmap(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoadmapItem)));
    });
    return () => unsubRoadmap();
  }, []);

  const tabs = [
    { id: "roadmap", label: "Roadmap", icon: Compass },
    { id: "idees", label: "Idées", icon: Lightbulb },
    { id: "mur_idees", label: "Mur des Idées", icon: Lightbulb },
    { id: "votes", label: "Votes", icon: BarChart3 },
    { id: "cagnottes", label: "Cagnottes", icon: TrendingUp },
    { id: "historique", label: "Historique", icon: History },
  ];

  return (
    <div className="p-4 space-y-6 animate-fadeIn">
      <h1 className="text-xl font-black text-afri-text uppercase">🧪 Afrigombo Labs: L'avenir</h1>
      
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === tab.id ? "bg-afri-gold text-afri-bg" : "bg-afri-bg-sec text-afri-text-sec"}`}
            >
                <tab.icon className="w-4 h-4" />
                {tab.label}
            </button>
        ))}
      </div>

      <div className="bg-afri-bg-sec p-6 rounded-3xl border border-afri-border">
        {activeTab === "roadmap" && <div className="text-afri-text">Roadmap Content</div>}
        {activeTab === "idees" && <div className="text-afri-text">Idées Content</div>}
        {activeTab === "mur_idees" && <div className="text-afri-text">Mur des Idées (En construction)</div>}
        {activeTab === "votes" && <div className="text-afri-text">Votes Content</div>}
        {activeTab === "cagnottes" && <div className="text-afri-text">Cagnottes Content</div>}
        {activeTab === "historique" && <div className="text-afri-text">Historique Content</div>}
      </div>
    </div>
  );
}
