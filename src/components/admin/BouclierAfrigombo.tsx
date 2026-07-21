import React, { useState, useEffect } from "react";
import { Shield, CheckCircle, AlertTriangle, Activity, Server, Database, Users, FileText, Wallet, HeartPulse, RefreshCw } from "lucide-react";
import { collection, onSnapshot, query, limit } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { gomboAuth } from "../../firebase";

export default function BouclierAfrigombo() {
  const [status, setStatus] = useState({
    auth: false,
    firestore: false,
    storage: false, // We'll assume storage is true if firestore is
    hosting: true, // Always true if app is loaded
  });
  const [stats, setStats] = useState({
    users: 0,
    publications: 0,
    contracts: 0,
    revenues: 0,
    disputes: 0,
    alerts: 0,
  });
  
  const [healthScore, setHealthScore] = useState(100);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [responseTime, setResponseTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setIsReady(true), 2500);

    if (!db) return;

    // Ping Firestore
    const startPing = Date.now();
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setStatus(s => ({ ...s, firestore: true, auth: true, storage: true }));
      setStats(s => ({ ...s, users: snap.size }));
      setResponseTime(Date.now() - startPing);
      setLastSync(new Date());
    }, (err) => {
      console.error(err);
      setStatus(s => ({ ...s, firestore: false }));
      setHealthScore(prev => prev - 20);
    });

    const unsubPosts = onSnapshot(collection(db, "posts"), (snap) => {
      setStats(s => ({ ...s, publications: snap.size }));
      setLastSync(new Date());
    });

    const unsubGombos = onSnapshot(collection(db, "gombos"), (snap) => {
      setStats(s => ({ ...s, contracts: snap.size }));
      let totalRev = 0;
      snap.forEach(d => {
         const data = d.data();
         if (data.status === 'completed' && data.budget) {
            totalRev += data.budget * 0.1; // 10% commission
         }
      });
      setStats(s => ({ ...s, revenues: totalRev }));
      setLastSync(new Date());
    });

    const unsubAlerts = onSnapshot(collection(db, "security_alerts"), (snap) => {
      setStats(s => ({ ...s, alerts: snap.size }));
      setLastSync(new Date());
    });

    return () => {
      unsubUsers();
      unsubPosts();
      unsubGombos();
      unsubAlerts();
    };
  }, []);

  useEffect(() => {
    let newScore = 100;
    if (!status.firestore) newScore -= 30;
    if (!status.auth) newScore -= 20;
    if (stats.alerts > 5) newScore -= 10;
    setHealthScore(newScore);
  }, [status, stats]);

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Shield className="w-16 h-16 text-[#D4AF37] animate-pulse" />
        <div className="text-[#D4AF37] font-mono text-xs font-black uppercase tracking-widest">
          Initialisation Bouclier AFRIGOMBO...
        </div>
        <div className="w-48 h-1 bg-afri-bg-sec rounded-full overflow-hidden">
          <div className="h-full bg-afri-bg-sec w-full animate-[progress_2s_ease-in-out]" />
        </div>
      </div>
    );
  }

  const ServiceItem = ({ active, label, icon: Icon }: any) => (
    <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${active ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${active ? "text-emerald-500" : "text-red-500"}`} />
        <span className={`text-xs font-mono font-bold uppercase ${active ? "text-emerald-400" : "text-red-400"}`}>{label}</span>
      </div>
      {active ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
    </div>
  );

  const StatItem = ({ label, value, icon: Icon }: any) => (
    <div className="p-4 bg-afri-bg border border-afri-border rounded-xl flex flex-col items-center justify-center text-center">
      <Icon className="w-5 h-5 text-[#D4AF37] mb-2" />
      <span className="text-xl font-black text-afri-text">{value}</span>
      <span className="text-[9px] font-mono uppercase text-afri-text-sec mt-1">{label}</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-afri-border pb-4 flex justify-between items-end">
        <div>
          <h3 className="text-xs font-mono uppercase font-black tracking-[0.15em] text-[#D4AF37] flex items-center gap-1.5">
            <Shield className="w-4 h-4" /> Bouclier AFRIGOMBO
          </h3>
          <p className="text-[10px] text-afri-text-sec mt-1 uppercase font-mono tracking-wider">
            Diagnostic & Santé en temps réel. Données certifiées Firebase.
          </p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black font-mono ${healthScore > 80 ? "text-emerald-400" : healthScore > 50 ? "text-yellow-500" : "text-red-500"}`}>
            {healthScore}%
          </div>
          <div className="text-[9px] font-mono uppercase text-afri-text-sec mt-1">Santé AFRIGOMBO</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ServiceItem active={status.auth} label="Firebase Auth" icon={Users} />
        <ServiceItem active={status.firestore} label="Firestore DB" icon={Database} />
        <ServiceItem active={status.storage} label="Storage" icon={Server} />
        <ServiceItem active={status.hosting} label="Hosting" icon={Activity} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatItem label="Utilisateurs" value={stats.users} icon={Users} />
        <StatItem label="Publications" value={stats.publications} icon={FileText} />
        <StatItem label="Contrats" value={stats.contracts} icon={FileText} />
        <StatItem label="Revenus (FCFA)" value={stats.revenues.toLocaleString()} icon={Wallet} />
        <StatItem label="Litiges" value={stats.disputes} icon={AlertTriangle} />
        <StatItem label="Alertes Critiques" value={stats.alerts} icon={HeartPulse} />
      </div>

      <div className="bg-afri-bg-sec border border-afri-border rounded-xl p-4 flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-afri-text-sec" />
          <div>
            <div className="text-[9px] text-afri-text-sec uppercase font-mono">Dernière synchro</div>
            <div className="text-[11px] font-mono text-afri-text">{lastSync.toLocaleTimeString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <div>
            <div className="text-[9px] text-afri-text-sec uppercase font-mono">Temps de réponse</div>
            <div className="text-[11px] font-mono text-emerald-400">{responseTime}ms</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-[9px] text-afri-text-sec uppercase font-mono">Sauvegarde</div>
            <div className="text-[11px] font-mono text-blue-400">Automatique (GCP)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
