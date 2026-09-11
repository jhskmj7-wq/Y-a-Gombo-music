import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Award, 
  Search, 
  ExternalLink, 
  ArrowLeft, 
  Share2, 
  Copy, 
  Check, 
  Lock, 
  Sparkles, 
  QrCode,
  Calendar,
  MapPin,
  Music,
  User as UserIcon,
  RefreshCw
} from "lucide-react";
import { getPublicGomboVerification, PublicGomboVerification } from "../services/verificationService";
import { formatGomboIdDisplay } from "../lib/gomboIdHelper";

export default function GomboVerificationPage() {
  const { gomboId: urlGomboId } = useParams<{ gomboId?: string }>();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(urlGomboId || "");
  const [activeGomboId, setActiveGomboId] = useState(urlGomboId || "");
  const [loading, setLoading] = useState(Boolean(urlGomboId));
  const [verification, setVerification] = useState<PublicGomboVerification | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchVerification = async (id: string) => {
    if (!id.trim()) {
      setVerification(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await getPublicGomboVerification(id);
      setVerification(result);
    } catch (err) {
      console.error("Verification query error:", err);
      setVerification({
        exists: false,
        isValid: false,
        gomboId: id,
        artistName: "",
        statusLabel: "ERREUR DE SERVEUR",
        verificationLevel: "",
        trustScore: 0,
        certifiedAt: "",
        commune: "",
        discipline: ""
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlGomboId) {
      setActiveGomboId(urlGomboId);
      setSearchInput(urlGomboId);
      fetchVerification(urlGomboId);
    } else {
      setLoading(false);
    }
  }, [urlGomboId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (!clean) return;
    const formatted = formatGomboIdDisplay(clean);
    navigate(`/verification/${formatted}`, { replace: true });
    setActiveGomboId(formatted);
    fetchVerification(formatted);
  };

  const handleCopyId = () => {
    if (!verification?.gomboId) return;
    try {
      navigator.clipboard.writeText(verification.gomboId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (_) {}
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col justify-between selection:bg-[#D4AF37]/30 selection:text-white font-sans">
      
      {/* 1. TOP INSTITUTIONAL BAR */}
      <header className="border-b border-[#D4AF37]/20 bg-[#0B0B0E]/90 backdrop-blur-md sticky top-0 z-30 px-4 py-3.5 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <Link 
            to="/home" 
            className="flex items-center gap-2 text-[#D4AF37] hover:text-amber-400 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center font-display font-black text-sm text-[#D4AF37]">
              AG
            </div>
            <div>
              <span className="font-display font-black text-sm tracking-wider uppercase text-white block leading-none">
                AFRIGOMBO
              </span>
              <span className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-widest block mt-0.5">
                Commission d'Authenticité
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              SOUVERAINETÉ ARTISTIQUE
            </span>
            <Link
              to="/home"
              className="text-xs font-mono text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Accueil</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-10 space-y-6">
        
        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PORTAIL OFFICIEL DE CONTRÔLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white uppercase">
            VÉRIFICATION DU GOMBO ID
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed font-sans">
            Contrôle cryptographique et attestation en temps réel de l'identité officielle des artistes homologués.
          </p>
        </div>

        {/* Search Bar for manual entry */}
        <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
            <input 
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              placeholder="Ex: GMB-I4Z-TPJ ou GMB-XXX-XXX"
              className="w-full pl-10 pr-4 py-3 bg-[#121215] border border-[#D4AF37]/30 rounded-2xl text-xs sm:text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D4AF37] transition shadow-inner"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="px-5 py-3 bg-[#D4AF37] hover:bg-amber-500 active:scale-98 text-black font-mono font-bold text-xs uppercase rounded-2xl transition cursor-pointer flex items-center gap-1.5 shadow-md"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Vérifier</span>}
          </button>
        </form>

        {/* LOADING STATE */}
        {loading && (
          <div className="p-8 sm:p-12 rounded-3xl border border-[#D4AF37]/20 bg-[#121215] text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-mono font-bold uppercase text-[#D4AF37]">
                Recherche dans le registre souverain...
              </h3>
              <p className="text-xs text-zinc-500 font-sans">
                Interrogation des registres cryptographiques AFRIGOMBO
              </p>
            </div>
          </div>
        )}

        {/* RESULT: WHEN VERIFICATION IS AVAILABLE */}
        {!loading && verification && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* SCENARIO 1: VALID AND AUTHENTIC GOMBO ID */}
            {verification.exists && verification.isValid && (
              <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/60 bg-gradient-to-b from-[#101915] via-[#121216] to-[#0A0A0D] p-6 sm:p-8 shadow-[0_10px_40px_rgba(16,185,129,0.15)] space-y-6">
                
                {/* Decorative badge header */}
                <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-mono tracking-widest font-black text-emerald-400 uppercase">
                      ✓ GOMBO ID AUTHENTIFIÉ
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-wider">
                    ✓ CERTIFICATION VALIDE
                  </span>
                </div>

                {/* Artist Centerpiece */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-[#D4AF37] bg-black/60 flex items-center justify-center font-bold text-3xl text-[#D4AF37] overflow-hidden shrink-0 shadow-lg">
                    {verification.avatarUrl ? (
                      <img 
                        src={verification.avatarUrl} 
                        alt={verification.artistName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      verification.artistName.charAt(0) || "A"
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">
                      TITULAIRE DE L'IDENTIFIANT
                    </span>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-tight">
                      {verification.artistName}
                    </h2>
                    {verification.realName && (
                      <p className="text-xs text-zinc-400 font-sans">
                        Identité civile : {verification.realName}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/70 border border-[#D4AF37]/50 rounded-xl font-mono text-sm font-black text-[#D4AF37]">
                        <span>ID :</span>
                        <span className="tracking-wider">{verification.gomboId}</span>
                        <button 
                          onClick={handleCopyId} 
                          title="Copier le GOMBO ID"
                          className="ml-1 p-1 text-zinc-400 hover:text-white transition cursor-pointer"
                        >
                          {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 rounded-xl text-[11px] font-mono text-zinc-300">
                        <MapPin className="w-3 h-3 text-[#D4AF37]" />
                        {verification.commune}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Verified Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl space-y-1">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase block">Statut Officiel</span>
                    <span className="text-sm font-sans font-black text-emerald-400 block uppercase">
                      {verification.statusLabel}
                    </span>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl space-y-1">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase block">Niveau d'Accréditation</span>
                    <span className="text-sm font-sans font-black text-[#D4AF37] block">
                      {verification.verificationLevel}
                    </span>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl space-y-1">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase block">Discipline Artistique</span>
                    <span className="text-xs font-sans font-bold text-white block truncate">
                      {verification.discipline}
                    </span>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl space-y-1">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase block">Date d'Homologation</span>
                    <span className="text-xs font-mono font-bold text-zinc-200 block">
                      {verification.certifiedAt}
                    </span>
                  </div>
                </div>

                {/* Seal of Authenticity Note */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-left">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase">
                      Garantie d'Authenticité Émise par AFRIGOMBO
                    </h4>
                    <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                      Ce certificat numérique garantit que l'artiste est enregistré, ses documents d'identité ont été vérifiés et ses engagements contractuels bénéficient de la protection par séquestre financier.
                    </p>
                  </div>
                </div>

                {/* Actions: View Public Profile & Share */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {verification.profileId && (
                    <Link
                      to={`/portfolio/${verification.profileId}`}
                      className="flex-1 py-3 px-4 bg-[#D4AF37] hover:bg-amber-500 text-black font-sans font-black text-xs uppercase tracking-wider rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-black stroke-[2.5]" />
                      <span>Consulter le Profil de l'Artiste</span>
                    </Link>
                  )}

                  <button
                    onClick={handleCopyLink}
                    className="py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-mono text-xs uppercase font-bold rounded-xl border border-white/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-[#D4AF37]" />}
                    <span>{copiedLink ? "Lien copié !" : "Partager cette attestation"}</span>
                  </button>
                </div>

              </div>
            )}

            {/* SCENARIO 2: REVOKED CERTIFICATION */}
            {verification.exists && verification.isRevoked && (
              <div className="rounded-3xl border-2 border-red-500/60 bg-[#160D0E] p-6 sm:p-8 text-center space-y-5 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">
                    ALERTE DE CONFORMITÉ
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display font-black text-red-400 uppercase">
                    CERTIFICATION RÉVOQUÉE
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto font-sans leading-relaxed">
                    Le certificat lié à l'identifiant <span className="font-mono font-bold text-white">{verification.gomboId}</span> a été suspendu ou révoqué par la commission d'administration.
                  </p>
                </div>

                {verification.revocationReason && (
                  <div className="p-3.5 bg-black/60 border border-red-500/30 rounded-2xl text-xs text-red-300 font-mono">
                    Motif : {verification.revocationReason}
                  </div>
                )}
              </div>
            )}

            {/* SCENARIO 3: GOMBO ID NOT FOUND / INEXISTENT */}
            {(!verification.exists || (!verification.isValid && !verification.isRevoked)) && (
              <div className="rounded-3xl border-2 border-amber-500/50 bg-[#14120D] p-6 sm:p-8 text-center space-y-5 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                    RÉSULTAT DE LA RECHERCHE
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display font-black text-amber-400 uppercase">
                    GOMBO ID INTROUVABLE
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto font-sans leading-relaxed">
                    Aucune certification officielle active ne correspond à l'identifiant <span className="font-mono font-bold text-[#D4AF37]">{verification.gomboId || activeGomboId}</span>.
                  </p>
                </div>

                <div className="p-4 bg-black/50 border border-white/10 rounded-2xl text-xs text-zinc-400 font-sans leading-relaxed text-left space-y-1">
                  <p className="font-bold text-white uppercase text-[11px]">Pourquoi ce message ?</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>Le GOMBO ID a été mal orthographié (respectez le format GMB-XXX-XXX).</li>
                    <li>L'artiste n'a pas encore validé son protocole KYC d'homologation.</li>
                    <li>La certification est fictive ou non reconnue par le réseau AFRIGOMBO.</li>
                  </ul>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* 3. OFFICIAL FOOTER */}
      <footer className="border-t border-[#D4AF37]/20 bg-[#08080A] py-6 px-4 text-center space-y-2 text-zinc-500 text-xs font-mono">
        <p className="text-zinc-400">
          AFRIGOMBO • Système Souverain de Vérification Numérique
        </p>
        <p className="text-[10px] text-zinc-600">
          Tous droits réservés • Côte d'Ivoire & Afrique de l'Ouest
        </p>
      </footer>

    </div>
  );
}
