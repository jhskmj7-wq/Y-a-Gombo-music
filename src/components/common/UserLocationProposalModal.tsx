import React, { useState } from "react";
import { X, MapPin, Send, CheckCircle2, Navigation, Map } from "lucide-react";
import { LocationService } from "../../lib/LocationService";
import { LocationType } from "../../types";
import MapPickerModal from "./MapPickerModal";

interface UserLocationProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (proposedName: string) => void;
  currentUser?: any;
  defaultType?: LocationType;
  audioSynth?: any;
}

export default function UserLocationProposalModal({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  defaultType = "Commune",
  audioSynth
}: UserLocationProposalModalProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("Abidjan");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleUseMyPosition = () => {
    setGpsNotice(null);
    if (!("geolocation" in navigator)) {
      setGpsNotice("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setGpsNotice("📍 Position GPS récupérée avec succès !");
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsNotice("La localisation n'est pas autorisée. Vous pouvez continuer en renseignant le lieu manuellement.");
        } else {
          setGpsNotice("Position indisponible. Vous pouvez choisir l'emplacement sur la carte.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!city.trim()) return;

    setSubmitting(true);
    setErrorMsg("");
    try {
      const proposedId = await LocationService.submitProposal({
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        description: description.trim(),
        latitude,
        longitude,
        createdBy: currentUser?.displayName || currentUser?.email || "Utilisateur AfriGombo"
      });

      setSuccess(true);
      if (audioSynth?.playValidationSuccess) audioSynth.playValidationSuccess();
      
      const displayName = `${name.trim()} — en attente de validation`;
      
      setTimeout(() => {
        setSuccess(false);
        setName("");
        setAddress("");
        setDescription("");
        setLatitude(undefined);
        setLongitude(undefined);
        setGpsNotice(null);
        if (onSuccess) onSuccess(displayName);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Erreur envoi proposition lieu:", err);
      setErrorMsg(err?.message || "Erreur lors de l'envoi de la proposition.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
        <div 
          className="bg-afri-bg border border-[#D4AF37]/40 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-lg space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex justify-between items-center border-b border-afri-border pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-xl text-[#D4AF37]">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black font-mono uppercase text-[#D4AF37]">
                  Proposer un nouveau lieu
                </h3>
                <p className="text-[10px] text-afri-text-sec font-mono">
                  Transmettez votre commune ou village au Super Fondateur
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-2.5 text-afri-text-sec hover:text-afri-text rounded-xl bg-afri-bg-sec border border-afri-border cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {success ? (
            <div className="p-8 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-sm font-bold text-emerald-400">Proposition envoyée avec succès !</h4>
              <p className="text-xs text-afri-text-sec">
                Lieu proposé avec succès. Il sera vérifié par AFRIGOMBO avant d'être ajouté aux lieux officiels.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-[10px]">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-afri-text-sec uppercase">
                  Nom du lieu <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Salle Polyvalente, Stade municipal..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-3 rounded-xl text-xs font-mono min-h-[48px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-afri-text-sec uppercase">
                  Ville / Commune <span className="text-rose-400">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Cocody, Bouaké, Korhogo..."
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-3 rounded-xl text-xs font-mono min-h-[48px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-afri-text-sec uppercase">Adresse ou indication du lieu</label>
                <input 
                  type="text"
                  placeholder="Ex: Face à la pharmacie centrale..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-3 rounded-xl text-xs font-mono min-h-[48px]"
                />
              </div>

              {/* LOCALISATION DU LIEU (Requirement 2 & 9) */}
              <div className="p-3 bg-afri-bg-sec border border-[#D4AF37]/30 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-[#D4AF37]">📍 Localiser le lieu</span>
                  {latitude !== undefined && longitude !== undefined && (
                    <span className="text-[10px] font-bold text-emerald-400">
                      GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </span>
                  )}
                </div>

                {gpsNotice && (
                  <p className="text-[10px] text-amber-300 bg-amber-500/10 p-2 rounded-lg">
                    {gpsNotice}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleUseMyPosition}
                    disabled={locating}
                    className="p-2.5 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] rounded-xl text-[10px] font-bold text-afri-text flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{locating ? "Recherche..." : "Utiliser ma position"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(true)}
                    className="p-2.5 bg-afri-bg-sec border border-afri-border hover:border-[#D4AF37] rounded-xl text-[10px] font-bold text-afri-text flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <Map className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Choisir sur la carte</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-afri-text-sec uppercase">Description facultative</label>
                <textarea 
                  rows={2}
                  placeholder="Précisez des informations utiles pour identifier ce lieu..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-3 rounded-xl text-xs font-mono resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-afri-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 bg-afri-bg-sec text-afri-text-sec rounded-xl hover:bg-afri-bg-ter cursor-pointer min-h-[48px] font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-3 bg-[#D4AF37] text-black font-black uppercase rounded-xl hover:bg-[#b8952b] cursor-pointer flex items-center gap-2 min-h-[48px] shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? "Transmission..." : "Soumettre la proposition"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <MapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={latitude || 5.3600}
        initialLng={longitude || -4.0083}
        title={`Placement de : ${name || "Nouveau lieu"}`}
        onConfirm={(coords) => {
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
          setGpsNotice(`Emplacement sélectionné : Lat ${coords.latitude.toFixed(4)}, Lng ${coords.longitude.toFixed(4)}`);
        }}
      />
    </>
  );
}
