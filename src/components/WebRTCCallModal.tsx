import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, PhoneCall, RefreshCw, Volume2, ShieldCheck, User
} from "lucide-react";
import { CallSession, WebRTCCallService } from "../lib/webrtcCallEngine";

interface WebRTCCallModalProps {
  callSession: CallSession | null;
  callService: WebRTCCallService | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isIncoming: boolean;
  onAnswer: () => void;
  onReject: () => void;
  onEndCall: () => void;
}

export function WebRTCCallModal({
  callSession,
  callService,
  localStream,
  remoteStream,
  isIncoming,
  onAnswer,
  onReject,
  onEndCall
}: WebRTCCallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!callSession || callSession.status !== "accepted") {
      setCallDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callSession?.status]);

  if (!callSession) return null;

  const partnerName =
    isIncoming ? callSession.callerName : callSession.receiverName;
  const partnerPhoto =
    (isIncoming ? callSession.callerPhoto : callSession.receiverPhoto) ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150";

  const isVideo = callSession.type === "video";

  const handleToggleMute = () => {
    if (callService) {
      const muted = callService.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleToggleVideo = () => {
    if (callService) {
      const videoOff = callService.toggleVideo();
      setIsVideoOff(videoOff);
    }
  };

  const handleSwitchCamera = async () => {
    if (callService) {
      await callService.switchCamera();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-md bg-zinc-950 border border-[#D4AF37]/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between h-[580px] relative text-white"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37]">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider">
                Appel Souverain {isVideo ? "Vidéo" : "Audio"}
              </span>
            </div>
            {callSession.status === "accepted" && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold animate-pulse">
                {formatTime(callDuration)}
              </span>
            )}
          </div>

          {/* Video Streams / Avatar Center */}
          <div className="relative flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
            {isVideo && remoteStream ? (
              <video
                ref={(node) => {
                  if (node && remoteStream) node.srcObject = remoteStream;
                }}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center space-y-4 z-10 text-center">
                <div className="relative">
                  <img
                    src={partnerPhoto}
                    alt=""
                    className="w-28 h-28 rounded-full object-cover border-2 border-[#D4AF37] shadow-xl shadow-amber-500/20"
                    referrerPolicy="no-referrer"
                  />
                  {callSession.status === "offered" && (
                    <span className="absolute inset-0 rounded-full border-2 border-[#D4AF37] animate-ping opacity-75" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{partnerName}</h3>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    {callSession.status === "offered"
                      ? isIncoming
                        ? "Appel entrant..."
                        : "Sonnant..."
                      : callSession.status === "accepted"
                      ? "En communication"
                      : callSession.status}
                  </p>
                </div>
              </div>
            )}

            {/* Local Video Thumbnail (PIP) */}
            {isVideo && localStream && !isVideoOff && (
              <div className="absolute bottom-4 right-4 w-28 h-36 rounded-2xl border-2 border-[#D4AF37] overflow-hidden shadow-2xl z-20 bg-zinc-900">
                <video
                  ref={(node) => {
                    if (node && localStream) node.srcObject = localStream;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Controls Footer */}
          <div className="p-6 bg-gradient-to-t from-black via-zinc-950 to-transparent border-t border-zinc-900 flex items-center justify-around z-20">
            {isIncoming && callSession.status === "offered" ? (
              <>
                <button
                  onClick={onReject}
                  className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all active:scale-95 cursor-pointer"
                  title="Refuser"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
                <button
                  onClick={onAnswer}
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer animate-bounce"
                  title="Décrocher"
                >
                  <PhoneCall className="w-7 h-7 fill-current" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleToggleMute}
                  className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                    isMuted
                      ? "bg-rose-500/20 border-rose-500 text-rose-400"
                      : "bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700"
                  }`}
                  title={isMuted ? "Activer le micro" : "Couper le micro"}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                {isVideo && (
                  <>
                    <button
                      onClick={handleToggleVideo}
                      className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                        isVideoOff
                          ? "bg-rose-500/20 border-rose-500 text-rose-400"
                          : "bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700"
                      }`}
                      title={isVideoOff ? "Activer caméra" : "Désactiver caméra"}
                    >
                      {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </button>

                    <button
                      onClick={handleSwitchCamera}
                      className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white hover:border-zinc-700 transition-all cursor-pointer"
                      title="Changer de caméra"
                    >
                      <RefreshCw className="w-6 h-6" />
                    </button>
                  </>
                )}

                <button
                  onClick={onEndCall}
                  className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer"
                  title="Raccrocher"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
