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
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[460px] bg-[#0E0E10]/95 backdrop-blur-xl border border-white/10 rounded-[28px] px-4 py-2 flex justify-between items-center z-40 shadow-[0_12px_32px_rgba(0,0,0,0.7)] h-[72px]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;

        if (item.name === 'PUBLIER') {
          return (
            <div key={item.name} className="relative -top-5 flex flex-col items-center">
              <button
                id="nav-btn-publier"
                onClick={() => {
                  requireAuth(() => {
                    navigate(item.path);
                  });
                }}
                className="w-14 h-14 rounded-full bg-[#D4AF37] border-4 border-[#0E0E10] flex items-center justify-center text-black cursor-pointer shadow-[0_6px_20px_rgba(212,175,55,0.35)] hover:scale-105 active:scale-95 transition-all"
              >
                <span className="text-3xl font-light leading-none">+</span>
              </button>
              <span className="text-[8.5px] font-bold text-white mt-1 tracking-wider uppercase">PUBLIER</span>
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
            className={`flex flex-col items-center justify-center cursor-pointer transition-all w-16 ${
              active 
                ? 'text-[#D4AF37] scale-105 font-bold' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {Icon && <Icon size={20} className={active ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />}
            <span className="text-[8px] font-bold mt-1 tracking-wider uppercase truncate max-w-full">{item.name}</span>
          </button>
        );
      })}
    </nav>
  );
}

