import React, { useState } from "react";
import { AndroidPageLayout } from "../layout/AndroidPageLayout";
import { AndroidCard } from "../layout/AndroidCard";

export function MessagingV2({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("discussions");

  const tabs = [
    { id: "discussions", label: "💬 Discussions" },
    { id: "calls", label: "📞 Appels" },
    { id: "activities", label: "🔔 Activités" },
    { id: "settings", label: "⚙ Paramètres" },
  ];

  return (
    <AndroidPageLayout title="Messagerie" onBack={onBack}>
      {/* Tabs */}
      <div className="flex bg-afri-bg-sec rounded-xl p-1 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === tab.id
                ? "bg-afri-gold text-afri-bg"
                : "text-afri-text-sec"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {activeTab === "discussions" && <AndroidCard>Discussions List...</AndroidCard>}
        {activeTab === "calls" && <AndroidCard>Calls List...</AndroidCard>}
        {activeTab === "activities" && <AndroidCard>Activities List...</AndroidCard>}
        {activeTab === "settings" && <AndroidCard>Messaging Settings...</AndroidCard>}
      </div>
    </AndroidPageLayout>
  );
}
