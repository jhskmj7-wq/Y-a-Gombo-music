import React, { useState } from 'react';
import { X, Save, Upload, Settings2 } from 'lucide-react';
import { AvatarItem } from '../../../types/avatar.types';
import { avatarService } from '../../../services/avatar.service';

interface AvatarItemEditorProps {
  item?: AvatarItem | null;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES_V2 = [
  'corps', 'tete', 'visage_base', 'yeux', 'sourcils', 'nez', 'bouche', 
  'barbe', 'moustache', 'cicatrices', 'maquillage', 'lunettes', 'cheveux',
  'tee-shirt', 'chemise', 'veste', 'manteau', 'collier', 'sac', 'casquettes',
  'chapeaux', 'couronnes', 'ecouteurs', 'chaines', 'montres', 'bagues',
  'bracelets', 'chaussures', 'pantalons', 'robes', 'costumes', 
  'tenues_africaines', 'tenues_ivoiriennes', 'tenues_scene', 
  'effets_speciaux', 'arriere_plans'
];

export const AvatarItemEditor: React.FC<AvatarItemEditorProps> = ({ item, onClose, onSaved }) => {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || 'tee-shirt');
  const [price, setPrice] = useState(item?.price || 100);
  const [rarity, setRarity] = useState(item?.rarity || 'Commun');
  const [isPremiumOnly, setIsPremiumOnly] = useState(item?.isPremiumOnly || false);
  
  // Image handling (can be svg or png/jpg)
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [svgContent, setSvgContent] = useState(item?.svgContent || '');
  
  // Engine V2 Settings
  const [anchorX, setAnchorX] = useState(item?.engineConfig?.anchorX || 0);
  const [anchorY, setAnchorY] = useState(item?.engineConfig?.anchorY || 0);
  const [scaleX, setScaleX] = useState(item?.engineConfig?.scaleX || 1);
  const [scaleY, setScaleY] = useState(item?.engineConfig?.scaleY || 1);
  const [rotation, setRotation] = useState(item?.engineConfig?.rotation || 0);
  const [zIndex, setZIndex] = useState(item?.engineConfig?.zIndex || 100);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const rarities = ['Commun', 'Rare', 'Épique', 'Légendaire', 'Mythique', 'Royale'];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    
    // If it's an SVG, we can optionally read it as text
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSvgContent(e.target?.result as string);
        setImageUrl(''); // Clear imageUrl if we have raw SVG
        setUploading(false);
      };
      reader.readAsText(file);
      return;
    }

    try {
      const url = await avatarService.uploadAvatarAsset(file, 'avatar_studio');
      setImageUrl(url);
      setSvgContent(''); // Clear svg content if we use a normal image
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
    
    const payload = {
      name,
      description,
      category,
      price: Number(price),
      rarity,
      isPremiumOnly,
      imageUrl,
      svgContent,
      isActive: true,
      engineConfig: {
        anchorX: Number(anchorX),
        anchorY: Number(anchorY),
        scaleX: Number(scaleX),
        scaleY: Number(scaleY),
        rotation: Number(rotation),
        zIndex: Number(zIndex)
      }
    };

    try {
      if (item?.id) {
        await avatarService.updateAvatarItem(item.id, payload);
      } else {
        await avatarService.createAvatarItem(payload);
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
      <div className="w-full max-w-4xl bg-afri-bg border border-[#D4AF37]/50 rounded-[24px] p-6 space-y-5 shadow-2xl relative overflow-y-auto max-h-[90vh]" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        <div className="flex items-center justify-between border-b border-afri-border pb-3">
          <h3 className="text-base font-bold text-[#D4AF37] font-mono">
            {item ? 'Modifier l’Article Avatar (Moteur V2)' : 'Créer un Nouvel Article (Moteur V2)'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full bg-afri-bg-sec text-afri-text-sec hover:text-afri-text min-h-[40px] min-w-[40px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <form id="avatar-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-afri-text-sec">Nom de l'article</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Veste en cuir premium"
                className="w-full bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-3 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
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
                  {CATEGORIES_V2.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
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
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-afri-text-sec">Image / SVG / Fichier</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="URL d'image ou code SVG généré..."
                  className="flex-1 bg-afri-bg-sec border border-afri-border rounded-xl px-4 py-3 text-xs text-afri-text focus:outline-none focus:border-[#D4AF37]"
                />
                <label className="px-4 py-3 bg-afri-bg-sec border border-afri-border rounded-xl text-xs font-bold text-[#D4AF37] hover:bg-afri-bg-ter cursor-pointer flex items-center gap-1.5 shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? '...' : 'Importer'}</span>
                  <input type="file" accept="image/*,.svg" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            <div className="border border-afri-border rounded-xl p-4 bg-afri-bg-sec/50 space-y-4">
              <h4 className="text-xs font-bold text-amber-400 font-mono flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Config Moteur V2
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-afri-text-sec">Décalage X (Anchor X)</label>
                  <input type="number" step="1" value={anchorX} onChange={(e) => setAnchorX(Number(e.target.value))} className="w-full bg-afri-bg border border-afri-border rounded-lg px-3 py-2 text-xs text-afri-text" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-afri-text-sec">Décalage Y (Anchor Y)</label>
                  <input type="number" step="1" value={anchorY} onChange={(e) => setAnchorY(Number(e.target.value))} className="w-full bg-afri-bg border border-afri-border rounded-lg px-3 py-2 text-xs text-afri-text" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-afri-text-sec">Échelle X (Scale X)</label>
                  <input type="number" step="0.1" value={scaleX} onChange={(e) => setScaleX(Number(e.target.value))} className="w-full bg-afri-bg border border-afri-border rounded-lg px-3 py-2 text-xs text-afri-text" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-afri-text-sec">Échelle Y (Scale Y)</label>
                  <input type="number" step="0.1" value={scaleY} onChange={(e) => setScaleY(Number(e.target.value))} className="w-full bg-afri-bg border border-afri-border rounded-lg px-3 py-2 text-xs text-afri-text" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-afri-text-sec">Rotation (degrés)</label>
                  <input type="number" step="1" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full bg-afri-bg border border-afri-border rounded-lg px-3 py-2 text-xs text-afri-text" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-afri-text-sec">Z-Index (Ordre)</label>
                  <input type="number" step="1" value={zIndex} onChange={(e) => setZIndex(Number(e.target.value))} className="w-full bg-afri-bg border border-afri-border rounded-lg px-3 py-2 text-xs text-afri-text" />
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-afri-bg-sec border border-afri-border text-xs font-bold text-afri-text-sec hover:text-afri-text"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                form="avatar-form"
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#D4AF37] text-black text-xs font-bold hover:bg-amber-400 shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Enregistrement...' : 'Publier'}</span>
              </button>
            </div>
          </form>

          {/* PREVIEW PANEL */}
          <div className="flex flex-col items-center justify-center bg-afri-bg-sec/30 border border-afri-border rounded-[24px] p-6 relative overflow-hidden">
             <h4 className="absolute top-4 left-4 text-xs font-bold text-afri-text-sec font-mono uppercase">Prévisualisation</h4>
             
             {/* Virtual Engine Box */}
             <div 
               className="relative border-2 border-dashed border-[#D4AF37]/30 rounded-full"
               style={{ width: 240, height: 240, backgroundColor: "#f3f4f6" }} // generic background
             >
                <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                   {/* Reference Base Body to help admin position items */}
                   <g opacity="0.15">
                     <path d="M60 200 Q100 130 140 200 Z" fill="#8D5524" />
                     <path d="M55 105 Q45 90 55 75 Z" fill="#8D5524" />
                     <path d="M145 105 Q155 90 145 75 Z" fill="#8D5524" />
                     <circle cx="100" cy="90" r="45" fill="#8D5524" />
                     <path d="M63 115 Q100 150 137 115 L145 90 L55 90 Z" fill="#8D5524" />
                     <path d="M45 200 Q100 145 155 200 Z" fill="#1f2937" />
                   </g>

                   {/* The new Item preview */}
                   {(svgContent || imageUrl) && (
                      <g 
                         style={{ 
                           transform: `translate(${anchorX}px, ${anchorY}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`, 
                           transformOrigin: 'center' 
                         }}
                      >
                         {svgContent ? (
                           <g dangerouslySetInnerHTML={{ __html: svgContent }} />
                         ) : imageUrl ? (
                           <image href={imageUrl} width="200" height="200" preserveAspectRatio="xMidYMid slice" />
                         ) : null}
                      </g>
                   )}
                </svg>
             </div>
             
             <div className="mt-6 text-[10px] text-afri-text-muted text-center max-w-[80%] font-mono">
               Utilisez les paramètres du Moteur V2 (Anchor, Scale, Rotation) pour aligner parfaitement l'article sur la silhouette semi-réaliste.
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
export default AvatarItemEditor;
