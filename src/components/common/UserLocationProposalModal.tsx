import React, { useState } from "react";
import { X, MapPin, Send, CheckCircle2 } from "lucide-react";
import { LocationService } from "../../lib/LocationService";
import { LocationType } from "../../types";

interface UserLocationProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  defaultType?: LocationType;
  audioSynth?: any;
}

export default function UserLocationProposalModal({
  isOpen,
  onClose,
  currentUser,
  defaultType = "Commune",
  audioSynth
}: UserLocationProposalModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>(defaultType);
  const [countryName, setCountryName] = useState("Côte d'Ivoire");
  const [cityName, setCityName] = useState("Abidjan");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await LocationService.submitProposal({
        name: name.trim(),
        type,
        countryName,
        cityName: type === "Commune" || type === "Quartier" || type === "Village" ? cityName : "",
        details: details.trim(),
        submittedByUid: currentUser?.uid || "guest",
        submittedByName: currentUser?.displayName || currentUser?.email || "Membre AfriGombo",
        submittedByEmail: currentUser?.email || ""
      });

      setSuccess(true);
      if (audioSynth?.playValidationSuccess) audioSynth.playValidationSuccess();
      setTimeout(() => {
        setSuccess(false);
        setName("");
        setDetails("");
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Erreur envoi proposition lieu:", err);
      alert("Erreur lors de l'envoi de la proposition.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
            className="p-2.5 text-afri-text-sec hover:text-white rounded-xl bg-afri-bg-sec border border-afri-border cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-emerald-400">Proposition envoyée avec succès !</h4>
            <p className="text-xs text-afri-text-sec">
              Le Super Fondateur examinera votre proposition et l'ajoutera au référentiel officiel AfriGombo.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-afri-text-sec uppercase">
                Nom du lieu <span className="text-rose-400">*</span>
              </label>
              <input 
                type="text"
                required
                placeholder="Ex: Dabou, Yamoussoukro, Quartier Soba..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-3 rounded-xl text-xs font-mono min-h-[48px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-afri-text-sec uppercase">Type de lieu</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value as LocationType)}
                  className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-3 rounded-xl text-xs font-mono min-h-[48px]"
                >
                  <option value="Commune">Commune</option>
                  <option value="Ville">Ville</option>
                  <option value="Village">Village</option>
                  <option value="Quartier">Quartier</option>
                  <option value="Localité">Localité</option>
                  <option value="Zone">Zone</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-afri-text-sec uppercase">Pays</label>
                <input 
                  type="text"
                  value={countryName}
                  onChange={e => setCountryName(e.target.value)}
                  className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-3 rounded-xl text-xs font-mono min-h-[48px]"
                />
              </div>
            </div>

            {(type === "Commune" || type === "Quartier" || type === "Village" || type === "Localité") && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-afri-text-sec uppercase">Ville ou Région Parente</label>
                <input 
                  type="text"
                  placeholder="Ex: Abidjan, Yamoussoukro, Bouaké..."
                  value={cityName}
                  onChange={e => setCityName(e.target.value)}
                  className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-3 rounded-xl text-xs font-mono min-h-[48px]"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-afri-text-sec uppercase">Informations Complémentaires (Optionnel)</label>
              <textarea 
                rows={3}
                placeholder="Précisez la zone, un point de repère ou une note pour l'administrateur..."
                value={details}
                onChange={e => setDetails(e.target.value)}
                className="w-full bg-afri-bg-sec border border-afri-border focus:border-[#D4AF37] text-afri-text p-3 rounded-xl text-xs font-mono resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-afri-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-afri-bg-sec text-afri-text-sec rounded-xl hover:bg-afri-bg-ter transition cursor-pointer min-h-[48px] font-bold"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-3 bg-[#D4AF37] text-black font-black uppercase rounded-xl hover:bg-[#b8952b] transition cursor-pointer flex items-center gap-2 min-h-[48px] shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Transmission..." : "Soumettre la proposition"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
