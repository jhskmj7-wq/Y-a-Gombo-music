import React, { useState, useEffect } from "react";
import { runHealthCheck, HealthCheckResult } from "../../lib/HealthCheckEngine";
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export default function BetaCheckPanel() {
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(false);

  const performCheck = async () => {
    setLoading(true);
    const checkResults = await runHealthCheck();
    setResults(checkResults);
    setLoading(false);
  };

  useEffect(() => {
    performCheck();
  }, []);

  return (
    <div className="p-4 space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-white uppercase">🟢 Beta Health Check</h2>
        <button onClick={performCheck} className="bg-[#D4AF37] px-4 py-2 rounded-lg text-xs font-bold" disabled={loading}>
          {loading ? "Vérification..." : "Actualiser"}
        </button>
      </div>

      <div className="grid gap-4">
        {results.map((res) => (
          <div key={res.service} className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <span className="font-bold text-white text-sm">{res.service}</span>
            <div className="flex items-center gap-2">
              {res.status === "OK" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {res.status === "WARNING" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              {res.status === "ERROR" && <XCircle className="w-5 h-5 text-red-500" />}
              <span className={`text-xs ${res.status === "OK" ? "text-green-500" : res.status === "WARNING" ? "text-yellow-500" : "text-red-500"}`}>
                {res.message}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
