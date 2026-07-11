import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { auth } from "../lib/firebase";
import { getRedirectResult } from "firebase/auth";

export default function SuperFounderDebug() {
  const isDebugMode = (typeof window !== "undefined" && window.location.search.includes("debug=true")) || import.meta.env.DEV;

  if (!isDebugMode) return null;

  const { currentUser } = useAuth();
  const [redirectResult, setRedirectResult] = useState<any>(null);
  const [redirectError, setRedirectError] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (auth) {
      getRedirectResult(auth).then((result) => {
        setRedirectResult(result);
      }).catch((error) => {
        setRedirectError(error);
      });
    }
  }, []);

  useEffect(() => {
    const isDev = import.meta.env.DEV || (typeof process !== "undefined" && process.env?.NODE_ENV !== "production");
    const search = typeof window !== "undefined" ? window.location.search : "";
    if (isDev || search.includes("debug=true")) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen) {
    // Hidden trigger button only visible in debug/dev
    return (
      <button
        type="button"
        title="Sec"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-0 right-0 w-2 h-2 bg-transparent hover:bg-red-500/20 border-0 outline-none z-[99999] cursor-default"
      />
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-black/95 border-2 border-red-500 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto font-mono text-[10px] text-red-400 shadow-2xl">
      <div className="flex items-center justify-between border-b border-red-500/30 pb-2 mb-2">
        <h3 className="text-white font-bold uppercase">Diagnostic Super Fondateur</h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-500 text-white rounded text-[9px] uppercase transition-colors"
        >
          Masquer
        </button>
      </div>
      
      <div className="space-y-2">
        <div><strong className="text-white">Date:</strong> {new Date().toLocaleString()}</div>
        <div><strong className="text-white">Domain actuel:</strong> {window.location.hostname}</div>
        <div><strong className="text-white">Firebase Project ID:</strong> {auth?.app?.options?.projectId || "N/A"}</div>
        <div><strong className="text-white">Authorized Domain:</strong> Doit être configuré dans Firebase Console (Authentication &gt; Settings &gt; Authorized domains)</div>
        
        <div className="mt-4 pt-2 border-t border-red-500/30">
          <strong className="text-white uppercase">Current User</strong>
          {currentUser ? (
            <div className="pl-2 mt-1 space-y-1">
              <div>UID: {currentUser.uid}</div>
              <div>Email: {currentUser.email}</div>
              <div>DisplayName: {currentUser.displayName || "N/A"}</div>
              <div>PhotoURL: {currentUser.photoURL ? "Présente" : "N/A"}</div>
              <div>Provider: {currentUser.providerData?.[0]?.providerId || "N/A"}</div>
            </div>
          ) : (
            <div className="pl-2 mt-1">Non connecté</div>
          )}
        </div>

        <div className="mt-4 pt-2 border-t border-red-500/30">
          <strong className="text-white uppercase">Redirect Result</strong>
          {redirectResult ? (
            <div className="pl-2 mt-1">
              User UID: {redirectResult.user?.uid}
            </div>
          ) : (
            <div className="pl-2 mt-1">Aucun ou en attente...</div>
          )}
          
          {redirectError && (
            <div className="pl-2 mt-1 text-red-500 font-bold">
              [ERREUR] {redirectError.code} - {redirectError.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
