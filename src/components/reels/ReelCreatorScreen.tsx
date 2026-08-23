import React, { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Camera, RotateCcw, Circle, Square, Image as ImageIcon, X, ChevronRight } from "lucide-react";

interface ReelCreatorScreenProps {
  onVideoReady: (file: File) => void;
  onClose: () => void;
}

const MAX_DURATION_SECONDS = 90;

export default function ReelCreatorScreen({ onVideoReady, onClose }: ReelCreatorScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  const stopVideoTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopAllStreams = useCallback(() => {
    stopVideoTracks();
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  }, [stopVideoTracks]);

  const stopStream = stopVideoTracks;

  const startCamera = useCallback(async (mode: "user" | "environment") => {
    setCameraError(null);
    setIsStarting(true);
    
    // Stop only previous video tracks so audio remains untouched
    stopVideoTracks();

    try {
      // 1. Get audio stream only once if not already available or active
      let audioStream = audioStreamRef.current;
      const isAudioActive = audioStream && audioStream.getAudioTracks().some((t) => t.readyState === "live");
      if (!isAudioActive) {
        try {
          audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStreamRef.current = audioStream;
        } catch (audioErr) {
          console.warn("[REEL CREATOR] Audio permission/access warning:", audioErr);
        }
      }

      // 2. Request only video on camera switch (with optimized preview resolution: 480x854)
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 480 }, height: { ideal: 854 } },
        audio: false
      });

      // 3. Combine video tracks and audio tracks into a single stream
      const combinedTracks = [
        ...videoStream.getVideoTracks(),
        ...(audioStreamRef.current ? audioStreamRef.current.getAudioTracks() : [])
      ];
      const combinedStream = new MediaStream(combinedTracks);
      streamRef.current = combinedStream;

      if (videoRef.current) {
        const videoEl = videoRef.current;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.srcObject = combinedStream;
        await new Promise<void>((resolve) => {
          videoEl.onloadedmetadata = () => {
            videoEl.play().catch((playErr) => {
              console.warn("[REEL CREATOR] Play error:", playErr);
            });
            resolve();
          };
        });
      }
    } catch (err) {
      console.error("[REEL CREATOR] Camera access error:", err);
      setCameraError("Impossible d'accéder à la caméra. Vérifie les autorisations.");
    } finally {
      setIsStarting(false);
    }
  }, [stopVideoTracks]);

  useEffect(() => {
    startCamera(facingMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  useEffect(() => {
    return () => {
      stopAllStreams();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopAllStreams]);

  const switchCamera = () => {
    if (isRecording) return;
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    let mimeType = "video/webm;codecs=vp8,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "";
    }
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType, videoBitsPerSecond: 2_500_000 } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
    };

    recorder.start();
    setIsRecording(true);
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= MAX_DURATION_SECONDS) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopStream();
  };

  const handleGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setCameraError("Merci de choisir un fichier vidéo.");
      return;
    }
    setRecordedBlob(file);
    setRecordedUrl(URL.createObjectURL(file));
    stopStream();
  };

  const handleRetake = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setElapsedSeconds(0);
    startCamera(facingMode);
  };

  const handleNext = () => {
    if (!recordedBlob) return;
    const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
    const file = new File([recordedBlob], `reel_${Date.now()}.${ext}`, { type: recordedBlob.type });
    onVideoReady(file);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // PREVIEW MODE (after recording or import)
  if (recordedUrl) {
    return createPortal(
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
        <div className="flex items-center justify-between p-4">
          <button onClick={handleRetake} className="text-white p-2 rounded-full bg-black/40">
            <X className="w-6 h-6" />
          </button>
          <span className="text-white text-sm font-mono">Aperçu</span>
          <button onClick={handleNext} className="flex items-center gap-1 bg-[#D4AF37] text-black font-bold px-4 py-2 rounded-full text-sm">
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <video ref={previewRef} src={recordedUrl} controls autoPlay loop playsInline className="max-h-full max-w-full" />
        </div>
      </div>,
      document.body
    );
  }

  // CAMERA / RECORDING MODE
  return createPortal(
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
      <div className="flex items-center justify-between p-4 relative z-10">
        <button onClick={onClose} className="text-white p-2 rounded-full bg-black/40">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white text-sm font-mono">{isRecording ? formatTime(elapsedSeconds) : "Nouveau Réel"}</span>
        <button onClick={switchCamera} disabled={isRecording} className="text-white p-2 rounded-full bg-black/40 disabled:opacity-40">
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-zinc-950">
        {cameraError ? (
          <div className="text-center px-6">
            <Camera className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">{cameraError}</p>
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
        {isStarting && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 text-white text-xs font-mono shadow-lg border border-white/10">
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Changement...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 flex items-center justify-between relative z-10">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isRecording}
          className="w-12 h-12 rounded-xl bg-zinc-900/80 flex items-center justify-center text-white disabled:opacity-40"
        >
          <ImageIcon className="w-6 h-6" />
        </button>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!!cameraError}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-40"
        >
          {isRecording ? (
            <Square className="w-8 h-8 text-red-500 fill-red-500" />
          ) : (
            <Circle className="w-16 h-16 text-red-500 fill-red-500" />
          )}
        </button>

        <div className="w-12 h-12" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleGalleryFile}
      />
    </div>,
    document.body
  );
}
