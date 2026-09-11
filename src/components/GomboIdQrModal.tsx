import React, { useState, useEffect } from "react";
import { 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  ShieldCheck, 
  Sparkles 
} from "lucide-react";
import { AndroidBottomSheet } from "./ui/AndroidBottomSheet";
import { generateQrCodeDataUrl } from "../lib/certificateGenerator";
import { getEffectiveGomboId } from "../lib/gomboIdHelper";
import { audioSynth } from "../lib/audio";

interface GomboIdQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function GomboIdQrModal({
  isOpen,
  onClose,
  user
}: GomboIdQrModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const gomboId = getEffectiveGomboId(user);
  const artistName = user?.artisticName || user?.name || "Artiste Certifié";
  const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://afrigombo.ci";
  const verificationUrl = `${origin}/verification/${gomboId}`;

  useEffect(() => {
    if (isOpen && verificationUrl) {
      generateQrCodeDataUrl(verificationUrl).then((url) => {
        setQrCodeDataUrl(url);
      });
    }
  }, [isOpen, verificationUrl]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    try {
      navigator.clipboard.writeText(gomboId);
      setCopiedId(true);
      try { audioSynth.playKoraNote(523.25, 0, 0.1, 0.5); } catch (_) {}
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.warn("Failed to copy ID", err);
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(verificationUrl);
      setCopiedLink(true);
      try { audioSynth.playKoraNote(659.25, 0, 0.1, 0.5); } catch (_) {}
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.warn("Failed to copy verification URL", err);
    }
  };

  return (
    <AndroidBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="SCANNER GOMBO ID"
      subtitle="Vérification Publique & Badge Officiel"
    >
      <div className="space-y-5 text-center pb-3">
        
        {/* Real Generated QR Code in High Resolution */}
        <div className="p-5 bg-white rounded-3xl inline-block shadow-[0_0_30px_rgba(212,175,55,0.2)] border-2 border-[#D4AF37]">
          {qrCodeDataUrl ? (
            <img 
              src={qrCodeDataUrl} 
              alt={`QR Code officiel de ${artistName}`}
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
            />
          ) : (
            <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-gray-100 rounded-2xl">
              <QrCode className="w-16 h-16 text-gray-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* Identity & Gombo ID */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-[#D4AF37] font-bold uppercase tracking-widest">
              Identifiant officiel de certification
            </span>
          </div>
          <h4 className="text-lg font-display font-black text-afri-text uppercase">
            {artistName}
          </h4>
          <p className="text-base font-serif font-black text-[#D4AF37] tracking-widest uppercase select-all">
            {gomboId}
          </p>
        </div>

        <p className="text-xs text-afri-text-sec max-w-xs mx-auto leading-relaxed">
          Scannez ce QR Code avec n'importe quel smartphone pour accéder à la fiche publique certifiée et vérifier le statut du musicien.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleCopyId}
            className="w-full py-3 px-4 bg-afri-bg-sec hover:bg-afri-bg-ter text-afri-text font-mono text-xs uppercase font-bold rounded-xl border border-afri-border transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {copiedId ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">GOMBO ID Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#D4AF37]" />
                <span>Copier GOMBO ID</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-3 px-4 bg-[#D4AF37] hover:bg-amber-500 text-black font-sans font-black text-xs uppercase tracking-wider rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-black stroke-[3]" />
                <span>Lien URL Copié !</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 text-black stroke-[2.5]" />
                <span>Copier le lien public</span>
              </>
            )}
          </button>
        </div>

        {/* Close */}
        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-mono text-xs uppercase rounded-xl border border-white/10 transition-all cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </AndroidBottomSheet>
  );
}
