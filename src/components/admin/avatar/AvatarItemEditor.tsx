import React, { useState } from 'react';
import { X, Save, Sparkles, Upload } from 'lucide-react';
import { AvatarItem } from '../../../types/avatar.types';
import { avatarService } from '../../../services/avatar.service';

interface AvatarItemEditorProps {
  item?: AvatarItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export const AvatarItemEditor: React.FC<AvatarItemEditorProps> = ({ item, onClose, onSaved }) => {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || 'vêtements');
  const [price, setPrice] = useState(item?.price || 100);
  const [rarity, setRarity] = useState(item?.rarity || 'Commun');
  const [isPremiumOnly, setIsPremiumOnly] = useState(item?.isPremiumOnly || false);
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = ['vêtements', 'chaussures', 'accessoires', 'couronnes', 'instruments', 'coiffures', 'arriere-plans'];
  const rarities = ['Commun', 'Rare', 'Épique', 'Légendaire', 'Mythique', 'Royale'];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await avatarService.uploadAvatarAsset(file, 'avatar_studio');
      setImageUrl(url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Échec de l’upload de l’image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (item?.id) {
        await avatarService.updateAvatarItem(item.id, {
          name,
          description,
          category,
          price: Number(price),
          rarity,
          isPremiumOnly,
          imageUrl
        });
      } else {
        await avatarService.createAvatarItem({
          name,
          description,
          category,
          price: Number(price),
          rarity,
          isPremiumOnly,
          imageUrl,
          isActive: true
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Save item error:', err);
      alert('Erreur lors de l’enregistrement de l’article.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-afri-bg/80 backdrop-blur-md select-none">
      <div className="w-full max-w-lg bg-afri-bg border border-[#D4AF37]/50 rounded-[24px] p-6 space-y-5 shadow-2xl relative overflow-y-auto max-h-[85vh]" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        <div className="flex items-center justify-between border-b border-afri-border pb-3">
          <h3 className="text-base font-bold text-[#D4AF37] font-mono">
            {item ? 'Modifier l’Article Avatar' : 'Créer un Nouvel Article'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full bg-afri-bg-sec text-afri-text-sec hover:text-afri-text min-h-[40px] min-w-[40px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-afri-text-sec">Nom de l'article</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Couronne Impériale Royale"
              className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-3 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-afri-text-sec">Description</label>
            <textarea 
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description détaillée de l'objet..."
              className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-3 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-afri-text-sec">Catégorie</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-3 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-afri-text-sec">Rareté</label>
              <select 
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-3 py-3 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
              >
                {rarities.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-afri-text-sec">Prix (Gombo Coins 🪙)</label>
              <input 
                type="number" 
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-3 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isPremiumOnly}
                  onChange={(e) => setIsPremiumOnly(e.target.checked)}
                  className="w-4 h-4 rounded bg-afri-bg-sec border-afri-border text-[#D4AF37] focus:ring-0"
                />
                <span className="text-xs font-mono text-amber-400 font-bold">Réservé Premium</span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-afri-text-sec">Image / Asset URL</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-3 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
              />
              <label className="px-4 py-3 bg-afri-bg-sec border border-afri-border rounded-xl text-xs font-bold text-[#D4AF37] hover:bg-afri-bg-ter cursor-pointer flex items-center gap-1.5 shrink-0">
                <Upload className="w-4 h-4" />
                <span>{uploading ? '...' : 'Uploader'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          <div className="pt-3 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-afri-bg-sec border border-afri-border text-xs font-bold text-afri-text-sec hover:text-afri-text"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#D4AF37] text-black text-xs font-bold hover:bg-amber-400 shadow-lg flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AvatarItemEditor;
