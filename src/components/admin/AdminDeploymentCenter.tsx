import React, { useState, useEffect } from "react";
import { Rocket, Layers, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { doc, onSnapshot, setDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Feature, DeploymentVersion } from "../../types";

export default function AdminDeploymentCenter() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [versions, setVersions] = useState<DeploymentVersion[]>([]);

  useEffect(() => {
    const unsubFeatures = onSnapshot(collection(db, "features"), (snap) => {
      setFeatures(snap.docs.map(d => ({ id: d.id, ...d.data() } as Feature)));
    });
    
    const unsubVersions = onSnapshot(query(collection(db, "deployment_versions"), orderBy("createdAt", "desc")), (snap) => {
      setVersions(snap.docs.map(d => ({ id: d.id, ...d.data() } as DeploymentVersion)));
    });

    return () => { unsubFeatures(); unsubVersions(); };
  }, []);

  const updateFeatureState = async (id: string, newState: Feature["state"]) => {
     await setDoc(doc(db, "features", id), { state: newState, updatedAt: new Date().toISOString() }, { merge: true });
  };

  const deployVersion = async (version: DeploymentVersion) => {
      await setDoc(doc(db, "deployment_versions", version.id), { state: "deployed" }, { merge: true });
  };

  return (
    <div className="space-y-6 pb-20 p-4 text-afri-text font-sans">
      <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-2xl text-[#D4AF37]">
            <Rocket className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-afri-text tracking-wider">
              🚀 Centre de Déploiement
            </h2>
          </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase text-[#D4AF37]">Fonctionnalités & Feature Flags</h2>
        {features.map(f => (
          <div key={f.id} className="bg-afri-bg p-4 rounded-2xl border border-afri-border shadow-sm">
             <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-sm">{f.name}</p>
                  <p className="text-[10px] text-afri-text-sec">{f.description}</p>
                </div>
                <div className="text-[9px] font-mono px-2 py-1 rounded-lg bg-afri-bg-sec border border-afri-border">v{f.version}</div>
             </div>
             <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1 bg-afri-bg-sec rounded-xl p-1">
                    <button onClick={() => updateFeatureState(f.id, 'development')} className={`px-2 py-1 rounded-lg text-[9px] font-bold ${f.state === 'development' ? 'bg-zinc-500 text-white' : 'text-afri-text-sec'}`}>🛠 Dev</button>
                    <button onClick={() => updateFeatureState(f.id, 'beta_founder')} className={`px-2 py-1 rounded-lg text-[9px] font-bold ${f.state === 'beta_founder' ? 'bg-amber-500 text-white' : 'text-afri-text-sec'}`}>🟡 Bêta</button>
                    <button onClick={() => updateFeatureState(f.id, 'public')} className={`px-2 py-1 rounded-lg text-[9px] font-bold ${f.state === 'public' ? 'bg-emerald-500 text-white' : 'text-afri-text-sec'}`}>🟢 Public</button>
                </div>
                {f.state === 'beta_founder' && (
                  <button onClick={() => updateFeatureState(f.id, 'public')} className="bg-[#D4AF37] text-black text-[9px] font-black px-3 py-1.5 rounded-xl hover:bg-[#b8952b]">
                     🚀 Déployer
                  </button>
                )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
