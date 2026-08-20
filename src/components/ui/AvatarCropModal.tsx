import React, { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move } from "lucide-react";

interface AvatarCropModalProps {
  isOpen: boolean;
  imageFile: File | null;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageFile,
  onClose,
  onCropComplete,
}) => {
  if (!isOpen || !imageFile) return null;

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Transform states
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);

  // Interaction tracking refs
  const isDraggingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);

  // Fixed crop viewport size in pixels
  const VIEWPORT_SIZE = 300;

  // Load image file into Object URL
  useEffect(() => {
    let url: string | null = null;
    if (imageFile) {
      url = URL.createObjectURL(imageFile);
      setImageSrc(url);

      const img = new Image();
      img.onload = () => {
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
        setRotation(0);
      };
      img.src = url;
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // Base scale calculation to cover viewport (1:1 square)
  const getBaseScale = useCallback(() => {
    if (!imgDimensions.width || !imgDimensions.height) return 1;
    const isRotated = rotation % 180 !== 0;
    const w = isRotated ? imgDimensions.height : imgDimensions.width;
    const h = isRotated ? imgDimensions.width : imgDimensions.height;
    return Math.max(VIEWPORT_SIZE / w, VIEWPORT_SIZE / h);
  }, [imgDimensions, rotation]);

  const baseScale = getBaseScale();
  const currentScale = baseScale * zoom;

  // Constrain panning so image covers the circle completely without revealing background
  const constrainPan = useCallback(
    (pX: number, pY: number, z: number, rot: number) => {
      if (!imgDimensions.width || !imgDimensions.height) return { x: 0, y: 0 };
      const isRotated = rot % 180 !== 0;
      const w = isRotated ? imgDimensions.height : imgDimensions.width;
      const h = isRotated ? imgDimensions.width : imgDimensions.height;

      const dispW = w * baseScale * z;
      const dispH = h * baseScale * z;

      const maxPanX = Math.max(0, (dispW - VIEWPORT_SIZE) / 2);
      const maxPanY = Math.max(0, (dispH - VIEWPORT_SIZE) / 2);

      return {
        x: Math.min(maxPanX, Math.max(-maxPanX, pX)),
        y: Math.min(maxPanY, Math.max(-maxPanY, pY)),
      };
    },
    [imgDimensions, baseScale]
  );

  // Pointer / Touch Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startPointRef.current = { x: e.clientX, y: e.clientY };
    startPanRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startPointRef.current.x;
    const dy = e.clientY - startPointRef.current.y;
    const newPan = constrainPan(startPanRef.current.x + dx, startPanRef.current.y + dy, zoom, rotation);
    setPan(newPan);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - touchDistanceRef.current;
      touchDistanceRef.current = dist;
      setZoom((prev) => {
        const nextZoom = Math.min(3.5, Math.max(1.0, prev + delta * 0.008));
        setPan((currentPan) => constrainPan(currentPan.x, currentPan.y, nextZoom, rotation));
        return nextZoom;
      });
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => {
      const nextZoom = Math.min(3.5, Math.max(1.0, prev + delta));
      setPan((currentPan) => constrainPan(currentPan.x, currentPan.y, nextZoom, rotation));
      return nextZoom;
    });
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    setPan({ x: 0, y: 0 });
    setZoom(1.0);
  };

  // Render cropped 1:1 image onto a 600x600 canvas upon confirmation
  const handleConfirm = () => {
    if (!imageSrc || !imgDimensions.width || !imgDimensions.height) return;

    const canvas = document.createElement("canvas");
    const OUTPUT_SIZE = 600;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const scaleFactor = OUTPUT_SIZE / VIEWPORT_SIZE;

      ctx.save();
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);

      const w = img.naturalWidth;
      const h = img.naturalHeight;

      const renderW = w * baseScale * zoom * scaleFactor;
      const renderH = h * baseScale * zoom * scaleFactor;

      ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
      ctx.restore();

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const fileName = imageFile.name
            ? `cropped_${imageFile.name.replace(/\.[^/.]+$/, "")}.jpg`
            : `avatar_cropped_${Date.now()}.jpg`;
          const croppedFile = new File([blob], fileName, { type: "image/jpeg" });
          onCropComplete(croppedFile);
          onClose();
        },
        "image/jpeg",
        0.95
      );
    };
    img.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black/95 backdrop-blur-md text-white flex flex-col justify-between p-4 sm:p-6 animate-fadeIn select-none touch-none">
      {/* HEADER */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto pt-2 pb-3 px-2 border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Annuler</span>
        </button>

        <div className="text-center">
          <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-widest font-display">
            Ajuster la photo
          </h3>
          <p className="text-[10px] text-zinc-400 font-mono">Glissez & Zoomez pour recadrer</p>
        </div>

        <button
          type="button"
          onClick={handleRotate}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 cursor-pointer"
          title="Pivoter 90°"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* CROP VIEWPORT (1:1 Square with Circle Overlay) */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto py-4">
        <div
          className="relative overflow-hidden bg-zinc-900 rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.25)] border border-[#D4AF37]/40 cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
          style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* Transforming Image */}
          {imageSrc && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg)`,
                transition: isDraggingRef.current ? "none" : "transform 0.05s ease-out",
              }}
            >
              <img
                src={imageSrc}
                alt="Aperçu recadrage"
                className="max-w-none pointer-events-none"
                style={{
                  width: `${imgDimensions.width * currentScale}px`,
                  height: `${imgDimensions.height * currentScale}px`,
                }}
              />
            </div>
          )}

          {/* CIRCULAR OVERLAY MASK (WhatsApp Style) */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 300 300">
              <defs>
                <mask id="circle-crop-mask">
                  <rect width="300" height="300" fill="white" />
                  <circle cx="150" cy="150" r="146" fill="black" />
                </mask>
              </defs>
              <rect width="300" height="300" fill="rgba(0,0,0,0.68)" mask="url(#circle-crop-mask)" />
              <circle cx="150" cy="150" r="146" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.9" />
            </svg>
          </div>

          {/* Grid lines inside circle */}
          <div className="absolute inset-0 pointer-events-none rounded-full border border-white/20 flex flex-col justify-between p-0 m-1">
            <div className="w-full h-1/3 border-b border-white/10" />
            <div className="w-full h-1/3 border-b border-white/10" />
          </div>
          <div className="absolute inset-0 pointer-events-none rounded-full flex justify-between p-0 m-1">
            <div className="h-full w-1/3 border-r border-white/10" />
            <div className="h-full w-1/3 border-r border-white/10" />
          </div>

          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-mono font-bold text-[#D4AF37] border border-[#D4AF37]/30 flex items-center gap-1 pointer-events-none">
            <Move className="w-3 h-3 text-[#D4AF37]" />
            <span>1:1 CARRÉ</span>
          </div>
        </div>

        {/* ZOOM SLIDER & CONTROLS */}
        <div className="w-full max-w-[300px] mt-6 px-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-mono font-bold">
            <button
              type="button"
              onClick={() => {
                const nextZoom = Math.max(1.0, zoom - 0.2);
                setZoom(nextZoom);
                setPan((currentPan) => constrainPan(currentPan.x, currentPan.y, nextZoom, rotation));
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-[11px] text-[#D4AF37]">Zoom: {Math.round(zoom * 100)}%</span>

            <button
              type="button"
              onClick={() => {
                const nextZoom = Math.min(3.5, zoom + 0.2);
                setZoom(nextZoom);
                setPan((currentPan) => constrainPan(currentPan.x, currentPan.y, nextZoom, rotation));
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <input
            type="range"
            min="1.0"
            max="3.5"
            step="0.05"
            value={zoom}
            onChange={(e) => {
              const nextZoom = parseFloat(e.target.value);
              setZoom(nextZoom);
              setPan((currentPan) => constrainPan(currentPan.x, currentPan.y, nextZoom, rotation));
            }}
            className="w-full accent-[#D4AF37] bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* FOOTER ACTION BUTTONS */}
      <div className="w-full max-w-md mx-auto flex items-center gap-3 pt-2 pb-2 px-2 border-t border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer border border-zinc-700 flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          <span>Annuler</span>
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 py-3.5 px-4 bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-600 text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Confirmer</span>
        </button>
      </div>
    </div>
  );
};

export default AvatarCropModal;
