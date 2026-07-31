import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Coins, Zap, Calendar, CheckCircle2, Sparkles, X, Trophy } from 'lucide-react';
import { AvatarEngine, DAILY_REWARD_SCHEDULE } from '../../lib/avatarEngine';
import { useAuth } from '../../AuthContext';

interface DailyRewardModalProps {
  onClose: () => void;
  onRewardClaimed?: (coins: number, xp: number) => void;
}

export default function DailyRewardModal({ onClose, onRewardClaimed }: DailyRewardModalProps) {
  const { currentUser, profile } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState<{ coins: number; xp: number; day: number; bonusBadge?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const streak = Number(profile?.streak) || 0;
  const lastDailyReward = profile?.lastDailyReward;
  const todayStr = new Date().toISOString().split("T")[0];
  const isAlreadyClaimedToday = lastDailyReward === todayStr;

  const currentDayIndex = isAlreadyClaimedToday ? (streak === 0 ? 0 : streak - 1) : (streak % 7);

  const handleClaim = async () => {
    if (!currentUser) return;
    setClaiming(true);
    setErrorMsg(null);

    try {
      const reward = await AvatarEngine.claimDailyReward(currentUser.uid, profile);
      setClaimedReward(reward);
      if (onRewardClaimed) {
        onRewardClaimed(reward.coins, reward.xp);
      }
    } catch (err: any) {
      console.error("Daily claim error:", err);
      setErrorMsg(err.message || "Erreur lors de la récupération du bonus.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-left font-sans">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Gift className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                BONUS QUOTIDIEN
                <span className="px-2 py-0.5 bg-[#D4AF37] text-black text-[9px] font-mono font-black rounded-full">
                  7 JOURS
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Connectez-vous chaque jour pour cumuler des Gombo Coins et monter de niveau !
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6 relative z-10">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl">
              {errorMsg}
            </div>
          )}

          {/* Claim Success Display */}
          <AnimatePresence>
            {claimedReward && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-6 bg-gradient-to-br from-[#D4AF37]/20 via-zinc-900 to-emerald-500/20 border border-[#D4AF37] rounded-3xl text-center space-y-3"
              >
                <div className="w-16 h-16 bg-[#D4AF37] text-black rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                  <Sparkles className="w-8 h-8 animate-spin" />
                </div>
                <h4 className="text-xl font-black text-white uppercase tracking-wider">
                  RÉCOMPENSE RÉCUPÉRÉE ! 🎉
                </h4>
                <div className="flex items-center justify-center gap-4 text-sm font-mono font-black">
                  <span className="px-4 py-2 bg-[#D4AF37] text-black rounded-xl flex items-center gap-1.5 shadow">
                    <Coins className="w-4 h-4" />
                    +{claimedReward.coins} Gombo Coins
                  </span>
                  <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    +{claimedReward.xp} XP
                  </span>
                </div>
                {claimedReward.bonusBadge && (
                  <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wide">
                    {claimedReward.bonusBadge} Débloqué !
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 7 Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {DAILY_REWARD_SCHEDULE.map((item, idx) => {
              const dayNum = item.day;
              const isPast = dayNum <= streak && (isAlreadyClaimedToday || dayNum < streak);
              const isCurrent = dayNum === (isAlreadyClaimedToday ? streak : (streak % 7) + 1);

              return (
                <div
                  key={dayNum}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center justify-between gap-1 transition ${
                    isPast
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 opacity-80"
                      : isCurrent
                        ? "bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-lg shadow-[#D4AF37]/10 scale-105"
                        : "bg-zinc-950 border-zinc-800 text-zinc-500"
                  }`}
                >
                  <span className="text-[9px] font-mono font-bold uppercase">J{dayNum}</span>
                  <Coins className={`w-4 h-4 ${isCurrent ? "text-[#D4AF37]" : "text-zinc-600"}`} />
                  <span className="text-[10px] font-mono font-black text-[#D4AF37]">+{item.coins}</span>
                  {isPast ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-1" />
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Action Claim Button */}
          {!claimedReward && (
            <button
              onClick={handleClaim}
              disabled={claiming || isAlreadyClaimedToday}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                isAlreadyClaimedToday
                  ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                  : "bg-[#D4AF37] text-black hover:bg-white"
              }`}
            >
              {claiming ? (
                <span className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
              ) : isAlreadyClaimedToday ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Bonus Quotidien Récupéré
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  Réclamer le Bonus du Jour
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
