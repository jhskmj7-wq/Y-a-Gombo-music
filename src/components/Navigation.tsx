import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Flame, Plus, User, Megaphone } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';
import { useFeatureFlags } from '../lib/featureFlags';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { requireAuth, currentUser, profile } = useAuth();
  const { isModuleVisible } = useFeatureFlags(currentUser, profile);

  const triggerHaptic = () => {
    try {
      if (typeof window !== 'undefined' && navigator?.vibrate) {
        navigator.vibrate(10);
      }
    } catch (_) {}
  };

  const navItems = [
    { name: 'ACCUEIL', path: '/home', icon: Home, requiresAuth: false, featureId: 'home' },
    { name: 'VIBES', path: '/vibes', icon: Flame, requiresAuth: true, featureId: 'podcasts' },
    { name: 'PUBLIER', path: '/publish', icon: Plus, requiresAuth: true, featureId: 'gombos' },
    { name: 'MES GOMBOS', path: '/my-gombos', icon: Megaphone, requiresAuth: true, featureId: 'gombos' },
    { name: 'MON HÉRITAGE', path: '/heritage', icon: User, requiresAuth: true, featureId: 'heritage' },
  ].filter(item => isModuleVisible(item.featureId));

  if (navItems.length === 0) return null;

  return (
    <nav
      className="fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 w-[calc(100%-1.5rem)] sm:max-w-[440px] z-40 bg-afri-bg-sec/98 backdrop-blur-2xl border border-afri-border/80 rounded-2xl px-2 pt-1.5 flex justify-around items-center box-border touch-manipulation select-none shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;

        if (item.name === 'PUBLIER') {
          return (
            <div key={item.name} className="relative -top-3.5 flex flex-col items-center shrink-0">
              <button
                id="nav-btn-publier"
                onClick={() => {
                  triggerHaptic();
                  requireAuth(() => {
                    navigate(item.path);
                  });
                }}
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-r from-[#E5C158] to-[#D4AF37] border-4 border-afri-bg flex items-center justify-center text-black cursor-pointer shadow-[0_6px_20px_rgba(212,175,55,0.4)] active:scale-90 transition-transform touch-manipulation min-h-[48px] min-w-[48px]"
                aria-label="Publier un nouveau Gombo"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
              <span className="text-[8px] sm:text-[9px] font-black text-afri-text mt-0.5 tracking-wider uppercase">PUBLIER</span>
            </div>
          );
        }

        return (
          <button
            id={`nav-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            key={item.name}
            onClick={() => {
              triggerHaptic();
              if (item.requiresAuth) {
                requireAuth(() => {
                  navigate(item.path);
                });
              } else {
                navigate(item.path);
              }
            }}
            className="relative flex flex-col items-center justify-center cursor-pointer transition-all min-w-[52px] xs:min-w-[56px] min-h-[48px] px-1 py-0.5 rounded-2xl touch-manipulation active:scale-95"
          >
            <div className="relative px-3.5 py-1 rounded-full flex items-center justify-center overflow-hidden">
              {active && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-[#D4AF37]/20 rounded-full border border-[#D4AF37]/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {Icon && (
                <Icon
                  size={20}
                  className={`relative z-10 transition-colors ${
                    active ? 'text-[#D4AF37] stroke-[2.5px]' : 'text-afri-text-sec stroke-[1.8px]'
                  }`}
                />
              )}
            </div>
            <span
              className={`text-[8px] xs:text-[8.5px] tracking-wider uppercase truncate max-w-full mt-0.5 whitespace-nowrap transition-colors ${
                active ? 'font-black text-[#D4AF37]' : 'font-semibold text-afri-text-sec'
              }`}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}


