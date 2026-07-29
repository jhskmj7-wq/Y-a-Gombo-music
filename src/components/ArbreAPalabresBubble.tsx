import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

interface ArbreAPalabresBubbleProps {
  unreadCount?: number;
  onOpen: () => void;
}

const STORAGE_KEY = "afrigombo_palabre_bubble_pos";

export const ArbreAPalabresBubble: React.FC<ArbreAPalabresBubbleProps> = ({ unreadCount = 0, onOpen }) => {
  // State for coordinates (fixed in viewport)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
    longPressTimer: NodeJS.Timeout | null;
    hasDragged: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialPosX: 0,
    initialPosY: 0,
    longPressTimer: null,
    hasDragged: false
  });

  // Load initial position from localStorage or set default (bottom-right)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          // Keep within current window bounds
          const maxX = window.innerWidth - 64;
          const maxY = window.innerHeight - 64;
          setPosition({
            x: Math.min(Math.max(12, parsed.x), maxX),
            y: Math.min(Math.max(12, parsed.y), maxY)
          });
          return;
        }
      }
    } catch (_) {}

    // Default position: bottom-right (right: 16, bottom: 85)
    const defaultX = window.innerWidth - 68;
    const defaultY = window.innerHeight - 145;
    setPosition({ x: Math.max(12, defaultX), y: Math.max(12, defaultY) });
  }, []);

  if (!position) return null;

  // Touch / Mouse Start Handlers
  const handleStart = (clientX: number, clientY: number) => {
    dragRef.current.startX = clientX;
    dragRef.current.startY = clientY;
    dragRef.current.initialPosX = position.x;
    dragRef.current.initialPosY = position.y;
    dragRef.current.hasDragged = false;

    // Start long-press timer (350ms)
    dragRef.current.longPressTimer = setTimeout(() => {
      setIsLongPressing(true);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 350);
  };

  const handleMove = (clientX: number, clientY: number) => {
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;

    // If moved more than 5px, mark as drag and clear tap intention
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.hasDragged = true;
      setIsDragging(true);

      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;
      const newX = Math.min(Math.max(8, dragRef.current.initialPosX + dx), maxX);
      const newY = Math.min(Math.max(8, dragRef.current.initialPosY + dy), maxY);

      setPosition({ x: newX, y: newY });
    }
  };

  const handleEnd = () => {
    if (dragRef.current.longPressTimer) {
      clearTimeout(dragRef.current.longPressTimer);
      dragRef.current.longPressTimer = null;
    }

    if (dragRef.current.hasDragged) {
      // Save position to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
      } catch (_) {}
    } else {
      // Simple tap / click -> Open Arbre à Palabres
      onOpen();
    }

    setIsDragging(false);
    setIsLongPressing(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
        zIndex: 99
      }}
      className="select-none cursor-pointer group"
      onTouchStart={(e) => {
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => {
        handleStart(e.clientX, e.clientY);

        const onMouseMove = (ev: MouseEvent) => {
          handleMove(ev.clientX, ev.clientY);
        };

        const onMouseUp = () => {
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
          handleEnd();
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      }}
    >
      <motion.div
        animate={{
          scale: isLongPressing ? 1.15 : isDragging ? 1.08 : 1
        }}
        transition={{ duration: 0.15 }}
        className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-black border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_4px_20px_rgba(212,175,55,0.4)] ${
          isLongPressing ? "ring-4 ring-[#D4AF37]/50" : ""
        }`}
      >
        {/* Ambient Golden Glow */}
        <div className="absolute inset-0 rounded-full bg-[#D4AF37]/10 animate-pulse pointer-events-none" />

        {/* Icon */}
        <div className="flex items-center justify-center gap-0.5 text-base sm:text-lg leading-none select-none">
          <span>🌳</span>
          <span className="-ml-1 text-xs sm:text-sm">💬</span>
        </div>

        {/* Badge Notification */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse border border-black shadow-md z-10">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </motion.div>
    </div>
  );
};

export const FloatingChatBubble = ArbreAPalabresBubble;

