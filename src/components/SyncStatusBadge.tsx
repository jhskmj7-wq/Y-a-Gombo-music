import React, { useState, useEffect } from "react";
import { syncManager, SyncStatus } from "../lib/SyncManager";

export default function SyncStatusBadge() {
  const [status, setStatus] = useState<SyncStatus>(syncManager.getState());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(syncManager.getState());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getColor = () => {
    switch (status) {
      case SyncStatus.ONLINE: return "bg-green-500";
      case SyncStatus.SYNCING: return "bg-yellow-500";
      case SyncStatus.OFFLINE: return "bg-red-500";
      case SyncStatus.WAITING: return "bg-white";
      case SyncStatus.FAILED: return "bg-red-700";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
      <div className={`w-2 h-2 rounded-full ${getColor()}`} />
      <span className="text-[10px] font-bold text-white uppercase">{status}</span>
    </div>
  );
}
