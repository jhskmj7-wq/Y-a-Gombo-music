import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Music, CheckCircle, Flame, Star, Zap } from "lucide-react";

export type InteractionEvent = "POST_CREATED" | "MESSAGE_RECEIVED" | "GOMBO_VALIDATED" | "MARKET_CONCLUDED" | "NEW_REVENUE";

class InteractionBus {
  private listeners: ((event: InteractionEvent) => void)[] = [];

  subscribe(listener: (event: InteractionEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event: InteractionEvent) {
    this.listeners.forEach(l => l(event));
  }
}

export const interactionBus = new InteractionBus();

export const LivingInteractions: React.FC = () => {
  const [activeEvent, setActiveEvent] = useState<{ id: number; type: InteractionEvent } | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const unsub = interactionBus.subscribe((eventType) => {
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        if (eventType === "MESSAGE_RECEIVED") {
          window.navigator.vibrate([50, 50, 50]);
        } else if (eventType === "GOMBO_VALIDATED") {
           window.navigator.vibrate([100, 50, 100]);
        } else {
           window.navigator.vibrate(50);
        }
      }

      setActiveEvent({ id: Date.now(), type: eventType });
      
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setActiveEvent(null);
      }, 3000);
    });

    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {activeEvent && (
        <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center overflow-hidden isolation-isolate">
          {activeEvent.type === "POST_CREATED" && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 3, 5], opacity: [1, 0.5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute w-40 h-40 rounded-full border-4 border-[#D4AF37]"
            >
               <Music className="w-10 h-10 absolute inset-0 m-auto text-[#D4AF37]" />
            </motion.div>
          )}

          {activeEvent.type === "MESSAGE_RECEIVED" && (
             <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: [0, -20, 0], opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "bounce" }}
              className="absolute bottom-20 right-10 bg-afri-bg-sec border border-[#D4AF37] p-4 rounded-2xl shadow-xl flex items-center gap-3"
            >
               <div className="w-10 h-10 rounded-full bg-afri-bg-sec flex items-center justify-center animate-pulse">
                 <Zap className="w-5 h-5 text-emerald-400" />
               </div>
               <div>
                  <p className="text-xs font-mono text-[#D4AF37]">Nouveau Message</p>
               </div>
             </motion.div>
          )}

          {activeEvent.type === "GOMBO_VALIDATED" && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -45 }}
              animate={{ scale: [0, 1.2, 1], opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="absolute bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 p-10 rounded-full flex flex-col items-center justify-center backdrop-blur-md"
            >
               <CheckCircle className="w-20 h-20 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
               <p className="font-mono font-black tracking-widest text-lg uppercase shadow-black drop-shadow-md">Gombo Validé</p>
            </motion.div>
          )}

          {activeEvent.type === "MARKET_CONCLUDED" && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 1 }}
              className="absolute flex items-center justify-center"
            >
               <div className="absolute w-60 h-60 bg-afri-bg-sec/20 rounded-full animate-ping" />
               <Star className="w-24 h-24 text-[#D4AF37] animate-pulse drop-shadow-[0_0_20px_rgba(212,175,55,1)]" />
               <p className="absolute -bottom-10 font-mono text-[#D4AF37] font-black uppercase tracking-[0.3em]">Marché Conclu</p>
            </motion.div>
          )}

          {activeEvent.type === "NEW_REVENUE" && (
             Array.from({ length: 30 }).map((_, i) => (
               <motion.div
                  key={i}
                  initial={{ 
                    y: -window.innerHeight / 2, 
                    x: Math.random() * window.innerWidth - window.innerWidth / 2,
                    opacity: 1,
                    scale: Math.random() * 0.5 + 0.5
                  }}
                  animate={{ 
                    y: window.innerHeight / 2, 
                    opacity: 0,
                    rotate: Math.random() * 360
                  }}
                  transition={{ 
                    duration: Math.random() * 1.5 + 0.5,
                    ease: "easeIn"
                  }}
                  className="absolute w-3 h-3 bg-afri-bg-sec shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                  style={{ borderRadius: i % 2 === 0 ? '50%' : '2px' }}
               />
             ))
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
