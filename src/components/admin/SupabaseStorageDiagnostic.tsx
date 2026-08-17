import React, { useState } from "react";
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  ShieldCheck,
  HardDrive,
  ExternalLink,
  Layers,
  FolderLock
} from "lucide-react";
import { supabaseStorage } from "../../lib/supabaseStorage";
import { SUPABASE_BUCKET_NAME, isSupabaseConfigured } from "../../lib/supabase";

export const SupabaseStorageDiagnostic: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    testUrl?: string;
    bucket?: string;
    details?: any;
    error?: string;
  } | null>(null);

  const configured = isSupabaseConfigured();
  const bucketName = SUPABASE_BUCKET_NAME;

  const handleRunDiagnostic = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await supabaseStorage.runStorageDiagnosticTest();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        bucket: bucketName,
        error: err?.message || "Échec imprévu du test de diagnostic",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-5 bg-afri-bg-sec border border-afri-border rounded-2xl space-y-5" id="supabase-storage-diagnostic-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-afri-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-afri-text uppercase tracking-wider flex items-center gap-2">
              Supabase Storage (Backend Médias)
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                configured ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              }`}>
                {configured ? "Connecté" : "Clés en attente"}
              </span>
            </h3>
            <p className="text-xs text-afri-text-sec">
              Stockage externe des photos, vidéos, audios et documents privés KYC
            </p>
          </div>
        </div>

        <button
          id="btn-run-supabase-diagnostic"
          onClick={handleRunDiagnostic}
          disabled={testing}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Test d'upload en cours...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Tester l'upload vers {bucketName}
            </>
          )}
        </button>
      </div>

      {/* Grid Configuration & Règles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-black/20 border border-afri-border/60 rounded-xl space-y-1.5">
          <span className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" /> Bucket Actif
          </span>
          <p className="text-xs font-mono font-bold text-afri-text truncate">
            {bucketName}
          </p>
          <span className="text-[10px] text-zinc-400 block">
            Fichiers publics & documents KYC
          </span>
        </div>

        <div className="p-3.5 bg-black/20 border border-afri-border/60 rounded-xl space-y-1.5">
          <span className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Sécurité Client
          </span>
          <p className="text-xs font-bold text-emerald-400">
            Publishable Key Uniquement
          </p>
          <span className="text-[10px] text-zinc-400 block">
            Aucune service_role key exposée
          </span>
        </div>

        <div className="p-3.5 bg-black/20 border border-afri-border/60 rounded-xl space-y-1.5">
          <span className="text-[10px] font-mono text-afri-text-sec uppercase tracking-wider block flex items-center gap-1.5">
            <FolderLock className="w-3.5 h-3.5 text-blue-400" /> Documents KYC
          </span>
          <p className="text-xs font-bold text-blue-400">
            Strictement Privés (Signed URLs)
          </p>
          <span className="text-[10px] text-zinc-400 block">
            kyc/&#123;userId&#125;/... non public
          </span>
        </div>
      </div>

      {/* Résultat du test */}
      {testResult && (
        <div className={`p-4 rounded-xl border ${
          testResult.success 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/10 border-red-500/30 text-red-300"
        } space-y-3`} id="supabase-test-result-box">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <span className="text-xs font-bold">
                {testResult.success 
                  ? `✅ Test réussi avec succès sur le bucket « ${testResult.bucket} » (Latence : ${testResult.latencyMs} ms)`
                  : `❌ Échec du test : ${testResult.error}`}
              </span>
            </div>
            {testResult.latencyMs !== undefined && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-black/30 rounded border border-current">
                {testResult.latencyMs} ms
              </span>
            )}
          </div>

          {testResult.success && testResult.testUrl && (
            <div className="flex items-center gap-3 pt-2 border-t border-emerald-500/20">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-500/40 shrink-0 bg-black flex items-center justify-center">
                <img src={testResult.testUrl} alt="Aperçu Test Supabase" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono text-zinc-300 block truncate">
                  URL générée : {testResult.testUrl}
                </span>
                <span className="text-[9px] text-emerald-400/80 block">
                  Le fichier temporaire de test a été automatiquement nettoyé du bucket après validation.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guide des chemins organisés */}
      <div className="p-3 bg-black/30 border border-afri-border/40 rounded-xl space-y-2">
        <span className="text-[10px] font-mono text-afri-gold uppercase tracking-wider flex items-center gap-1.5 font-bold">
          <Layers className="w-3.5 h-3.5" /> Arborescence Standardisée du Bucket « {bucketName} »
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-mono text-zinc-400">
          <div className="p-2 bg-black/20 rounded border border-white/5">
            <span className="text-emerald-400 font-bold block">profiles/&#123;userId&#125;/...</span>
            <span className="text-[9px] text-zinc-500">Photos de profil & avatars</span>
          </div>
          <div className="p-2 bg-black/20 rounded border border-white/5">
            <span className="text-emerald-400 font-bold block">publications/&#123;userId&#125;/...</span>
            <span className="text-[9px] text-zinc-500">Images de publications</span>
          </div>
          <div className="p-2 bg-black/20 rounded border border-white/5">
            <span className="text-emerald-400 font-bold block">audio/&#123;userId&#125;/...</span>
            <span className="text-[9px] text-zinc-500">Pistes audios & covers</span>
          </div>
          <div className="p-2 bg-black/20 rounded border border-white/5">
            <span className="text-emerald-400 font-bold block">video/&#123;userId&#125;/...</span>
            <span className="text-[9px] text-zinc-500">Extraits & vidéos</span>
          </div>
          <div className="p-2 bg-black/20 rounded border border-white/5">
            <span className="text-blue-400 font-bold block">kyc/&#123;userId&#125;/... (Privé)</span>
            <span className="text-[9px] text-zinc-500">Pièces d'identité & justificatifs</span>
          </div>
          <div className="p-2 bg-black/20 rounded border border-white/5">
            <span className="text-zinc-300 font-bold block">documents/&#123;userId&#125;/...</span>
            <span className="text-[9px] text-zinc-500">Contrats & fichiers PDF</span>
          </div>
        </div>
      </div>
    </div>
  );
};
