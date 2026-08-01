import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Flame, Briefcase, User, Megaphone } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { requireAuth } = useAuth();

  const navItems = [
    { name: 'ACCUEIL', path: '/home', icon: Home, requiresAuth: false },
    { name: 'VIBES', path: '/vibes', icon: Flame, requiresAuth: false },
    { name: 'PUBLIER', path: '/publish', icon: null, requiresAuth: true },
    { name: 'MES GOMBOS', path: '/my-gombos', icon: Megaphone, requiresAuth: true },
    { name: 'MON HÉRITAGE', path: '/heritage', icon: User, requiresAuth: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-afri-bg-sec/95 backdrop-blur-2xl border-t border-afri-border px-2 pt-2 pb-safe flex justify-around items-center h-[64px] box-border touch-manipulation select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;

        if (item.name === 'PUBLIER') {
          return (
            <div key={item.name} className="relative -top-4 flex flex-col items-center">
              <button
                id="nav-btn-publier"
                onClick={() => {
                  requireAuth(() => {
                    navigate(item.path);
                  });
                }}
                className="w-13 h-13 rounded-full bg-gradient-to-r from-[#E5C158] to-[#D4AF37] border-4 border-afri-bg flex items-center justify-center text-black cursor-pointer shadow-[0_6px_20px_rgba(212,175,55,0.4)] active:scale-90 transition-all touch-manipulation min-h-[52px] min-w-[52px]"
                aria-label="Publier un nouveau Gombo"
              >
                <span className="text-3xl font-light leading-none">+</span>
              </button>
              <span className="text-[9px] font-black text-afri-text mt-0.5 tracking-wider uppercase">PUBLIER</span>
            </div>
          );
        }

        return (
          <button
            id={`nav-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            key={item.name}
            onClick={() => {
              if (item.requiresAuth) {
                requireAuth(() => {
                  navigate(item.path);
                });
              } else {
                navigate(item.path);
              }
            }}
            className={`flex flex-col items-center justify-center cursor-pointer transition-all min-w-[56px] min-h-[48px] px-1 py-1 rounded-2xl touch-manipulation active:scale-95 ${
              active 
                ? 'text-[#D4AF37]' 
                : 'text-afri-text-sec'
            }`}
          >
            <div className={`px-3 py-1 rounded-full transition-colors ${active ? 'bg-[#D4AF37]/15' : 'bg-transparent'}`}>
              {Icon && <Icon size={20} className={active ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />}
            </div>
            <span className={`text-[8.5px] tracking-wider uppercase truncate max-w-full mt-0.5 ${active ? 'font-black text-[#D4AF37]' : 'font-semibold text-afri-text-sec'}`}>
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

