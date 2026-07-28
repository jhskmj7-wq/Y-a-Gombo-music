const fs = require('fs');
let content = fs.readFileSync('src/components/ReelsPlayer.tsx', 'utf8');

// 1. Update the main container
content = content.replace(
  'className="fixed inset-0 z-[100] bg-black text-white font-sans flex flex-col"',
  'className="relative w-[calc(100%+2rem)] -mx-4 sm:w-full sm:mx-auto sm:max-w-md h-[calc(100vh-150px)] min-h-[80vh] bg-black text-white font-sans flex flex-col sm:rounded-3xl overflow-hidden shadow-2xl z-40 border-y sm:border border-white/10"'
);

// We need to also adjust Header inside it to be absolute or relative
// It's already absolute top-0 left-0 right-0 z-10
// We also need to fix ReelItem Layout

const reelItemStart = 'function ReelItem({ post, isActive }: { post: Post, isActive: boolean }) {';
const beforeReelItem = content.substring(0, content.indexOf(reelItemStart));
const afterReelItem = content.substring(content.indexOf(reelItemStart));

const newReelItem = `function ReelItem({ post, isActive }: { post: Post, isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);

  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      videoRef.current?.play().catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(false);
      videoRef.current?.pause();
      if (videoRef.current) {
         videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <div className="w-full h-full snap-start relative bg-black flex justify-center items-center overflow-hidden" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={post.mediaUrl || ""}
        loop
        playsInline
        muted={false}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Overlay Gradient for readability */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Play/Pause indicator overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1" />
          </div>
        </div>
      )}

      {/* Bottom Info Overlay - BAS À GAUCHE */}
      <div className="absolute bottom-16 left-3 right-16 z-10 text-left pointer-events-none flex flex-col justify-end">
        <h3 className="text-sm font-black text-white mb-1 drop-shadow-md flex items-center gap-2">
          @{post.authorName?.replace(/\\s+/g, '').toLowerCase() || "artiste"}
        </h3>
        <p className="text-xs text-white/90 line-clamp-2 mb-3 drop-shadow-md font-medium">
          {post.content}
        </p>
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full inline-flex max-w-max pointer-events-auto">
          <div className="w-3 h-3 rounded-full bg-[#D4AF37] animate-pulse shrink-0" />
          <span className="text-[10px] font-mono font-bold text-white truncate max-w-[120px]">
            {post.authorArtisticName || "Audio original"}
          </span>
        </div>
      </div>

      {/* Right Interaction Sidebar - BORD DROIT */}
      <div className="absolute bottom-16 right-3 z-10 flex flex-col items-center gap-5">
        {/* Avatar / Profil (Mon Héritage) */}
        <div className="relative group cursor-pointer flex flex-col items-center" onClick={(e) => e.stopPropagation()} title="Mon Héritage">
          <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-white relative">
            <img 
              src={post.authorAvatar || \`https://api.dicebear.com/7.x/bottts/svg?seed=\${post.userId || '1'}\`}
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover bg-black"
            />
            <button className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Like (J'honore) */}
        <button className="flex flex-col items-center gap-1 cursor-pointer group" onClick={handleLike} title="J'honore">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-all group-active:scale-90 border border-white/10 hover:border-[#D4AF37]/50">
            <Heart className={\`w-5 h-5 transition-colors \${isLiked ? 'fill-red-500 text-red-500' : 'text-white group-hover:text-red-400'}\`} />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">{likesCount}</span>
        </button>

        {/* Comment (Palabres) */}
        <button className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => e.stopPropagation()} title="Palabres">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-all group-active:scale-90 border border-white/10 hover:border-[#D4AF37]/50">
            <MessageCircle className="w-5 h-5 text-white group-hover:text-blue-400 fill-white/10" />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">{post.comments || 0}</span>
        </button>

        {/* Wallet / Support */}
        <button className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent("open_wallet_deposit"));
        }} title="Soutenir">
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 backdrop-blur-md flex items-center justify-center transition-all group-active:scale-90 hover:bg-[#D4AF37]/30">
            <Coins className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <span className="text-[8px] font-bold text-[#D4AF37] drop-shadow-md uppercase tracking-wider">Soutenir</span>
        </button>

        {/* Share (Transmettre) */}
        <button className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => {
           e.stopPropagation();
           if (navigator.share) {
             navigator.share({ title: 'Afrigombo Réel', url: window.location.href });
           }
        }} title="Transmettre">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-all group-active:scale-90 border border-white/10 hover:border-[#D4AF37]/50">
            <Share2 className="w-5 h-5 text-white group-hover:text-green-400" />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md">Partager</span>
        </button>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/ReelsPlayer.tsx', beforeReelItem + newReelItem);
console.log("Updated ReelsPlayer layout!");
