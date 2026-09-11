import React, { useState, useEffect } from "react";
import { 
  Award, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Star, 
  ShieldCheck, 
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { AndroidBottomSheet } from "./ui/AndroidBottomSheet";
import { 
  CertificateData, 
  extractCertificateData, 
  generateQrCodeDataUrl, 
  downloadCertificatePdf, 
  downloadCertificatePng 
} from "../lib/certificateGenerator";
import { audioSynth } from "../lib/audio";
import { getGomboIdStatusInfo } from "../lib/gomboIdHelper";

interface GomboIdCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function GomboIdCertificateModal({
  isOpen,
  onClose,
  user
}: GomboIdCertificateModalProps) {
  const [certData, setCertData] = useState<CertificateData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<"pdf" | "png" | null>(null);

  const statusInfo = getGomboIdStatusInfo(user);
  const isApproved = statusInfo.statusCode === "ATTRIBUTED";

  useEffect(() => {
    if (user && isOpen && isApproved) {
      const data = extractCertificateData(user);
      setCertData(data);
      generateQrCodeDataUrl(data.verificationUrl).then((url) => {
        setQrCodeDataUrl(url);
      });
    } else {
      setCertData(null);
    }
  }, [user, isOpen, isApproved]);

  if (!isOpen || !certData || !isApproved) return null;

  const handleCopyVerificationLink = () => {
    try {
      navigator.clipboard.writeText(certData.verificationUrl);
      setCopiedLink(true);
      try { audioSynth.playKoraNote(523.25, 0, 0.1, 0.5); } catch (_) {}
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn("Failed to copy verification link", err);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingFormat("pdf");
    try {
      audioSynth.playKoraNote(659.25, 0, 0.1, 0.5);
      await downloadCertificatePdf(certData);
    } catch (err) {
      console.error("PDF download error", err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadPng = async () => {
    setDownloadingFormat("png");
    try {
      audioSynth.playKoraNote(587.33, 0, 0.1, 0.5);
      await downloadCertificatePng(certData);
    } catch (err) {
      console.error("PNG download error", err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleShareCertificate = async () => {
    const text = `📜 Certificat d'Excellence GOMBO ID d'AFRIGOMBO\n👤 Artiste : ${certData.artistName}\n🆔 Identifiant : ${certData.gomboId}\n🛡️ Statut : ${certData.statusLabel}\n🔗 Vérifier : ${certData.verificationUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Certificat GOMBO ID - ${certData.artistName}`,
          text,
          url: certData.verificationUrl
        });
      } else {
        handleCopyVerificationLink();
      }
    } catch (err) {
      // Ignored if cancelled
    }
  };

  return (
    <AndroidBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="CERTIFICAT D'EXCELLENCE"
      subtitle="Temple de la Souveraineté Artistique"
    >
      <div className="space-y-5 text-left pb-4">
        
        {/* Certificate Golden Diploma Display */}
        <div className="relative rounded-2xl sm:rounded-3xl border-2 border-[#D4AF37]/50 bg-gradient-to-b from-[#161619] via-[#0E0E11] to-[#0A0A0C] p-4 sm:p-6 shadow-[0_0_35px_rgba(212,175,55,0.15)] overflow-hidden">
          
          {/* Subtle watermark background emblem */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Certificate Header Banner */}
          <div className="text-center space-y-1 relative z-10">
            <div className="flex justify-center items-center gap-1.5 text-[#D4AF37] mb-1">
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <Star className="w-4 h-4 fill-[#D4AF37]" />
              <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
            </div>
            <span className="text-[#D4AF37] text-[8.5px] xs:text-[9px] font-mono font-black uppercase tracking-[0.25em] block leading-none">
              RÉPUBLIQUE DU SHOWBIZ • ALLIANCE DES TALENTS
            </span>
            <h3 className="text-base sm:text-xl font-serif font-black tracking-wider text-white uppercase leading-tight pt-1">
              CERTIFICAT D'EXCELLENCE
            </h3>
            <span className="text-[10px] text-[#D4AF37]/80 font-mono uppercase tracking-widest block">
              GOMBO ID OFFICIAL RECOGNITION
            </span>
          </div>

          {/* Golden Center Identifier */}
          <div className="my-4 py-3 px-4 rounded-xl bg-black/60 border border-[#D4AF37]/30 text-center relative z-10 shadow-inner">
            <span className="text-[8.5px] font-mono text-afri-text-sec uppercase tracking-widest block">
              IDENTIFIANT OFFICIEL DÉLIVRÉ
            </span>
            <span className="text-xl sm:text-2xl font-serif font-black text-[#D4AF37] tracking-widest block uppercase select-all pt-0.5">
              {certData.gomboId}
            </span>
          </div>

          {/* Official Endorsement Text */}
          <p className="text-[11px] text-gray-300 font-sans leading-relaxed max-w-[380px] mx-auto text-center italic relative z-10">
            « Par ce présent certificat, la commission d'homologation d'AFRIGOMBO certifie l'artiste ci-dessous en qualité de membre officiel vérifié du patrimoine musical ivoirien. »
          </p>

          {/* Artist Identity Block */}
          <div className="mt-4 pt-3 border-t border-[#D4AF37]/25 text-center space-y-1 relative z-10">
            <span className="text-afri-text-sec text-[8.5px] font-mono uppercase tracking-widest block">
              ARTISTE TITULAIRE DU TITRE
            </span>
            <h4 className="text-lg sm:text-xl font-display font-black text-white uppercase tracking-wider">
              {certData.artistName}
            </h4>
            {certData.realName && (
              <p className="text-[10px] text-gray-400 font-sans">
                Identité civile : {certData.realName}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-[9.5px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                ✓ {certData.statusLabel}
              </span>
              <span className="text-[9.5px] font-mono text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2 py-0.5 rounded-full">
                {certData.verificationLevel}
              </span>
            </div>
          </div>

          {/* Certificate Metadata & QR Code Section */}
          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center relative z-10">
            
            {/* Metadata column */}
            <div className="sm:col-span-2 space-y-1.5 text-left text-[10px] font-mono">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Pôle :</span>
                <span className="text-white font-bold">{certData.commune}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Discipline :</span>
                <span className="text-white font-bold truncate max-w-[170px]">{certData.category}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Délivré le :</span>
                <span className="text-[#D4AF37] font-bold">{certData.issueDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Sceau :</span>
                <span className="text-emerald-400 font-bold uppercase">AFRIGOMBO-VERIFIED</span>
              </div>
            </div>

            {/* QR Code Column */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 text-center">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code de Vérification" 
                  className="w-20 h-20 rounded-lg bg-white p-1 object-contain shadow"
                />
              ) : (
                <div className="w-20 h-20 bg-black/40 rounded-lg flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-[#D4AF37]" />
                </div>
              )}
              <span className="text-[8px] font-mono text-[#D4AF37] uppercase font-bold mt-1 tracking-wider">
                Vérification QR
              </span>
            </div>

          </div>

          {/* Footer seal disclaimer */}
          <div className="mt-4 pt-2 text-center text-[8px] font-mono text-gray-500 uppercase tracking-widest border-t border-white/5">
            Sceau Officiel Numérique • Conforme aux standards d'authentification de l'industrie musicale
          </div>
        </div>

        {/* Download & Export Action Grid */}
        <div className="space-y-2.5">
          <h5 className="text-[10px] font-mono font-black text-[#D4AF37] uppercase tracking-widest">
            📥 Options de Téléchargement & Partage
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingFormat !== null}
              className="w-full py-3 px-4 bg-[#D4AF37] hover:bg-amber-500 active:scale-98 text-black font-sans font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {downloadingFormat === "pdf" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération du PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 stroke-[2.5]" />
                  <span>Télécharger en PDF (Haute Qualité)</span>
                </>
              )}
            </button>

            {/* Download PNG Button */}
            <button
              onClick={handleDownloadPng}
              disabled={downloadingFormat !== null}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 active:scale-98 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {downloadingFormat === "png" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Export Image...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  <span>Télécharger en Image (PNG)</span>
                </>
              )}
            </button>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            
            {/* Copy Public Verification Link */}
            <button
              onClick={handleCopyVerificationLink}
              className="w-full py-2.5 px-3 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text font-mono text-[10.5px] uppercase font-bold rounded-xl border border-afri-border transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Lien public copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Copier le lien public</span>
                </>
              )}
            </button>

            {/* Share Certificate */}
            <button
              onClick={handleShareCertificate}
              className="w-full py-2.5 px-3 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text font-mono text-[10.5px] uppercase font-bold rounded-xl border border-afri-border transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Partager mon certificat</span>
            </button>

          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-mono text-xs uppercase font-bold rounded-xl border border-white/10 transition-all cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </AndroidBottomSheet>
  );
}
