import React from "react";
import { MessageSquare, PhoneCall, Activity, Settings, Crown } from "lucide-react";

export interface MessagesBottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadCount?: number;
}

export default function MessagesBottomNavigation({
  activeTab,
  onTabChange,
  unreadCount = 0
}: MessagesBottomNavigationProps) {
  const tabs = [
    { id: "discussions", label: "Discussions", icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: "appels", label: "Appels", icon: PhoneCall },
    { id: "activites", label: "Activités", icon: Activity },
    { id: "parametres", label: "Paramètres", icon: Settings },
    { id: "afrigombo", label: "AFRIGOMBO ELITE", icon: Crown },
  ];

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 h-[72px] bg-afri-bg-sec border-t border-afri-border z-[999] flex justify-around items-center px-2 select-none shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.6)]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)"
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => {
              if (navigator.vibrate) {
                try { navigator.vibrate(20); } catch (e) {}
              }
              onTabChange(tab.id);
            }}
            className={`relative flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 cursor-pointer group ${
              isActive ? "text-[#D4AF37]" : "text-afri-text-sec hover:text-afri-text"
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110 text-[#D4AF37]" : "group-hover:scale-105"}`} />
              {tab.badge && (
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full animate-bounce">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-bold tracking-tight mt-1 transition-colors ${isActive ? "text-[#D4AF37] font-black" : ""}`}>
              {tab.label}
            </span>
            {isActive && (
              <span className="absolute bottom-1 w-6 h-0.5 bg-[#D4AF37] rounded-full animate-fadeIn" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
