import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Crown, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../AuthContext";
import { SecurityService } from "../lib/SecurityService";

const STORAGE_KEY = "afrigombo_founder_bubble_pos";
const ENABLED_STORAGE_KEY = "afrigombo_founder_bubble_enabled";

export const FounderSubscriptionBubble: React.FC = () => {
  const { currentUser, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ENABLED_STORAGE_KEY) !== "false";
    }
    return true;
  });

  // Verify if current user is the Founder
  const isFounder = SecurityService.isFounder(currentUser) || 
                    SecurityService.isFounder(profile) || 
                    currentUser?.email?.toLowerCase() === "jhs.kmj7@gmail.com" ||
                    profile?.isFounder === true;

  // Real-time listener for pending subscription requests
  useEffect(() => {
    if (!isFounder || !db) return;

    const q = query(
      collection(db, "subscription_requests"),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(q, (snap) => {
      setPendingCount(snap.size);
    }, (err) => {
      console.warn("Founder subscription bubble sync notice:", err);
    });

    return () => unsub();
  }, [isFounder]);

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
          const clampedX = Math.max(10, Math.min(window.innerWidth - 65, parsed.x));
          const clampedY = Math.max(10, Math.min(window.innerHeight - 65, parsed.y));
          setPosition({ x: clampedX, y: clampedY });
          return;
        }
      }
    } catch (_) {}

    // Default position: bottom-right above standard bottom navigation
    if (typeof window !== "undefined") {
      setPosition({
        x: Math.max(10, window.innerWidth - 75),
        y: Math.max(10, window.innerHeight - 150)
      });
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragRef.current.startX = clientX;
    dragRef.current.startY = clientY;
    dragRef.current.initialPosX = position ? position.x : (window.innerWidth - 75);
    dragRef.current.initialPosY = position ? position.y : (window.innerHeight - 150);
    dragRef.current.hasDragged = false;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;

    if (Math.hypot(deltaX, deltaY) > 8) {
      dragRef.current.hasDragged = true;
      setIsDragging(true);

      const newX = Math.max(10, Math.min(window.innerWidth - 65, dragRef.current.initialPosX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 65, dragRef.current.initialPosY + deltaY));

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
    navigate("/Le-Throne-Of-The-Founder");
  };

  // Don't display on Founder pages themselves or if disabled / not founder
  if (!isFounder || !isEnabled || !position) return null;
  if (location.pathname.includes("Throne") || location.pathname.includes("throne")) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9998,
        touchAction: "none"
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={isDragging ? handleTouchMove : undefined}
      onMouseUp={handleTouchEnd}
      onClick={handleClick}
      className="cursor-pointer select-none group"
      title="Tableau Fondateur & Abonnements Bêta"
    >
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-black via-zinc-950 to-zinc-900 border-2 border-afri-gold shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center transition-all"
      >
        <Crown className="w-7 h-7 text-afri-gold animate-pulse" />

        {/* Real Pending requests count badge */}
        {pendingCount > 0 ? (
          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-black font-mono font-black text-[11px] shadow-lg border-2 border-black animate-bounce">
            {pendingCount}
          </span>
        ) : (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black" />
        )}
      </motion.div>
    </div>
  );
};

export default FounderSubscriptionBubble;
