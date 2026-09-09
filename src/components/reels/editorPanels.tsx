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
          className="text-[10px] text-zinc-400 dark:text-zinc-400 hover:text-foreground flex items-center gap-1 cursor-pointer"
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
                    : "border-zinc-300 dark:border-white/20 hover:border-zinc-400 dark:hover:border-white/50"
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
                  isSelected ? "text-[#D4AF37] font-bold" : "text-zinc-500 dark:text-zinc-400"
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
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 w-16 shrink-0">Intensité</span>
          <input
            type="range"
            min="0"
            max="100"
            value={state.filterIntensity}
            onChange={(e) => {
              const val = Number(e.target.value);
              onChange((prev) => ({ ...prev, filterIntensity: val }));
            }}
            className="flex-1 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
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
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      hue: 0,
      sepia: 0,
      fade: 0,
    }));
  };

  return (
    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 text-foreground scrollbar-thin">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Ajustements Visuels
        </span>
        <button
          onClick={resetAll}
          className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-foreground flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {adjustments.map((adj) => (
          <div key={adj.key} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/60 p-2 rounded-xl border border-zinc-200 dark:border-white/5">
            <span className="text-[11px] text-zinc-700 dark:text-zinc-300 w-20 shrink-0">{adj.label}</span>
            <input
              type="range"
              min={adj.min}
              max={adj.max}
              value={adj.val}
              onChange={(e) => {
                const num = Number(e.target.value);
                onChange((prev) => ({ ...prev, [adj.key]: num }));
              }}
              className="flex-1 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
            />
            <span className="text-[10px] font-mono text-[#D4AF37] font-bold w-8 text-right">
              {adj.val > 0 ? `+${adj.val}` : adj.val}
            </span>
          </div>
        ))}
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
        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          Sélection: {(trimEnd - trimStart).toFixed(1)}s / Total: {duration.toFixed(1)}s
        </span>
      </div>

      <div className="relative bg-zinc-100 dark:bg-zinc-900/80 p-3 rounded-xl border border-zinc-200 dark:border-white/10 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 w-12">Début</span>
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
            className="flex-1 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
          />
          <span className="text-[11px] font-mono text-[#D4AF37] font-bold w-12 text-right">
            {trimStart.toFixed(1)}s
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 w-12">Fin</span>
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
            className="flex-1 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
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
                  ? "bg-[#D4AF37] text-black border-amber-400 shadow-md scale-105"
                  : "bg-zinc-100 dark:bg-zinc-900/80 text-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/30"
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
          className="flex-1 py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 hover:border-[#D4AF37]/50 flex items-center justify-center gap-2 text-xs font-mono text-zinc-800 dark:text-zinc-200 cursor-pointer"
        >
          <RotateCw className="w-4 h-4 text-[#D4AF37]" />
          <span>Rotation ({state.rotation}°)</span>
        </button>

        <button
          onClick={toggleFlip}
          className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-mono cursor-pointer transition-all ${
            state.flipHorizontal
              ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] font-bold"
              : "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-white/10 text-zinc-800 dark:text-zinc-200"
          }`}
        >
          <FlipHorizontal className="w-4 h-4" />
          <span>Miroir</span>
        </button>
      </div>

      <div className="space-y-1.5">
        <span className="text-[11px] text-zinc-600 dark:text-zinc-400">Ratio d'aspect :</span>
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
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-white/10"
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
              : "bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-white/10"
          }`}
        >
          {state.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#D4AF37]" />}
          <span>{state.isMuted ? "Sourdine" : "Son Actif"}</span>
        </button>
      </div>

      <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900/80 p-3 rounded-xl border border-zinc-200 dark:border-white/10">
        <span className="text-[11px] text-zinc-700 dark:text-zinc-300 w-20">Volume Video</span>
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
          className="flex-1 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D4AF37] disabled:opacity-40"
        />
        <span className="text-[11px] font-mono text-[#D4AF37] font-bold w-10 text-right">
          {state.isMuted ? "0%" : `${state.volume}%`}
        </span>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={state.fadeIn}
            onChange={(e) => {
              const checked = e.target.checked;
              onChange((prev) => ({ ...prev, fadeIn: checked }));
            }}
            className="rounded border-zinc-400 accent-[#D4AF37]"
          />
          Fondu d'entrée audio
        </label>

        <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={state.fadeOut}
            onChange={(e) => {
              const checked = e.target.checked;
              onChange((prev) => ({ ...prev, fadeOut: checked }));
            }}
            className="rounded border-zinc-400 accent-[#D4AF37]"
          />
          Fondu de sortie audio
        </label>
      </div>
    </div>
  );
}

// 7. TEXT PANEL
export function TextPanel({ state, onChange }: PanelProps) {
  const [inputText, setInputText] = React.useState("");
  const [textColor, setTextColor] = React.useState("#FFFFFF");
  const [bgColor, setBgColor] = React.useState("#00000080");

  const addText = () => {
    if (!inputText.trim()) return;
    const newOverlay: VideoTextOverlay = {
      id: "txt_" + Date.now(),
      text: inputText.trim(),
      color: textColor,
      bgColor: bgColor,
      fontSize: 22,
      isBold: true,
      isItalic: false,
      x: 50,
      y: 50,
    };
    onChange((prev) => ({
      ...prev,
      texts: [...prev.texts, newOverlay],
    }));
    setInputText("");
  };

  const removeText = (id: string) => {
    onChange((prev) => ({
      ...prev,
      texts: prev.texts.filter((t) => t.id !== id),
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Superposition de texte
        </span>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Glissez le texte sur l'aperçu</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Entrez votre texte..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addText();
          }}
          className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-foreground placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]"
        />
        <input
          type="color"
          value={textColor}
          onChange={(e) => setTextColor(e.target.value)}
          className="w-8 h-8 rounded-lg border border-zinc-300 dark:border-white/20 bg-transparent cursor-pointer p-0.5"
          title="Couleur du texte"
        />
        <button
          onClick={addText}
          disabled={!inputText.trim()}
          className="bg-[#D4AF37] hover:bg-amber-400 disabled:opacity-40 text-black font-bold px-3 py-2 rounded-xl text-xs uppercase cursor-pointer shrink-0"
        >
          Ajouter
        </button>
      </div>

      {state.texts.length > 0 && (
        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
          {state.texts.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/5 text-xs text-foreground"
            >
              <span className="truncate max-w-[200px]" style={{ color: t.color }}>
                {t.text}
              </span>
              <button
                onClick={() => removeText(t.id)}
                className="text-red-500 hover:text-red-400 text-[10px] font-bold px-1 py-0.5 cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 8. STICKERS PANEL
export function StickersPanel({ state, onChange }: PanelProps) {
  const emojis = ["🔥", "❤️", "👑", "🚀", "🎵", "💃", "🕺", "🦁", "⭐", "🎉", "💯", "👏", "🏆", "🌟", "✨", "🌍"];

  const addEmoji = (emoji: string) => {
    const newSticker: VideoStickerOverlay = {
      id: "stk_" + Date.now(),
      emoji: emoji,
      size: 40,
      rotation: 0,
      x: 50,
      y: 50,
    };
    onChange((prev) => ({
      ...prev,
      stickers: [...prev.stickers, newSticker],
    }));
  };

  const removeSticker = (id: string) => {
    onChange((prev) => ({
      ...prev,
      stickers: prev.stickers.filter((s) => s.id !== id),
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
          Stickers & Emojis
        </span>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Touchez un emoji pour l'ajouter</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {emojis.map((e) => (
          <button
            key={e}
            onClick={() => addEmoji(e)}
            className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-white/10 flex items-center justify-center text-xl cursor-pointer hover:scale-110 active:scale-95 transition-all shrink-0"
          >
            {e}
          </button>
        ))}
      </div>

      {state.stickers.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          {state.stickers.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-white/10 text-xs text-foreground"
            >
              <span>{s.emoji}</span>
              <button
                onClick={() => removeSticker(s.id)}
                className="text-red-500 hover:text-red-400 font-bold text-[10px] cursor-pointer ml-1"
              >
                ×
              </button>
            </div>
          ))}
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
                  ? "bg-[#D4AF37] text-black border-amber-400 shadow-md scale-105"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/30"
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

      <div className="bg-zinc-100 dark:bg-zinc-900/80 p-3 rounded-xl border border-zinc-200 dark:border-white/10 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 w-24">Temps de capture</span>
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
            className="flex-1 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
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
