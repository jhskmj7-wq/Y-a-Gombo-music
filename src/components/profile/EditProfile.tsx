import React from 'react';

interface EditProfileProps {
  currentUser: any;
  currentUserProfile: any;
  onCancel: () => void;
  onSave: () => void;
  setActiveMenu: (menu: string) => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ onCancel }) => {
  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-[100dvh] flex flex-col bg-black text-white p-4" id="edit-profile-root">
      <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4">
        <h3 className="text-base font-bold text-[#D4AF37] font-mono">Modifier le Profil</h3>
        <p className="text-xs text-zinc-400">Cette fonctionnalité est en cours d’intégration.</p>
        <button 
          onClick={onCancel}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-white hover:bg-zinc-800"
        >
          Retour
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
