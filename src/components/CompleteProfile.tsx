import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, Phone, MapPin, Sparkles, Check, Camera, Upload, Globe, PenTool
} from "lucide-react";
import { UserProfile } from "../types";
import { gomboDB } from "../firebase";
import { audioSynth } from "../lib/audio";

const CIV_CITIES = [
  "Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro", "Korhogo", "Daloa", "Man", "Gagnoa", "Grand-Bassam", "Bingerville", "Autre"
];

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=150"
];

const AFRIGOMBO_ROLES = [
  "Artiste",
  "Producteur",
  "Beatmaker",
  "Manager",
  "Promoteur",
  "Organisateur événement",
  "Studio",
  "Média",
  "Passionné musique",
  "Autre"
];

interface CompleteProfileProps {
  currentUserProfile: UserProfile;
  onComplete: () => void;
}

export default function CompleteProfile({ currentUserProfile, onComplete }: CompleteProfileProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [role, setRole] = useState<string>(currentUserProfile.role || "Artiste");
  const [displayName, setDisplayName] = useState(currentUserProfile.displayName || currentUserProfile.artisticName || "");
  const [country, setCountry] = useState(currentUserProfile.country || "Côte d'Ivoire");
  const [ville, setVille] = useState(currentUserProfile.ville || currentUserProfile.commune || "Abidjan");
  const [phone, setPhone] = useState(currentUserProfile.phone || "");
  const [bio, setBio] = useState(currentUserProfile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUserProfile.photoURL || currentUserProfile.avatarUrl || PRESET_AVATARS[0]);

  const [loading, setLoading] = useState(false);
  const [errorMSG, setErrorMSG] = useState("");
  const [uploading, setUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300, facingMode: "user" } });
      setCameraStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 200);
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("L'appareil photo n'est pas accessible sur cet appareil.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setAvatarUrl(dataUrl);
        stopCamera();
        try { audioSynth.playKoraNote(500, 0, 0.1, 0.3); } catch (_) {}
      }
    } catch (err) {
      console.error("Capture photo fail:", err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (step: number) => {
    setErrorMSG("");
    if (step === 1) {
      if (!displayName.trim()) {
        setErrorMSG("Le nom affiché est obligatoire.");
        return false;
      }
      if (!phone.trim()) {
        setErrorMSG("Le numéro de téléphone est obligatoire.");
        return false;
      }
      if (!role) {
        setErrorMSG("Veuillez sélectionner votre rôle.");
        return false;
      }
    } else if (step === 3) {
      if (!country.trim()) {
        setErrorMSG("Le pays est requis.");
        return false;
      }
      if (!ville.trim()) {
        setErrorMSG("La ville est requise.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
      try { audioSynth.playTamTam(true); } catch (_) {}
    }
  };

  const prevStep = () => {
    setActiveStep(prev => prev - 1);
    try { audioSynth.playTamTam(false); } catch (_) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setLoading(true);
    setErrorMSG("");

    const updates: Partial<UserProfile> = {
      role: role,
      displayName: displayName.trim(),
      artistName: displayName.trim(),
      artisticName: displayName.trim(),
      firstName: displayName.trim().split(" ")[0] || "Artiste",
      lastName: displayName.trim().split(" ").slice(1).join(" ") || "Gombo",
      country: country.trim(),
      ville: ville.trim(),
      commune: ville.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl,
      photoURL: avatarUrl,
      isProfileComplete: true,
      updatedAt: new Date().toISOString()
    };

    try {
      console.log("Saving complete profile details to Firestore:", updates);
      await gomboDB.updateUserProfile(currentUserProfile.uid, updates);
      
      // Publish live feed event
      try {
        await gomboDB.publishActivity({
          type: "talent",
          title: "Nouveau Profil Bêta Certifié ! 🚀",
          message: `🔥 ${displayName} a rejoint AFRIGOMBO en tant que ${role} à ${ville} ! Bienvenue !`,
          userId: currentUserProfile.uid,
          userName: displayName,
          userAvatar: avatarUrl,
          targetId: currentUserProfile.uid
        });
      } catch (feedErr) {
        console.warn("Activity feed post non-fatal error:", feedErr);
      }

      window.dispatchEvent(new Event("gomboUserProfileChange"));
      onComplete();
    } catch (err: any) {
      console.error("Firestore onboarding update failed:", err);
      setErrorMSG("Erreur réseau. Impossible d'enregistrer de manière sécurisée.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8" id="onboarding-completion-root">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0E0E10] border border-[#D4AF37]/25 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden text-left"
      >
        {/* Animated Gold Aura Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Slider Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900">
          <div 
            className="h-full bg-[#D4AF37] transition-all duration-300"
            style={{ width: `${(activeStep / 3) * 100}%` }}
          />
        </div>

        {/* Heading */}
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center p-3.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full mb-3 border border-[#D4AF37]/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-widest text-[#D4AF37] uppercase font-sans">
            SOUVERAINETÉ AFRIID 👑
          </h2>
          <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
            Configurez vos coordonnées de showbiz certifiées pour démarrer l'expérience unique AFRIGOMBO.
          </p>
        </div>

        {errorMSG && (
          <div className="p-4 mb-5 bg-red-950/30 border border-red-500/20 rounded-2xl text-red-300 text-xs text-center font-bold">
            ⚠️ {errorMSG}
          </div>
        )}

        {/* Steps header */}
        <div className="flex items-center justify-between mb-8 px-4 font-sans">
          {[
            { step: 1, label: "Identité / Rôle" },
            { step: 2, label: "Photo d'Artiste" },
            { step: 3, label: "Localisation" }
          ].map((s, idx) => (
            <div key={s.step} className="flex flex-col items-center flex-1 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black select-none z-10 transition-all duration-350 ${
                activeStep === s.step 
                  ? "bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]" 
                  : activeStep > s.step 
                    ? "bg-emerald-500 text-black" 
                    : "bg-zinc-900 border border-zinc-800 text-zinc-500"
              }`}>
                {activeStep > s.step ? <Check className="w-4 h-4 stroke-[3px]" /> : (idx + 1)}
              </div>
              <span className="text-[9px] font-black mt-2 text-zinc-500 block uppercase tracking-wider">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">

          {/* STEP 1: IDENTITY & MANDATORY ROLE SELECT */}
          {activeStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Nom Affiché / De Scène *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Serge Kassi, DJ Gombo, etc."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-900 focus:border-[#D4AF37]/50 rounded-2xl text-xs text-white placeholder-zinc-705 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Téléphone Direct (+225) *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 07 00 11 22 33"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-900 focus:border-[#D4AF37]/50 rounded-2xl text-xs text-white placeholder-zinc-705 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Sélectionnez votre Rôle Principal *</span>
                  </label>
                  
                  {/* Grid of exclusive Roles */}
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {AFRIGOMBO_ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setRole(r);
                          try { audioSynth.playTamTam(true); } catch (_) {}
                        }}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between font-bold text-[10.5px] uppercase tracking-tight ${
                          role === r
                            ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] scale-[1.02]"
                            : "border-zinc-900 bg-zinc-950/60 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-90 w-full"
                        }`}
                      >
                        <span>{r}</span>
                        {role === r && <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full h-13 bg-[#D4AF37] hover:bg-[#b89520] text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(212,175,55,0.2)]"
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PROFILE PHOTO SELECTION / CAMERA / WEB FILE UPLOAD */}
          {activeStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center space-y-4">
                {/* Visual Circle Preview */}
                <div className="relative w-36 h-36 rounded-full border-2 border-[#D4AF37] p-1 bg-black overflow-hidden flex items-center justify-center group">
                  {cameraActive ? (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover rounded-full scale-x-[-1]"
                      id="complete-webcam-preview"
                    />
                  ) : (
                    <img
                      src={avatarUrl}
                      alt="Aperçu Profil"
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>

                {/* Live Controls */}
                <div className="flex justify-center gap-2 w-full max-w-xs flex-wrap">
                  {cameraActive ? (
                    <>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-[10px] uppercase rounded-xl transition-all active:scale-95"
                      >
                        Prendre la photo 📸
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-[10px] uppercase rounded-xl transition-all active:scale-95"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] font-bold text-[10px] uppercase rounded-xl transition-all active:scale-95 flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Prendre un selfie</span>
                      </button>

                      <label className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-[10px] uppercase rounded-xl transition-all active:scale-95 flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Téléverser</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}
                </div>

                {/* Preset Avatars Selection List */}
                <div className="w-full text-center space-y-2 pt-2 border-t border-zinc-900">
                  <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest block">Ou choisissez un avatar showbiz par défaut</span>
                  <div className="flex justify-center gap-2">
                    {PRESET_AVATARS.map((pic, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatarUrl(pic);
                          try { audioSynth.playTamTam(true); } catch (_) {}
                        }}
                        className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all ${
                          avatarUrl === pic ? "border-[#D4AF37] scale-110 shadow-[0_0_10px_rgba(212,175,55,0.3)]" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={pic} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 h-13 bg-zinc-950 border border-zinc-900 hover:bg-zinc-90 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 text-center"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-[2] h-13 bg-[#D4AF37] hover:bg-[#b89520] text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 text-center shadow-[0_4px_15px_rgba(212,175,55,0.2)]"
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: REGIONAL LOCALISATION, COUNTRY, VILLE, PHONE, BIO */}
          {activeStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Pays d'origine *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Côte d'Ivoire, Sénégal, France, etc."
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-900 focus:border-[#D4AF37]/50 rounded-2xl text-xs text-white placeholder-zinc-705 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Ville d'habitation *</span>
                  </label>
                  <select
                    value={CIV_CITIES.includes(ville) ? ville : "Autre"}
                    onChange={(e) => {
                      const selected = e.target.value;
                      if (selected === "Autre") {
                        setVille("");
                      } else {
                        setVille(selected);
                      }
                      try { audioSynth.playTamTam(false); } catch (_) {}
                    }}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-900 focus:border-[#D4AF37]/50 rounded-2xl text-xs text-white placeholder-zinc-705 font-bold focus:outline-none mb-2"
                  >
                    {CIV_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  
                  {!CIV_CITIES.includes(ville) && (
                    <input
                      type="text"
                      required
                      placeholder="Saisissez votre ville..."
                      value={ville}
                      onChange={(e) => setVille(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-900 focus:border-[#D4AF37]/50 rounded-2xl text-xs text-white placeholder-zinc-705 font-bold focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
                    <PenTool className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Biographie d'Artiste / Profil (Bio)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Racontez en quelques lignes votre univers showbiz ou votre activité..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-900 focus:border-[#D4AF37]/50 rounded-2xl text-xs text-white placeholder-zinc-755 leading-relaxed focus:outline-none font-sans"
                  />
                  <div className="text-right text-[9px] font-mono text-zinc-600 mt-1 uppercase">
                    {bio.length} / 500 caractères
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="flex-1 h-13 bg-zinc-950 border border-zinc-900 hover:bg-zinc-90 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 text-center disabled:opacity-40"
                >
                  Retour
                </button>
                
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] h-13 bg-[#D4AF37] hover:bg-[#F3C43F] disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(212,175,55,0.3)]"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>Valider & Entrer 🚀</span>
                  )}
                </button>
              </div>
            </motion.div>
          )}

        </form>

        <p className="text-[9px] text-zinc-600 font-mono mt-8 uppercase tracking-widest text-center">
          VOTRE SÉCURITÉ ET VOTRE RETRAITE D'ARTISTE SONT GARANTIES SUR AFRIGOMBO
        </p>
      </motion.div>
    </div>
  );
}
