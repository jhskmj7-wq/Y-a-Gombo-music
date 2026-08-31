import os

# 1. Update AdminCentre.tsx
with open("src/components/AdminCentre.tsx", "r", encoding="utf-8", errors="ignore") as f:
    admin = f.read()

admin = admin.replace('if (!currentUser || !db || perspective !== "admin") return;', 'if (!currentUser || !db) return;')
admin = admin.replace('}, [currentUser, perspective]);', '}, [currentUser]);')

with open("src/components/AdminCentre.tsx", "w", encoding="utf-8") as f:
    f.write(admin)

print("Updated AdminCentre.tsx")

# 2. Update ReelsPlayer.tsx
with open("src/components/ReelsPlayer.tsx", "r", encoding="utf-8", errors="ignore") as f:
    reels = f.read()

pos1 = reels.find("  // Build unified list of reels from props + fallback")
pos2 = reels.find("  const [localReels, setLocalReels] = useState<ReelItem[]>(reelsList);")

if pos1 != -1 and pos2 != -1:
    print("Found bounds in ReelsPlayer.tsx!")
    new_reels_code = '''  // Build unified list of reels from props + fallback
  const reelsList = React.useMemo(() => {
    const existingUrls = new Set<string>();
    const existingIds = new Set<string>();

    const fromPosts: ReelItem[] = posts
      .filter(p => {
        const videoUrl = p.videoUrl || p.mediaUrl || (p as any).url;
        if (!videoUrl || typeof videoUrl !== "string") return false;
        const typeStr = String(p.type || (p as any).mediaType || "").toLowerCase();
        const isVideo = typeStr === "video" || typeStr === "reel" || Boolean(p.videoUrl) || videoUrl.includes("/reels/") || videoUrl.includes("/video/") || Boolean(videoUrl.match(/\\.(mp4|webm|ogg|mov|m4v)($|\\?)/i));
        return isVideo;
      })
      .map(p => {
        const videoUrl = p.videoUrl || p.mediaUrl || (p as any).url!;
        const likedBy = (p as any).likedBy || [];
        const isLiked = currentUser?.uid ? (likedBy.includes(currentUser.uid) || p.isLiked) : (p.isLiked || false);
        
        if (p.id) existingIds.add(String(p.id));
        if (videoUrl) existingUrls.add(String(videoUrl).trim());

        return {
          id: p.id || `post_${Math.random()}`,
          title: p.title || p.authorArtisticName || "Vibration Artistique",
          authorName: p.authorName || "Artiste Gombo",
          authorArtisticName: p.authorArtisticName || p.authorName || "Artiste Gombo",
          authorAvatar: p.authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          commune: (p as any).commune || (p as any).location || "Abidjan",
          content: p.content || (p as any).caption || "Publication vidéo sur le Fil Réel d'AFRIGOMBO ELITE.",
          mediaUrl: videoUrl,
          videoUrl: videoUrl,
          url: videoUrl,
          musicTrack: p.title || "Son original AFRIGOMBO ELITE",
          hashtags: (p as any).hashtags || ["#Afrigombo", "#MusiqueIvoirienne", "#TalentsDuTrone"],
          likesCount: p.likes || 0,
          commentsCount: p.comments || 0,
          isLiked: Boolean(isLiked),
          userId: p.userId
        };
      });

    // Merge users list with currentUser if not already present
    const allUsers = [...users];
    if (currentUser) {
      const currentUid = currentUser.uid || currentUser.id;
      const existingIdx = allUsers.findIndex(u => (u.id === currentUid || u.uid === currentUid));
      if (existingIdx === -1) {
        allUsers.push({
          id: currentUid,
          name: currentUser.displayName || currentUser.name || "Artiste Gombo",
          artisticName: currentUser.artisticName || currentUser.displayName || currentUser.name || "Artiste Gombo",
          photoUrl: currentUser.photoURL || currentUser.photoUrl,
          mediaGallery: currentUser.mediaGallery || currentUser.profile?.mediaGallery || [],
          ...currentUser
        });
      } else {
        const existingUser = allUsers[existingIdx];
        const userGallery = existingUser.mediaGallery || [];
        const currentGallery = currentUser.mediaGallery || currentUser.profile?.mediaGallery || [];
        if (currentGallery.length > userGallery.length) {
          allUsers[existingIdx] = {
            ...existingUser,
            mediaGallery: currentGallery
          };
        }
      }
    }

    const fromUsers: ReelItem[] = allUsers.flatMap(u => 
      (u.mediaGallery || [])
        .filter((m: any) => {
          if (!m) return false;
          const typeStr = String(m.type || "").toLowerCase();
          const videoUrl = m.url || m.mediaUrl || m.videoUrl;
          if (!videoUrl || typeof videoUrl !== "string") return false;
          const isVideo = typeStr === "video" || typeStr === "reel" || videoUrl.includes("/video/") || videoUrl.includes("/portfolio/") || Boolean(videoUrl.match(/\\.(mp4|webm|ogg|mov|m4v)($|\\?)/i));
          if (!isVideo) return false;

          // Deduplicate against posts and already processed user media
          if (m.id && existingIds.has(String(m.id))) return false;
          if (existingUrls.has(videoUrl.trim())) return false;

          return true;
        })
        .map((m: any) => {
          const videoUrl = m.url || m.mediaUrl || m.videoUrl;
          if (m.id) existingIds.add(String(m.id));
          existingUrls.add(videoUrl.trim());

          return {
            id: m.id || `user_media_${Math.random().toString(36).substring(2, 9)}`,
            title: m.title || "Démo Artiste Portfolio",
            authorName: u.name || u.displayName || "Artiste Accrédité",
            authorArtisticName: u.artisticName || u.displayName || u.name || "Artiste Accrédité",
            authorAvatar: u.photoUrl || u.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            commune: u.commune || u.city || u.location || "Abidjan",
            content: m.description || m.title || `Extrait vidéo et démonstration officielle de ${u.artisticName || u.name || "l'artiste"}.`,
            mediaUrl: videoUrl,
            videoUrl: videoUrl,
            url: videoUrl,
            musicTrack: m.title || `Démo Portfolio — ${u.artisticName || u.name || "Artiste"}`,
            hashtags: ["#Afrigombo", "#Portfolio", "#TalentGombo"],
            likesCount: m.likesCount || m.likes || 12,
            commentsCount: m.commentsCount || m.comments || 2,
            userId: u.id || u.uid || currentUser?.uid
          };
        })
    );

    const merged = [...fromPosts, ...fromUsers];
    if (merged.length > 0) return merged;
    return FALLBACK_REELS;
  }, [posts, users, currentUser]);\n\n'''

    reels = reels[:pos1] + new_reels_code + reels[pos2:]
    with open("src/components/ReelsPlayer.tsx", "w", encoding="utf-8") as f:
        f.write(reels)
    print("Updated ReelsPlayer.tsx successfully!")
else:
    print("Bounds NOT found in ReelsPlayer.tsx")
