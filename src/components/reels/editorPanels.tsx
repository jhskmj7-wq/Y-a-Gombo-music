import React from "react";
import { Sliders, RotateCcw, Volume2, VolumeX, RotateCw, FlipHorizontal, Sparkles } from "lucide-react";
import { VideoEditorState, VideoTextOverlay, VideoStickerOverlay } from "./editorState";
import { REEL_VIDEO_FILTERS } from "./videoFilters";

interface PanelProps {
  state: VideoEditorState;
  onChange: (updater: (prev: VideoEditorState) => VideoEditorState) => void;
  duration: number;
  currentTime: number;
  onSeek: (seconds: number) => void;
  selectedOverlayId?: string | null;
  onSelectOverlay?: (id: string | null) => void;
}

// 1. FILTERS PANEL
export function FiltersPanel({ state, onChange }: PanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Filtre : {REEL_VIDEO_FILTERS.find((f) => f.id === state.filterId)?.name || "Naturel"}
        </span>
        <button
          onClick={() => onChange((prev) => ({ ...prev, filterId: "naturel", filterIntensity: 100 }))}
          className="text-[10px] text-afri-text-muted hover:text-afri-text flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Réinitialiser
        </button>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x">
        {REEL_VIDEO_FILTERS.map((f) => {
          const isSelected = state.filterId === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onChange((prev) => ({ ...prev, filterId: f.id }))}
              className={`flex flex-col items-center gap-1.5 snap-start shrink-0 cursor-pointer transition-all ${
                isSelected ? "scale-105" : "opacity-75 hover:opacity-100"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center relative shadow-lg transition-all ${
                  isSelected
                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-[#D4AF37]/20 scale-105"
                    : "border-afri-border/50 hover:border-[#D4AF37]/50"
                }`}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600"
                  style={{ filter: f.filterCss }}
                />
                <div className="absolute inset-0 bg-black/20" />
                <span className="relative z-10 text-[9px] font-bold text-white uppercase text-center px-1 leading-tight drop-shadow">
                  {f.name.split(" ")[0]}
                </span>
              </div>
              <span
                className={`text-[10px] font-mono tracking-tight transition-colors ${
                  isSelected ? "text-[#D4AF37] font-bold" : "text-afri-text-sec"
                }`}
              >
                {f.name}
              </span>
            </button>
          );
        })}
      </div>

      {state.filterId !== "naturel" && (
        <div className="flex items-center gap-3 pt-1 px-1">
          <span className="text-[11px] text-afri-text-sec w-16 shrink-0">Intensité</span>
          <input
            type="range"
            min="0"
            max="100"
            value={state.filterIntensity}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange((prev) => ({ ...prev, filterIntensity: val }));
            }}
            className="flex-1 h-1.5 bg-afri-bg-ter rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
          />
          <span className="text-[11px] font-mono text-[#D4AF37] font-bold w-8 text-right">
            {state.filterIntensity}%
          </span>
        </div>
      )}
    </div>
  );
}

// 2. ADJUSTMENTS PANEL
export function AdjustmentsPanel({ state, onChange }: PanelProps) {
  const adjustments = [
    { key: "brightness", label: "Luminosité", min: -100, max: 100, val: state.brightness },
    { key: "contrast", label: "Contraste", min: -100, max: 100, val: state.contrast },
    { key: "saturation", label: "Saturation", min: -100, max: 100, val: state.saturation },
    { key: "temperature", label: "Température", min: -100, max: 100, val: state.temperature },
    { key: "hue", label: "Teinte", min: -180, max: 180, val: state.hue },
    { key: "sepia", label: "Sépia", min: 0, max: 100, val: state.sepia },
    { key: "fade", label: "Fondus/Matte", min: 0, max: 100, val: state.fade },
  ] as const;

  const resetAll = () => {
    onChange((prev) => ({
      ...prev,
      filterId: "naturel",
      filterIntensity: 100,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      hue: 0,
      sepia: 0,
      fade: 0,
      vignette: 0,
      shadows: 0,
      highlights: 0,
      grain: 0,
      activeEffect: "none",
    }));
  };

  const resetSingle = (key: string) => {
    onChange((prev) => ({
      ...prev,
      [key]: 0,
    }));
  };

  return (
    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 text-afri-text scrollbar-thin">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Ajustements Visuels
        </span>
        <button
          onClick={resetAll}
          className="text-[10px] text-afri-text-muted hover:text-[#D4AF37] flex items-center gap-1 cursor-pointer transition-colors px-2 py-0.5 rounded-md hover:bg-afri-bg-action"
          title="Réinitialiser tous les réglages et filtres"
        >
          <RotateCcw className="w-3 h-3" /> Tout réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {adjustments.map((adj) => {
          const currentVal = Number.isFinite(adj.val) ? adj.val : 0;
          return (
            <div key={adj.key} className="flex items-center gap-2 bg-afri-bg-ter/80 p-2 rounded-xl border border-afri-border/40">
              <span className="text-[11px] text-afri-text-sec w-20 shrink-0 select-none">{adj.label}</span>
              <input
                type="range"
                min={adj.min}
                max={adj.max}
                step={1}
                value={currentVal}
                onChange={(e) => {
                  const num = Math.round(Number(e.target.value));
                  onChange((prev) => ({ ...prev, [adj.key]: num }));
                }}
                className="flex-1 h-1.5 bg-afri-bg rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              />
              <button
                type="button"
                onClick={() => resetSingle(adj.key)}
                title="Cliquer pour remettre à 0"
                className="text-[10px] font-mono text-[#D4AF37] font-bold w-9 text-right hover:underline cursor-pointer select-none"
              >
                {currentVal > 0 ? `+${currentVal}` : currentVal}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 3. TRIM PANEL
export function TrimPanel({ state, onChange, duration, onSeek }: PanelProps) {
  const trimStart = state.trimStart;
  const trimEnd = state.trimEnd || duration;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Couper / Trim Video
        </span>
        <span className="text-[10px] font-mono text-afri-text-sec">
          Sélection: {(trimEnd - trimStart).toFixed(1)}s / Total: {duration.toFixed(1)}s
        </span>
      </div>

      <div className="relative bg-afri-bg-ter/80 p-3 rounded-xl border border-afri-border/40 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-afri-text-sec w-12">Début</span>
          <input
            type="range"
            min={0}
            max={Math.max(0, trimEnd - 0.5)}
            step={0.1}
            value={trimStart}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange((prev) => ({ ...prev, trimStart: val }));
              onSeek(val);
            }}
            className="flex-1 h-2 bg-afri-bg rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
          />
          <span className="text-[11px] font-mono text-[#D4AF37] font-bold w-12 text-right">
            {trimStart.toFixed(1)}s
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-afri-text-sec w-12">Fin</span>
          <input
            type="range"
            min={Math.min(duration, trimStart + 0.5)}
            max={duration || 10}
            step={0.1}
            value={trimEnd}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange((prev) => ({ ...prev, trimEnd: val }));
              onSeek(val);
            }}
            className="flex-1 h-2 bg-afri-bg rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
          />
          <span className="text-[11px] font-mono text-[#D4AF37] font-bold w-12 text-right">
            {trimEnd.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
}

// 4. SPEED PANEL
export function SpeedPanel({ state, onChange }: PanelProps) {
  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Vitesse de lecture
        </span>
        <span className="text-[10px] font-mono text-[#D4AF37] font-bold">
          Actuel: {state.playbackRate}x
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {speeds.map((s) => {
          const isSelected = state.playbackRate === s;
          return (
            <button
              key={s}
              onClick={() => onChange((prev) => ({ ...prev, playbackRate: s }))}
              className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#D4AF37] text-black border-amber-400 shadow-md font-black"
                  : "bg-afri-bg-ter text-afri-text border-afri-border/40 hover:border-[#D4AF37]/50"
              }`}
            >
              {s}x
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 5. TRANSFORM PANEL
export function TransformPanel({ state, onChange }: PanelProps) {
  const aspectRatios = ["9:16", "4:5", "1:1", "16:9"] as const;

  const rotate = () => {
    onChange((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const toggleFlip = () => {
    onChange((prev) => ({
      ...prev,
      flipHorizontal: !prev.flipHorizontal,
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Transformation & Format
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={rotate}
          className="flex-1 py-2 px-3 rounded-xl bg-afri-bg-ter border border-afri-border/40 hover:border-[#D4AF37]/50 flex items-center justify-center gap-2 text-xs font-mono text-afri-text cursor-pointer"
        >
          <RotateCw className="w-4 h-4 text-[#D4AF37]" />
          <span>Rotation ({state.rotation}°)</span>
        </button>

        <button
          onClick={toggleFlip}
          className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-mono cursor-pointer transition-all ${
            state.flipHorizontal
              ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] font-bold"
              : "bg-afri-bg-ter border-afri-border/40 text-afri-text"
          }`}
        >
          <FlipHorizontal className="w-4 h-4" />
          <span>Miroir</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] text-afri-text-sec">Ratio d'aspect :</span>
        <div className="grid grid-cols-4 gap-2">
          {aspectRatios.map((ratio) => {
            const isSelected = state.aspectRatio === ratio;
            return (
              <button
                key={ratio}
                onClick={() => onChange((prev) => ({ ...prev, aspectRatio: ratio }))}
                className={`py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#D4AF37] text-black border-amber-400 font-bold"
                    : "bg-afri-bg-ter text-afri-text border-afri-border/40 hover:border-[#D4AF37]/50"
                }`}
              >
                {ratio}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 6. AUDIO PANEL
export function AudioPanel({ state, onChange }: PanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Audio & Volume
        </span>
        <button
          onClick={() => onChange((prev) => ({ ...prev, isMuted: !prev.isMuted }))}
          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer ${
            state.isMuted
              ? "bg-red-500/20 text-red-500 border-red-500/40"
              : "bg-afri-bg-ter text-afri-text border-afri-border/40 hover:border-[#D4AF37]/50"
          }`}
        >
          {state.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#D4AF37]" />}
          <span>{state.isMuted ? "Sourdine" : "Son Actif"}</span>
        </button>
      </div>

      <div className="flex items-center gap-3 bg-afri-bg-ter/80 p-3 rounded-xl border border-afri-border/40">
        <span className="text-[11px] text-afri-text-sec w-20">Volume Video</span>
        <input
          type="range"
          min="0"
          max="100"
          value={state.isMuted ? 0 : state.volume}
          disabled={state.isMuted}
          onChange={(e) => {
            const val = Number(e.target.value);
            onChange((prev) => ({ ...prev, volume: val }));
          }}
          className="flex-1 h-2 bg-afri-bg rounded-lg appearance-none cursor-pointer accent-[#D4AF37] disabled:opacity-40"
        />
        <span className="text-[11px] font-mono text-[#D4AF37] font-bold w-10 text-right">
          {state.isMuted ? "0%" : `${state.volume}%`}
        </span>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <label className="flex items-center gap-2 text-xs text-afri-text-sec cursor-pointer">
          <input
            type="checkbox"
            checked={state.fadeIn}
            onChange={(e) => {
              const checked = e.target.checked;
              onChange((prev) => ({ ...prev, fadeIn: checked }));
            }}
            className="rounded border-afri-border accent-[#D4AF37]"
          />
          Fondu d'entrée audio
        </label>

        <label className="flex items-center gap-2 text-xs text-afri-text-sec cursor-pointer">
          <input
            type="checkbox"
            checked={state.fadeOut}
            onChange={(e) => {
              const checked = e.target.checked;
              onChange((prev) => ({ ...prev, fadeOut: checked }));
            }}
            className="rounded border-afri-border accent-[#D4AF37]"
          />
          Fondu de sortie audio
        </label>
      </div>
    </div>
  );
}

// 7. TEXT PANEL
export function TextPanel({ state, onChange, duration, currentTime, onSeek, selectedOverlayId, onSelectOverlay }: PanelProps) {
  const [inputText, setInputText] = React.useState("");
  const [textColor, setTextColor] = React.useState("#FFFFFF");
  const [bgColor, setBgColor] = React.useState("rgba(0, 0, 0, 0.65)");

  const COLOR_PRESETS = [
    { label: "Blanc", value: "#FFFFFF" },
    { label: "Or Afrigombo", value: "#D4AF37" },
    { label: "Jaune", value: "#FCD34D" },
    { label: "Rouge", value: "#EF4444" },
    { label: "Vert", value: "#10B981" },
    { label: "Cyan", value: "#38BDF8" },
    { label: "Noir", value: "#18181B" },
  ];

  const BG_PRESETS = [
    { label: "Fond discret", value: "rgba(0, 0, 0, 0.65)" },
    { label: "Sans fond", value: "transparent" },
    { label: "Fond doré", value: "rgba(212, 175, 55, 0.3)" },
  ];

  const addText = () => {
    if (!inputText.trim()) return;
    const newId = "txt_" + Date.now();
    const newOverlay: VideoTextOverlay = {
      id: newId,
      text: inputText.trim(),
      color: textColor,
      bgColor: bgColor,
      fontSize: 22,
      isBold: true,
      isItalic: false,
      x: 50,
      y: 50,
      startTime: 0,
      endTime: duration > 0 ? duration : 30,
    };
    onChange((prev) => ({
      ...prev,
      texts: [...prev.texts, newOverlay],
    }));
    setInputText("");
    onSelectOverlay?.(newId);
  };

  const removeText = (id: string) => {
    onChange((prev) => ({
      ...prev,
      texts: prev.texts.filter((t) => t.id !== id),
    }));
    if (selectedOverlayId === id) {
      onSelectOverlay?.(null);
    }
  };

  const updateText = (id: string, partial: Partial<VideoTextOverlay>) => {
    onChange((prev) => ({
      ...prev,
      texts: prev.texts.map((t) => (t.id === id ? { ...t, ...partial } : t)),
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Superposition de texte
        </span>
        <span className="text-[10px] text-afri-text-sec">Déplacez librement avec le doigt sur la vidéo</span>
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Entrez votre texte..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addText();
          }}
          className="flex-1 bg-afri-bg border border-afri-border/50 rounded-xl px-3 py-2 text-xs text-afri-text placeholder-afri-text-muted focus:outline-none focus:border-[#D4AF37]"
        />
        <input
          type="color"
          value={textColor}
          onChange={(e) => setTextColor(e.target.value)}
          className="w-8 h-8 rounded-lg border border-afri-border bg-transparent cursor-pointer p-0.5"
          title="Couleur personnalisée"
        />
        <button
          onClick={addText}
          disabled={!inputText.trim()}
          className="bg-[#D4AF37] hover:bg-amber-400 disabled:opacity-40 text-black font-bold px-3 py-2 rounded-xl text-xs uppercase cursor-pointer shrink-0 active:scale-95 transition-all"
        >
          Ajouter
        </button>
      </div>

      {/* Quick color & background presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-afri-border/30">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[10px] text-afri-text-sec shrink-0 mr-1">Couleur :</span>
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setTextColor(c.value)}
              title={c.label}
              className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                textColor.toLowerCase() === c.value.toLowerCase()
                  ? "ring-2 ring-[#D4AF37] scale-110 border-white"
                  : "border-white/30 hover:scale-105"
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
          {BG_PRESETS.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => setBgColor(b.value)}
              className={`text-[10px] px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                bgColor === b.value
                  ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] font-bold"
                  : "bg-afri-bg-ter border-afri-border/40 text-afri-text-sec hover:text-afri-text"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Texts List with Timeline and Style Management */}
      {state.texts.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-mono text-afri-text-sec flex items-center justify-between">
            <span>Textes ajoutés ({state.texts.length}) :</span>
            <span className="text-[10px] text-afri-text-muted">Touchez pour sélectionner & régler</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none">
            {state.texts.map((t) => {
              const isSelected = selectedOverlayId === t.id;
              const startVal = typeof t.startTime === "number" ? t.startTime : 0;
              const endVal = typeof t.endTime === "number" && t.endTime > 0 ? t.endTime : (duration || 10);

              return (
                <div
                  key={t.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-afri-bg border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-md"
                      : "bg-afri-bg-ter border-afri-border/40 hover:border-afri-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectOverlay?.(t.id);
                        if (typeof t.startTime === "number") onSeek(t.startTime);
                      }}
                      className="flex-1 text-left flex items-center gap-2 truncate cursor-pointer"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-white/40 shadow-xs"
                        style={{ backgroundColor: t.color || "#FFFFFF" }}
                      />
                      <span className="font-bold text-xs truncate max-w-[150px]" style={{ color: t.color || "#FFFFFF" }}>
                        {t.text}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                        [{startVal.toFixed(1)}s - {endVal.toFixed(1)}s]
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Font size adjustments */}
                      <button
                        type="button"
                        onClick={() => updateText(t.id, { fontSize: Math.max(14, (t.fontSize || 22) - 2) })}
                        className="w-6 h-6 rounded bg-afri-bg border border-afri-border/40 text-xs font-bold text-afri-text hover:text-[#D4AF37] cursor-pointer flex items-center justify-center"
                        title="Réduire taille"
                      >
                        -
                      </button>
                      <span className="text-[10px] font-mono w-5 text-center">{t.fontSize || 22}</span>
                      <button
                        type="button"
                        onClick={() => updateText(t.id, { fontSize: Math.min(44, (t.fontSize || 22) + 2) })}
                        className="w-6 h-6 rounded bg-afri-bg border border-afri-border/40 text-xs font-bold text-afri-text hover:text-[#D4AF37] cursor-pointer flex items-center justify-center"
                        title="Agrandir taille"
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() => removeText(t.id)}
                        className="text-red-500 hover:text-red-400 text-xs font-bold px-2 py-0.5 cursor-pointer ml-1"
                        title="Supprimer ce texte"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Timeline controls for selected text */}
                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-afri-border/30 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between text-[10px] font-mono text-afri-text-sec">
                        <span>Timeline d'apparition</span>
                        <span className="text-[#D4AF37]">Durée : {Math.max(0, endVal - startVal).toFixed(1)}s</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Début */}
                        <div className="bg-afri-bg-ter/80 p-1.5 rounded-lg border border-afri-border/30 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 text-[10px]">Début: {startVal.toFixed(1)}s</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newStart = Math.min(currentTime, endVal - 0.2);
                                updateText(t.id, { startTime: Math.max(0, Number(newStart.toFixed(1))) });
                              }}
                              className="text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer"
                            >
                              ⏱️ À {currentTime.toFixed(1)}s
                            </button>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={Math.max(0, endVal - 0.2)}
                            step={0.1}
                            value={startVal}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateText(t.id, { startTime: val });
                              onSeek(val);
                            }}
                            className="w-full h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-[#D4AF37]"
                          />
                        </div>

                        {/* Fin */}
                        <div className="bg-afri-bg-ter/80 p-1.5 rounded-lg border border-afri-border/30 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 text-[10px]">Fin: {endVal.toFixed(1)}s</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newEnd = Math.max(currentTime, startVal + 0.2);
                                updateText(t.id, { endTime: Number(newEnd.toFixed(1)) });
                              }}
                              className="text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer"
                            >
                              ⏱️ À {currentTime.toFixed(1)}s
                            </button>
                          </div>
                          <input
                            type="range"
                            min={Math.min(duration || 10, startVal + 0.2)}
                            max={duration || 10}
                            step={0.1}
                            value={endVal}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateText(t.id, { endTime: val });
                              onSeek(val);
                            }}
                            className="w-full h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-[#D4AF37]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 8. STICKERS PANEL
export function StickersPanel({ state, onChange, duration, currentTime, onSeek, selectedOverlayId, onSelectOverlay }: PanelProps) {
  const emojis = ["🔥", "❤️", "👑", "🚀", "🎵", "💃", "🕺", "🦁", "⭐", "🎉", "💯", "👏", "🏆", "🌟", "✨", "🌍"];

  const addEmoji = (emoji: string) => {
    const newId = "stk_" + Date.now();
    const newSticker: VideoStickerOverlay = {
      id: newId,
      emoji: emoji,
      size: 40,
      rotation: 0,
      x: 50,
      y: 50,
      startTime: 0,
      endTime: duration > 0 ? duration : 30,
    };
    onChange((prev) => ({
      ...prev,
      stickers: [...prev.stickers, newSticker],
    }));
    onSelectOverlay?.(newId);
  };

  const removeSticker = (id: string) => {
    onChange((prev) => ({
      ...prev,
      stickers: prev.stickers.filter((s) => s.id !== id),
    }));
    if (selectedOverlayId === id) {
      onSelectOverlay?.(null);
    }
  };

  const updateSticker = (id: string, partial: Partial<VideoStickerOverlay>) => {
    onChange((prev) => ({
      ...prev,
      stickers: prev.stickers.map((s) => (s.id === id ? { ...s, ...partial } : s)),
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Stickers & Emojis
        </span>
        <span className="text-[10px] text-afri-text-sec">Déplacez librement avec le doigt sur la vidéo</span>
      </div>

      {/* Emoji picker rail */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {emojis.map((e) => (
          <button
            key={e}
            onClick={() => addEmoji(e)}
            className="w-10 h-10 rounded-xl bg-afri-bg-ter hover:bg-afri-bg-action border border-afri-border/40 flex items-center justify-center text-xl cursor-pointer hover:scale-110 active:scale-95 transition-all shrink-0"
          >
            {e}
          </button>
        ))}
      </div>

      {/* Added stickers list with timeline */}
      {state.stickers.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-mono text-afri-text-sec flex items-center justify-between">
            <span>Stickers ajoutés ({state.stickers.length}) :</span>
            <span className="text-[10px] text-afri-text-muted">Touchez pour régler l'apparition</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-none">
            {state.stickers.map((s) => {
              const isSelected = selectedOverlayId === s.id;
              const startVal = typeof s.startTime === "number" ? s.startTime : 0;
              const endVal = typeof s.endTime === "number" && s.endTime > 0 ? s.endTime : (duration || 10);

              return (
                <div
                  key={s.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-afri-bg border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-md"
                      : "bg-afri-bg-ter border-afri-border/40 hover:border-afri-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectOverlay?.(s.id);
                        if (typeof s.startTime === "number") onSeek(s.startTime);
                      }}
                      className="flex-1 text-left flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-xl leading-none">{s.emoji}</span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        [{startVal.toFixed(1)}s - {endVal.toFixed(1)}s]
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Size +/- */}
                      <button
                        type="button"
                        onClick={() => updateSticker(s.id, { size: Math.max(20, (s.size || 40) - 6) })}
                        className="w-6 h-6 rounded bg-afri-bg border border-afri-border/40 text-xs font-bold text-afri-text hover:text-[#D4AF37] cursor-pointer flex items-center justify-center"
                        title="Réduire taille"
                      >
                        -
                      </button>
                      <span className="text-[10px] font-mono w-5 text-center">{s.size || 40}</span>
                      <button
                        type="button"
                        onClick={() => updateSticker(s.id, { size: Math.min(80, (s.size || 40) + 6) })}
                        className="w-6 h-6 rounded bg-afri-bg border border-afri-border/40 text-xs font-bold text-afri-text hover:text-[#D4AF37] cursor-pointer flex items-center justify-center"
                        title="Agrandir taille"
                      >
                        +
                      </button>

                      {/* Rotate */}
                      <button
                        type="button"
                        onClick={() => updateSticker(s.id, { rotation: ((s.rotation || 0) + 45) % 360 })}
                        className="w-6 h-6 rounded bg-afri-bg border border-afri-border/40 text-[10px] text-zinc-400 hover:text-[#D4AF37] cursor-pointer flex items-center justify-center"
                        title="Faire pivoter"
                      >
                        ⟳
                      </button>

                      <button
                        type="button"
                        onClick={() => removeSticker(s.id)}
                        className="text-red-500 hover:text-red-400 text-xs font-bold px-2 py-0.5 cursor-pointer ml-1"
                        title="Supprimer ce sticker"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Timeline controls */}
                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-afri-border/30 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between text-[10px] font-mono text-afri-text-sec">
                        <span>Timeline d'apparition</span>
                        <span className="text-[#D4AF37]">Durée : {Math.max(0, endVal - startVal).toFixed(1)}s</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-afri-bg-ter/80 p-1.5 rounded-lg border border-afri-border/30 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 text-[10px]">Début: {startVal.toFixed(1)}s</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newStart = Math.min(currentTime, endVal - 0.2);
                                updateSticker(s.id, { startTime: Math.max(0, Number(newStart.toFixed(1))) });
                              }}
                              className="text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer"
                            >
                              ⏱️ À {currentTime.toFixed(1)}s
                            </button>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={Math.max(0, endVal - 0.2)}
                            step={0.1}
                            value={startVal}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateSticker(s.id, { startTime: val });
                              onSeek(val);
                            }}
                            className="w-full h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-[#D4AF37]"
                          />
                        </div>

                        <div className="bg-afri-bg-ter/80 p-1.5 rounded-lg border border-afri-border/30 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 text-[10px]">Fin: {endVal.toFixed(1)}s</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newEnd = Math.max(currentTime, startVal + 0.2);
                                updateSticker(s.id, { endTime: Number(newEnd.toFixed(1)) });
                              }}
                              className="text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer"
                            >
                              ⏱️ À {currentTime.toFixed(1)}s
                            </button>
                          </div>
                          <input
                            type="range"
                            min={Math.min(duration || 10, startVal + 0.2)}
                            max={duration || 10}
                            step={0.1}
                            value={endVal}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateSticker(s.id, { endTime: val });
                              onSeek(val);
                            }}
                            className="w-full h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-[#D4AF37]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 9. EFFECTS PANEL
export function EffectsPanel({ state, onChange }: PanelProps) {
  const effects = [
    { id: "none", name: "Aucun" },
    { id: "glow", name: "Glow Doré" },
    { id: "blur", name: "Flou Doux" },
    { id: "vignette", name: "Vignette" },
    { id: "flash", name: "Flash" },
    { id: "shake", name: "Shake" },
    { id: "pulse", name: "Pulse" },
    { id: "zoom", name: "Zoom In" },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Effets Spéciaux Visuels
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {effects.map((eff) => {
          const isSelected = state.activeEffect === eff.id;
          return (
            <button
              key={eff.id}
              onClick={() => onChange((prev) => ({ ...prev, activeEffect: eff.id as any }))}
              className={`py-2.5 px-2 rounded-xl border text-[11px] font-mono font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                isSelected
                  ? "bg-[#D4AF37] text-black border-amber-400 shadow-md font-black"
                  : "bg-afri-bg-ter text-afri-text border-afri-border/40 hover:border-[#D4AF37]/50"
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSelected ? "text-black" : "text-[#D4AF37]"}`} />
              <span>{eff.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 10. COVER PANEL
export function CoverPanel({ state, onChange, duration, currentTime, onSeek }: PanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Miniature / Image de couverture
        </span>
        <span className="text-[10px] font-mono text-[#D4AF37] font-bold">
          Frame choisie: {state.coverTime.toFixed(1)}s
        </span>
      </div>

      <div className="bg-afri-bg-ter/80 p-3 rounded-xl border border-afri-border/40 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-afri-text-sec w-24">Temps de capture</span>
          <input
            type="range"
            min={0}
            max={duration || 10}
            step={0.1}
            value={state.coverTime}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange((prev) => ({ ...prev, coverTime: val }));
              onSeek(val);
            }}
            className="flex-1 h-2 bg-afri-bg rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => {
              onChange((prev) => ({ ...prev, coverTime: currentTime }));
            }}
            className="bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer"
          >
            Utiliser l'instant présent ({currentTime.toFixed(1)}s)
          </button>
        </div>
      </div>
    </div>
  );
}
