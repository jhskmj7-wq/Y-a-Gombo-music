import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";

interface CarouselProps {
  items: React.ReactNode[];
  autoSlideInterval?: number;
}

export const Carousel: React.FC<CarouselProps> = ({ items, autoSlideInterval = 3000 }) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const next = useCallback(() => {
    setIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(next, autoSlideInterval);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, autoSlideInterval, next]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 50) prev();
    else if (info.offset.x < -50) next();
  };

  return (
    <div 
      className="relative w-full h-48 overflow-hidden rounded-3xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
    >
      <motion.div
        className="flex w-full h-full cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={{ x: `${-index * 100}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {items.map((item, i) => (
          <div key={i} className="min-w-full h-full flex-shrink-0">
            {item}
          </div>
        ))}
      </motion.div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {items.map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-2 rounded-full transition-all ${i === index ? "bg-afri-bg-sec w-4" : "bg-white/50"}`} 
          />
        ))}
      </div>
    </div>
  );
};
