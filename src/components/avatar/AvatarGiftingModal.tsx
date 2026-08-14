import React, { useState, useEffect } from 'react';
import { Gift, Users, Search, Send, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { AvatarItem } from '../../types/avatar';
import { AvatarEngine } from '../../lib/avatarEngine';
import { useAuth } from '../../AuthContext';
import { AndroidBottomSheet } from '../common/AfriModal';

interface AvatarGiftingModalProps {
  item: AvatarItem;
  onClose: () => void;
  onGiftSent?: () => void;
}

interface UserOption {
  id: string;
  name: string;
  artistName?: string;
  photoURL?: string;
  avatarDataUri?: string;
}

export default function AvatarGiftingModal({ item, onClose, onGiftSent }: AvatarGiftingModalProps) {
  const { currentUser, profile } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const senderCoins = Number(profile?.avatarCoins) || 0;

  useEffect(() => {
    async function fetchUsers() {
      try {
        const snap = await getDocs(query(collection(db, "users"), limit(30)));
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as UserOption))
          .filter(u => u.id !== currentUser?.uid);
        setUsers(list);
      } catch (err) {
        console.error("Error fetching users for gift:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [currentUser]);

  const filteredUsers = users.filter(u => {
    const queryStr = searchTerm.toLowerCase();
    const nameStr = (u.name || u.artistName || "").toLowerCase();
    return nameStr.includes(queryStr);
  });

  const handleSendGift = async () => {
    if (!currentUser || !selectedUser) {
      setErrorMsg("Veuillez sélectionner un destinataire.");
      return;
    }

    if (senderCoins < item.price) {
      setErrorMsg(`Coins insuffisants. Requis : ${item.price} Gombo Coins, Solde : ${senderCoins}`);
      return;
    }

    setSending(true);
    setErrorMsg(null);

    try {
      await AvatarEngine.giftItem(
        currentUser.uid,
        profile?.artistName || profile?.displayName || profile?.name || "Un ami",
        selectedUser.id,
        selectedUser.artistName || selectedUser.name || "Ami Gombo",
        item,
        message
      );

      setSuccessMsg(`Votre cadeau (${item.name}) a été envoyé avec succès à ${selectedUser.name || 'votre ami'} ! 🎉`);
      if (onGiftSent) onGiftSent();
    } catch (err: any) {
      console.error("Gift error:", err);
      setErrorMsg(err.message || "Erreur lors de l'envoi du cadeau.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AndroidBottomSheet
      isOpen={true}
      onClose={onClose}
      title="OFFRIR UN CADEAU AVATAR"
      subtitle={`Offrir ${item.name} (${item.price} Gombo Coins)`}
    >
      <div className="space-y-5 text-left font-sans py-1">

        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg ? (
            <div className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-afri-text">{successMsg}</p>
              <button onClick={onClose} className="px-6 py-2.5 bg-[#D4AF37] text-black font-black text-xs uppercase rounded-xl">
                Fermer
              </button>
            </div>
          ) : (
            <>
              {/* Select Friend */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold text-afri-text-sec uppercase">
                  1. Choisissez le membre destinataire
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-afri-text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 scrollbar-none pr-1">
                  {loading ? (
                    <div className="text-center py-4 text-xs text-afri-text-muted font-mono">Chargement des membres...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-4 text-xs text-afri-text-muted">Aucun utilisateur trouvé</div>
                  ) : (
                    filteredUsers.map(u => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          selectedUser?.id === u.id
                            ? "bg-[#D4AF37]/20 border-[#D4AF37] text-afri-text"
                            : "bg-afri-bg border-zinc-800/80 text-afri-text-sec hover:border-afri-border"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatarDataUri || u.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-afri-border"
                          />
                          <span className="text-xs font-bold">{u.artistName || u.name}</span>
                        </div>
                        {selectedUser?.id === u.id && (
                          <span className="text-[9px] font-bold text-[#D4AF37] uppercase">Sélectionné</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-afri-text-sec uppercase">
                  2. Message personnalisé (Optionnel)
                </label>
                <textarea
                  rows={2}
                  placeholder="Un petit mot d'accompagnement..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2.5 bg-afri-bg border border-afri-border rounded-xl text-xs text-afri-text placeholder-zinc-600 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendGift}
                disabled={sending || !selectedUser}
                className="w-full py-3 bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow hover:bg-white transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-afri-border border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Offrir l'article ({item.price} Coins)
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </AndroidBottomSheet>
  );
}
