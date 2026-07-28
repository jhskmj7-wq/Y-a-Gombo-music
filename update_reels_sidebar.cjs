const fs = require('fs');
const content = fs.readFileSync('src/components/ReelsPlayer.tsx', 'utf8');

const targetStart = '      {/* Right Interaction Sidebar */}';
const targetEnd = '      </div>\n    </div>\n  );\n}';

const startIndex = content.indexOf(targetStart);
if (startIndex === -1) throw new Error("Sidebar start not found");

const endIndex = content.indexOf(targetEnd, startIndex);
if (endIndex === -1) throw new Error("Sidebar end not found");

const before = content.substring(0, startIndex);
const after = content.substring(endIndex + targetEnd.length);

const newSidebar = `      {/* Right Interaction Sidebar */}
      <div className="absolute bottom-6 right-4 z-10 flex flex-col items-center gap-6">
        {/* Avatar / Profil (Mon Héritage) */}
        <div className="relative group cursor-pointer flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()} title="Mon Héritage">
          <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-white relative">
            <img 
              src={post.authorAvatar || \`https://api.dicebear.com/7.x/bottts/svg?seed=\${post.userId || '1'}\`}
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover bg-black"
            />
            <button className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="text-[8px] font-bold text-white/80 drop-shadow-md uppercase tracking-wider mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-full whitespace-nowrap">Mon Héritage</span>
        </div>

        {/* Like (J'honore) */}
        <button className="flex flex-col items-center gap-1 cursor-pointer group" onClick={handleLike} title="J'honore">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-all group-active:scale-90 border border-white/10 hover:border-[#D4AF37]/50">
            <Heart className={\`w-5 h-5 transition-colors \${isLiked ? 'fill-red-500 text-red-500' : 'text-white group-hover:text-red-400'}\`} />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-white drop-shadow-md">{likesCount}</span>
            <span className="text-[8px] font-bold text-white/80 drop-shadow-md uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity absolute top-full whitespace-nowrap">J'honore</span>
          </div>
        </button>

        {/* Comment (Palabres) */}
        <button className="flex flex-col items-center gap-1 cursor-pointer group" onClick={(e) => e.stopPropagation()} title="Palabres">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-all group-active:scale-90 border border-white/10 hover:border-[#D4AF37]/50">
            <MessageCircle className="w-5 h-5 text-white group-hover:text-blue-400 fill-white/10" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-white drop-shadow-md">{post.comments || 0}</span>
            <span className="text-[8px] font-bold text-white/80 drop-shadow-md uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity absolute top-full whitespace-nowrap">Palabres</span>
          </div>
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
          <span className="text-[8px] font-bold text-white/80 drop-shadow-md uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity absolute top-full whitespace-nowrap">Transmettre</span>
        </button>
      </div>
    </div>
  );
}`;

fs.writeFileSync('src/components/ReelsPlayer.tsx', before + newSidebar + after);
console.log("Updated ReelsPlayer sidebar!");
