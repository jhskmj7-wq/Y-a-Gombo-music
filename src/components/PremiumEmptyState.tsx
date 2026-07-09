import React from "react";
import { FolderOpen, LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface PremiumEmptyStateProps {
  message?: string;
  submessage?: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export function PremiumEmptyState({
  message = "Aucune donnée disponible pour le moment.",
  submessage,
  icon: Icon = FolderOpen,
  actionText,
  onAction
}: PremiumEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center p-8 text-center bg-[#070708] border border-zinc-900 rounded-2xl max-w-md mx-auto my-6 shadow-xl"
    >
      <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-850 flex items-center justify-center text-[#D4AF37] mb-4 shadow-inner">
        <Icon className="w-6 h-6 opacity-80" />
      </div>
      <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
        {message}
      </h3>
      {submessage && (
        <p className="text-xs text-zinc-400 font-mono leading-relaxed mb-4 max-w-xs">
          {submessage}
        </p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-black uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md"
        >
          {actionText}
        </button>
      )}
    </motion.div>
  );
}

export default PremiumEmptyState;
