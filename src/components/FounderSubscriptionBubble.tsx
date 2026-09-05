import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Crown, Sparkles, X, CheckCircle2, Clock } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

const STORAGE_KEY = "afrigombo_founder_dash_bubble_pos";
const ENABLED_STORAGE_KEY = "afrigombo_founder_dash_bubble_enabled";

export interface FounderSubscriptionBubbleProps {
  onOpenSubscriptions: () => void;
  isActiveModule?: boolean;
  onClose?: () => void;
  audioSynth?: any;
}

export const FounderSubscriptionBubble: React.FC<FounderSubscriptionBubbleProps> = ({
  onOpenSubscriptions,
  isActiveModule = false,
  onClose,
  audioSynth
}) => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ENABLED_STORAGE_KEY) !== "false";
    }
    return true;
  });

  // Real-time listener for pending subscription requests strictly
  useEffect(() => {
    if (!db) return;

    const q = query(
      collection(db, "subscription_requests"),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setPendingCount(snap.size);
      },
      (err) => {
        console.warn("Founder subscription bubble sync notice:", err);
      }
    );

    return () => unsub();
  }, []);

  // Handle bubble position & drag
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
    hasDragged: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialPosX: 0,
    initialPosY: 0,
    hasDragged: false
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          const clampedX = Math.max(10, Math.min(window.innerWidth - 75, parsed.x));
          const clampedY = Math.max(60, Math.min(window.innerHeight - 85, parsed.y));
          setPosition({ x: clampedX, y: clampedY });
          return;
        }
      }
    } catch (_) {}

    // Default position: bottom-right inside Founder Dashboard
    if (typeof window !== "undefined") {
      setPosition({
        x: Math.max(10, window.innerWidth - 80),
        y: Math.max(70, window.innerHeight - 150)
      });
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragRef.current.startX = clientX;
    dragRef.current.startY = clientY;
    dragRef.current.initialPosX = position ? position.x : window.innerWidth - 80;
    dragRef.current.initialPosY = position ? position.y : window.innerHeight - 150;
    dragRef.current.hasDragged = false;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;

    if (Math.hypot(deltaX, deltaY) > 6) {
      dragRef.current.hasDragged = true;
      setIsDragging(true);

      const newX = Math.max(10, Math.min(window.innerWidth - 75, dragRef.current.initialPosX + deltaX));
      const newY = Math.max(60, Math.min(window.innerHeight - 85, dragRef.current.initialPosY + deltaY));

      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    if (isDragging && position) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
      } catch (_) {}
    }
    setTimeout(() => {
      setIsDragging(false);
    }, 50);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragRef.current.hasDragged) {
      e.stopPropagation();
      return;
    }
    try {
      audioSynth?.playValidationSuccess?.();
    } catch (_) {}
    onOpenSubscriptions();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEnabled(false);
    try {
      localStorage.setItem(ENABLED_STORAGE_KEY, "false");
    } catch (_) {}
    if (onClose) onClose();
  };

  if (!isEnabled || !position) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9990,
        touchAction: "none"
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={isDragging ? handleTouchMove : undefined}
      onMouseUp={handleTouchEnd}
      onClick={handleClick}
      className="cursor-pointer select-none group focus:outline-none"
      title="Accès rapide : Gestion des Abonnements Bêta"
    >
      <motion.div
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 border-2 transition-all flex items-center justify-center shadow-xl ${
          isActiveModule
            ? "border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_25px_rgba(212,175,55,0.6)]"
            : "border-[#D4AF37] hover:border-amber-300 shadow-[0_0_20px_rgba(212,175,55,0.35)]"
        }`}
      >
        <Crown className={`w-7 h-7 transition-colors ${isActiveModule ? "text-amber-300" : "text-[#D4AF37]"} ${pendingCount > 0 ? "animate-pulse" : ""}`} />

        {/* Real-time dynamic pending count badge */}
        {pendingCount > 0 ? (
          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-black font-mono font-black text-[11px] shadow-lg border-2 border-black animate-bounce flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5 inline" />
            {pendingCount}
          </span>
        ) : (
          <span
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black shadow"
            title="Toutes les demandes sont traitées"
          />
        )}

        {/* Subtle hover tooltip */}
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 border border-zinc-700 text-[9px] font-mono font-bold text-amber-300 uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Abonnements ({pendingCount})
        </div>

        {/* Discreet Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 hover:border-red-500 text-zinc-400 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
          title="Masquer la bulle (réactivable dans les paramètres)"
        >
          <X className="w-3 h-3" />
        </button>
      </motion.div>
    </div>
  );
};

export default FounderSubscriptionBubble;
