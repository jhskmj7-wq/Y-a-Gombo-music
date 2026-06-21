import { Howl } from "howler";
import { audioSynth } from "../lib/audio";
import { performanceState } from "./performanceService";

// Ensure settings exist in localStorage
if (localStorage.getItem("gombo_pref_ui_sounds") === null) {
  localStorage.setItem("gombo_pref_ui_sounds", "true");
}
if (localStorage.getItem("gombo_pref_vibration") === null) {
  localStorage.setItem("gombo_pref_vibration", "true");
}
if (localStorage.getItem("gombo_pref_volume") === null) {
  localStorage.setItem("gombo_pref_volume", "70");
}
if (localStorage.getItem("gombo_pref_sound_mode") === null) {
  localStorage.setItem("gombo_pref_sound_mode", "Standard"); // Silencieux, Standard, Immersion
}

// Preload critical message and notification sounds ONLY
// All other sounds are loaded strictly on demand (preload: false)
const sounds: Record<string, Howl> = {
  login: new Howl({
    src: ["/sounds/login.mp3"],
    preload: false, // Chargement à la demande
    onloaderror: () => playSynthFallback("login"),
    onplayerror: () => playSynthFallback("login")
  }),
  message: new Howl({
    src: ["/sounds/message.mp3"],
    preload: true, // Précharger
    onloaderror: () => playSynthFallback("message"),
    onplayerror: () => playSynthFallback("message")
  }),
  publish: new Howl({
    src: ["/sounds/publish.mp3"],
    preload: false, // Chargement à la demande
    onloaderror: () => playSynthFallback("publish"),
    onplayerror: () => playSynthFallback("publish")
  }),
  success: new Howl({
    src: ["/sounds/success.mp3"],
    preload: false, // Chargement à la demande
    onloaderror: () => playSynthFallback("success"),
    onplayerror: () => playSynthFallback("success")
  }),
  notification: new Howl({
    src: ["/sounds/notification.mp3"],
    preload: true, // Précharger
    onloaderror: () => playSynthFallback("notification"),
    onplayerror: () => playSynthFallback("notification")
  }),
  collaboration: new Howl({
    src: ["/sounds/collaboration.mp3"],
    preload: false, // Chargement à la demande
    onloaderror: () => playSynthFallback("collaboration"),
    onplayerror: () => playSynthFallback("collaboration")
  }),
  premium: new Howl({
    src: ["/sounds/premium.mp3"],
    preload: false, // Chargement à la demande
    onloaderror: () => playSynthFallback("premium"),
    onplayerror: () => playSynthFallback("premium")
  }),
  tambour: new Howl({
    src: ["/sounds/tambour.mp3"],
    preload: false, // Chargement à la demande
    onloaderror: () => playSynthFallback("tambour"),
    onplayerror: () => playSynthFallback("tambour")
  }),
  piano: new Howl({
    src: ["/sounds/piano.mp3"],
    preload: false, // Chargement à la demande
    onloaderror: () => playSynthFallback("piano"),
    onplayerror: () => playSynthFallback("piano")
  }),
  saxophone: new Howl({
    src: ["/sounds/saxophone.mp3"],
    preload: false, // Chargement à la demande
    onloaderror: () => playSynthFallback("saxophone"),
    onplayerror: () => playSynthFallback("saxophone")
  })
};

// High-fidelity local synthesizers using Web Audio API for unmatched authenticity and performance
function playSynthFallback(soundName: string) {
  // Always verify if sounds are enabled first
  if (localStorage.getItem("gombo_pref_ui_sounds") === "false") {
    return;
  }

  // Trigger brief, elegant vibrations if active & supported
  if (!performanceState.areVibrationsReduced) {
    if (localStorage.getItem("gombo_pref_vibration") !== "false" && typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate(12); } catch (_) {}
    }
  } else {
    // Under low battery / vibration preservation mode, only do a ultra-short micro vibration (6ms)
    if (localStorage.getItem("gombo_pref_vibration") !== "false" && typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate(4); } catch (_) {}
    }
  }

  // Retrieve current sound preset mode
  const mode = localStorage.getItem("gombo_pref_sound_mode") || "Standard";
  if (mode === "Silencieux") return;

  // Adapt gain/volume slightly based on mode
  let multiplier = mode === "Immersion" ? 1.3 : 1.0;

  // Reduce sound intensity dynamically if Battery Save is active
  if (performanceState.areSoundsReduced) {
    multiplier *= 0.4;
  }

  try {
    switch (soundName) {
      case "login":
        // Petite montée kora/piano + percussion tam-tam
        audioSynth.playTamTam(false);
        setTimeout(() => {
          audioSynth.playKoraNote(261.63, 0, 0.18 * multiplier, 0.4); // C4
          audioSynth.playKoraNote(329.63, 80, 0.18 * multiplier, 0.4); // E4
          audioSynth.playKoraNote(392.00, 160, 0.22 * multiplier, 0.6); // G4
        }, 100);
        break;

      case "publish":
        // Notes montantes kora/piano douces
        audioSynth.playKoraNote(329.63, 0, 0.15 * multiplier, 0.5); // E4
        audioSynth.playKoraNote(392.00, 100, 0.18 * multiplier, 0.5); // G4
        audioSynth.playKoraNote(523.25, 200, 0.22 * multiplier, 0.8); // C5
        break;

      case "message":
        // Tambour léger
        audioSynth.playTamTam(true);
        break;

      case "collaboration":
        // Saxophone premium + mini djembe
        audioSynth.playTamTam(false);
        // Play soulful high notes on our synthesized saxophone
        setTimeout(() => {
          try {
            // Freq: A4 (440Hz), duration 1.2s
            if (performanceState.areSoundsReduced) {
              (audioSynth as any).playSaxophone?.(587.33, 0.05 * multiplier, 0.4); // shorter & softer saxophone
            } else {
              (audioSynth as any).playSaxophone?.(587.33, 0.14 * multiplier, 1.2); // D5
            }
          } catch (_) {
            audioSynth.playKoraNote(587.33, 0, 0.2, 0.6);
          }
        }, 50);
        break;

      case "success":
        // Petit jingle AFRIGOMBO céleste
        audioSynth.playKoraSuccess();
        break;

      case "notification":
        // Note afro discrète (high pitch bell representation)
        audioSynth.playKoraNote(783.99, 0, 0.12 * multiplier, 0.3); // G5 discrète
        break;

      case "premium":
        // Rich celebratory kora suite + dual bongos
        audioSynth.playTamTam(false);
        if (!performanceState.areSoundsReduced) {
          setTimeout(() => audioSynth.playTamTam(true), 120);
          setTimeout(() => audioSynth.playKoraSuccess(), 200);
        } else {
          setTimeout(() => audioSynth.playKoraNote(523.25, 0, 0.1 * multiplier, 0.3), 100);
        }
        break;

      case "tambour":
        audioSynth.playTamTam(false);
        break;

      case "piano":
        audioSynth.playKoraNote(440.00, 0, 0.2 * multiplier, 0.5);
        break;

      case "saxophone":
        try {
          if (performanceState.areSoundsReduced) {
            (audioSynth as any).playSaxophone?.(440.00, 0.05 * multiplier, 0.4);
          } else {
            (audioSynth as any).playSaxophone?.(440.00, 0.15 * multiplier, 1.0);
          }
        } catch (_) {
          audioSynth.playKoraNote(440.00, 0, 0.15 * multiplier, 0.5);
        }
        break;

      default:
        audioSynth.playTamTam(true);
    }
  } catch (err) {
    console.warn("Synth play error for", soundName, err);
  }
}

export const playSound = (soundName: string) => {
  if (localStorage.getItem("gombo_pref_ui_sounds") === "false") {
    return;
  }

  const mode = localStorage.getItem("gombo_pref_sound_mode") || "Standard";
  if (mode === "Silencieux") return;

  const sound = sounds[soundName];
  if (sound) {
    // Set volume relative to localStorage preference
    const volSetting = parseInt(localStorage.getItem("gombo_pref_volume") || "70");
    let modeMultiplier = mode === "Immersion" ? 1.3 : 1.0;

    // Reduce sound intensity dynamically if Battery Save is active
    if (performanceState.areSoundsReduced) {
      modeMultiplier *= 0.4;
    }

    sound.volume((volSetting / 100) * modeMultiplier);

    try {
      sound.play();
    } catch (_) {
      // Fallback instantly if blocked
      playSynthFallback(soundName);
    }
  } else {
    // Backup fallback triggers general synthesized notes
    playSynthFallback(soundName);
  }
};
