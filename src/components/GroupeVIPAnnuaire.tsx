import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Music, Search, MapPin, Award, 
  Sparkles, ShieldCheck, Star, Trash2, Globe, Check, 
  Smartphone, Plus, ChevronRight, Heart, Eye, Phone, 
  Send, Share2, Info, Edit3, Image, Video, Volume2, 
  PlusCircle, X, CheckCircle, Calendar, Mail, FileText,
  AlertTriangle, Play
} from "lucide-react";
import { gomboDB } from "../firebase";
import { UserProfile, MusicGroup, GroupMember, GroupGalleryMedia } from "../types";

interface GroupeVIPAnnuaireProps {
  currentUserProfile: UserProfile | null;
  onRefreshProfile: () => void;
  onShowAuth: () => void;
}

const PRESET_MUSIC_GROUPS: Omit<MusicGroup, "id" | "createdAt" | "viewsCount" | "favoritesCount" | "contactsCount" | "followers">[] = [
  {
    creatorId: "mock_owner_1",
    name: "Les Chocs du Zouglou",
    photoUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80",
    logoUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop&q=80",
    description: "Le groupe de référence pour l'ambiance wôyô et le Zouglou acoustique en Côte d'Ivoire. Fondé par des passionnés du showbiz ivoirien, notre groupe anime avec brio les mariages, anniversaires, concerts géants et festivals d'Abidjan.",
    commune: "Yopougon",
    ville: "Abidjan",
    phone: "07 48 29 10 20",
    whatsapp: "07 48 29 10 20",
    email: "leschocszouglou@gmail.com",
    membersCount: 6,
    creationYear: 2018,
    type: "Groupe Zouglou",
    genres: ["Zouglou", "Wôyô", "Traditionnel"],
    plan: "premium",
    isVerified: true,
    isPremium: true,
    isPopular: true,
    members: [
      { id: "m1", name: "Marc Olivier (Vocal)", role: "Chanteur Solo", instrument: "Voix" },
      { id: "m2", name: "Ange Pacôme (Percu)", role: "Percussionniste", instrument: "Calebasse & Concasseur" },
      { id: "m3", name: "Elvis Gnahoré (Chœur)", role: "Choriste", instrument: "Voix" },
      { id: "m4", name: "Didier Youté (Guitare)", role: "Guitariste", instrument: "Guitare Acoustique" }
    ],
    gallery: [
      { id: "g1", type: "photo", url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80", title: "Concert Live au Baron de Yopougon" },
      { id: "g2", type: "photo", url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=80", title: "Enregistrement Studio à Cocody" },
      { id: "g3", type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", title: "Extrait Show Live Acoustique" },
      { id: "g4", type: "audio", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", title: "Single : Esprit Zouglou (Démo MP3)" }
    ]
  },
  {
    creatorId: "mock_owner_2",
    name: "Golden Voice Orchestre",
    photoUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    logoUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80",
    description: "Orchestre prestigieux de variété internationale, Rumba Congolaise et Coupé-Décalé chic. Prestations sur mesure haut de gamme pour soirées d'entreprise, dîners gala d'ambassade et mariages de haut standing.",
    commune: "Cocody",
    ville: "Abidjan",
    phone: "05 11 22 33 44",
    whatsapp: "05 11 22 33 44",
    email: "goldenvoiceorchestra@gmail.com",
    membersCount: 9,
    creationYear: 2015,
    type: "Orchestre Live",
    genres: ["Variété", "Soul", "Jazz", "Coupé-Décalé"],
    plan: "vip",
    isVerified: true,
    isPremium: false,
    isPopular: true,
    members: [
      { id: "mv1", name: "Béatrice Touré", role: "Chanteuse Principale", instrument: "Voix Soprano" },
      { id: "mv2", name: "Patrick Kassi", role: "Pianiste / Chef d'Orchestre", instrument: "Clavier Syntéthique" },
      { id: "mv3", name: "Stéphane Kouassi", role: "Bassiste", instrument: "Guitare Basse 5 cordes" },
      { id: "mv4", name: "David Yao", role: "Batteur", instrument: "Batterie Acoustique" }
    ],
    gallery: [
      { id: "gv1", type: "photo", url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80", title: "Gala de bienfaisance au Sofitel" },
      { id: "gv2", type: "audio", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", title: "Démo Rumba Mélancolie (Live)" }
    ]
  },
  {
    creatorId: "mock_owner_3",
    name: "La Chorale Céleste",
    photoUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80",
    logoUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=200&auto=format&fit=crop&q=80",
    description: "Chorale polyphonique d'exception spécialisée dans les cantiques sacrés africains, répertoires classiques du gospel et célébrations de mariages religieux. Un moment d'élévation spirituelle inoubliable.",
    commune: "Marcory",
    ville: "Abidjan",
    phone: "01 89 77 66 55",
    whatsapp: "01 89 77 66 55",
    email: "celestechorus@hotmail.com",
    membersCount: 24,
    creationYear: 2012,
    type: "Chorale",
    genres: ["Gospel", "Traditionnel"],
    plan: "standard",
    isVerified: false,
    isPremium: false,
    isPopular: false,
    members: [
      { id: "mc1", name: "Sœur Constance", role: "Présidente", instrument: "Voix Alto" },
      { id: "mc2", name: "Frère Samuel", role: "Maître de Chœur", instrument: "Direction de Voix" }
    ],
    gallery: []
  }
];

const STYLES_MUSICAUX = [
  "Zouglou", "Wôyô", "Coupé-Décalé", "Gospel", "Afrobeat", "Amapiano", 
  "Reggae", "Dancehall", "Rap Ivoire", "Variété", "Traditionnel", "Jazz", "Soul", "Autre"
];

const TYPES_GROUPES = [
  "Orchestre Live", "Groupe Zouglou", "Groupe Wôyô", "Groupe Gospel", "Chorale", 
  "Fanfare", "Groupe Traditionnel", "Groupe Coupé-Décalé", "DJ Collectif", 
  "Animation Mariage", "Animation Maquis", "Animation Événementielle", "Autre"
];

const COMMUNES_LIST = [
  "Cocody", "Yopougon", "Marcory", "Treichville", "Koumassi", "Adjamé", 
  "Plateau", "Port-Bouët", "Abobo", "Attécoubé", "Bingerville", "Grand-Bassam", "Yamoussoukro", "Bouaké", "San-Pédro", "Autre"
];

export default function GroupeVIPAnnuaire({ 
  currentUserProfile, 
  onRefreshProfile, 
  onShowAuth 
}: GroupeVIPAnnuaireProps) {
  const [groups, setGroups] = useState<MusicGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStyle, setSelectedStyle] = useState<string>("all");
  const [selectedCommune, setSelectedCommune] = useState<string>("all");
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  
  // Detail Page / Public Profile view state
  const [selectedGroup, setSelectedGroup] = useState<MusicGroup | null>(null);
  
  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MusicGroup | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // Form input states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("Orchestre Live");
  const [formCommune, setFormCommune] = useState("Cocody");
  const [formVille, setFormVille] = useState("Abidjan");
  const [formPhone, setFormPhone] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMembersCount, setFormMembersCount] = useState(5);
  const [formCreationYear, setFormCreationYear] = useState(new Date().getFullYear());
  const [formPhotoUrl, setFormPhotoUrl] = useState("");
  const [formLogoUrl, setFormLogoUrl] = useState("");
  const [formGenres, setFormGenres] = useState<string[]>([]);
  const [formPlan, setFormPlan] = useState<"standard" | "vip" | "premium">("standard");
  const [paymentProvider, setPaymentProvider] = useState<"Wave" | "Orange Money" | "MTN Momo" | "Moov Money">("Wave");
  const [paymentPhone, setPaymentPhone] = useState("");

  // Sub-management states (only for owner in public profile)
  const [activeTab, setActiveTab] = useState<"apropos" | "membres" | "galerie">("apropos");
  const [gallerySubTab, setGallerySubTab] = useState<"all" | "photo" | "video" | "audio">("all");
  
  // Custom member/gallery item add modal/inputs for Owner
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Chanteur");
  const [newMemberInstrument, setNewMemberInstrument] = useState("Voix");
  
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [newMediaTitle, setNewMediaTitle] = useState("");
  const [newMediaType, setNewMediaType] = useState<"photo" | "video" | "audio">("photo");
  const [newMediaUrl, setNewMediaUrl] = useState("");

  // Lightbox for photos
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);

  // Link copy simulation feedback
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  useEffect(() => {
    // Listen to real-time additions of Music Groups
    setLoading(true);
    const unsubscribe = gomboDB.listenAllMusicGroups((fetchedGroups) => {
      // If empty, insert preset music groups for awesome fallback presentation
      if (fetchedGroups.length === 0) {
        initPresets();
      } else {
        setGroups(fetchedGroups);
        // Sync selected group in detail view if any
        if (selectedGroup) {
          const updatedSelected = fetchedGroups.find(g => g.id === selectedGroup.id);
          if (updatedSelected) setSelectedGroup(updatedSelected);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedGroup?.id]);

  const initPresets = async () => {
    try {
      const storedPresetsLocal = localStorage.getItem("gombo_presets_created");
      if (storedPresetsLocal) {
        // Presets already initialized previously but database cleared, reload locally
        const list: MusicGroup[] = JSON.parse(localStorage.getItem("gombo_music_groups") || "[]");
        setGroups(list);
        return;
      }

      // Populate local presets
      const created: MusicGroup[] = [];
      for (const preset of PRESET_MUSIC_GROUPS) {
        const group = await gomboDB.publishMusicGroup(preset as any);
        created.push(group);
      }
      localStorage.setItem("gombo_presets_created", "true");
      setGroups(created);
    } catch (e) {
      console.error("Error setting up group presets", e);
    }
  };

  const getPlanPrice = (plan: "standard" | "vip" | "premium") => {
    switch(plan) {
      case "standard": return 5000;
      case "vip": return 10000;
      case "premium": return 25000;
    }
  };

  const initFormFields = (group?: MusicGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormName(group.name);
      setFormDescription(group.description);
      setFormType(group.type);
      setFormCommune(group.commune);
      setFormVille(group.ville);
      setFormPhone(group.phone);
      setFormWhatsapp(group.whatsapp);
      setFormEmail(group.email);
      setFormMembersCount(group.membersCount);
      setFormCreationYear(group.creationYear);
      setFormPhotoUrl(group.photoUrl);
      setFormLogoUrl(group.logoUrl);
      setFormGenres(group.genres || []);
      setFormPlan(group.plan);
    } else {
      setEditingGroup(null);
      setFormName("");
      setFormDescription("");
      setFormType("Orchestre Live");
      setFormCommune("Cocody");
      setFormVille("Abidjan");
      setFormPhone(currentUserProfile?.phone || "");
      setFormWhatsapp(currentUserProfile?.phone || "");
      setFormEmail(currentUserProfile?.email || "");
      setFormMembersCount(5);
      setFormCreationYear(new Date().getFullYear() - 1);
      setFormPhotoUrl("");
      setFormLogoUrl("");
      setFormGenres([]);
      setFormPlan("standard");
    }
    setPaymentPhone(currentUserProfile?.phone || "");
  };

  const toggleGenreSelection = (genre: string) => {
    if (formGenres.includes(genre)) {
      setFormGenres(formGenres.filter(g => g !== genre));
    } else {
      setFormGenres([...formGenres, genre]);
    }
  };

  // Submit create or edit group
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      onShowAuth();
      return;
    }

    if (formGenres.length === 0) {
      alert("Veuillez sélectionner au moins un style musical.");
      return;
    }

    setLoading(true);

    const dataPayload = {
      creatorId: currentUserProfile.uid,
      name: formName,
      photoUrl: formPhotoUrl || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80",
      logoUrl: formLogoUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80",
      description: formDescription,
      commune: formCommune,
      ville: formVille,
      phone: formPhone,
      whatsapp: formWhatsapp,
      email: formEmail,
      membersCount: Number(formMembersCount),
      creationYear: Number(formCreationYear),
      type: formType,
      genres: formGenres,
      plan: formPlan,
      isVerified: editingGroup ? editingGroup.isVerified : (formPlan === "premium" || formPlan === "vip"),
      isPremium: formPlan === "premium",
      isPopular: editingGroup ? editingGroup.isPopular : formPlan === "premium",
      members: editingGroup ? editingGroup.members : [],
      gallery: editingGroup ? editingGroup.gallery : []
    };

    try {
      if (editingGroup) {
        // Mode update
        await gomboDB.updateMusicGroup(editingGroup.id, dataPayload as any);
        
        // Update local state if displaying detail
        if (selectedGroup && selectedGroup.id === editingGroup.id) {
          setSelectedGroup({
            ...selectedGroup,
            ...dataPayload
          });
        }
        
        setEditingGroup(null);
        setShowFormModal(false);
      } else {
        // Mode create with premium simulations
        const price = getPlanPrice(formPlan);

        if (price > 0) {
          // Push virtual subscription and billing logging
          await gomboDB.publishSubscription({
            userId: currentUserProfile.uid,
            userName: `${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || currentUserProfile.artistName || ""}`.trim() || `Musicien de ${formName}`,
            type: formPlan === "vip" ? "groupe_vip" : "groupe_premium",
            status: "active",
            price,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          });

          await gomboDB.publishPayment({
            userId: currentUserProfile.uid,
            userName: `${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || currentUserProfile.artistName || ""}`.trim() || `Musicien de ${formName}`,
            amount: price,
            purpose: `Certification VIP Annuaire - Groupe ${formName}`,
            provider: paymentProvider,
            phoneNumber: paymentPhone,
            status: "success"
          });
        }

        const newGroup = await gomboDB.publishMusicGroup(dataPayload as any);
        
        // Set user status to represent they registered their official team group
        await gomboDB.updateUserProfile(currentUserProfile.uid, {
          groupStatus: formPlan,
          groupType: formType,
          badges: Array.from(new Set([...(currentUserProfile.badges || []), formPlan === "premium" || formPlan === "vip" ? "🎼 Orchestre VIP" : "🔥 Membre Groupe"]))
        });

        onRefreshProfile();
        setRegistrationSuccess(true);
      }
    } catch (err) {
      console.error("Error submitting music group", err);
      alert("Une erreur technique s'est produite lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer "${name}" de l'annuaire ivoirien ?`)) return;
    try {
      setLoading(true);
      await gomboDB.deleteMusicGroup(id);
      if (selectedGroup && selectedGroup.id === id) {
        setSelectedGroup(null);
      }
    } catch (e) {
      console.error(e);
      alert("Impossible de procéder à la suppression.");
    } finally {
      setLoading(false);
    }
  };

  // Add a member inside active team list
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    const newMember: GroupMember = {
      id: "mem_" + Math.random().toString(36).substr(2, 9),
      name: newMemberName,
      role: newMemberRole,
      instrument: newMemberInstrument,
      photoUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150&auto=format&fit=crop&q=80`
    };

    const updatedMembers = [...(selectedGroup.members || []), newMember];
    try {
      await gomboDB.updateMusicGroup(selectedGroup.id, { members: updatedMembers });
      setNewMemberName("");
      setShowMemberForm(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout du membre.");
    }
  };

  // Delete physical member check
  const handleDeleteMember = async (memberId: string) => {
    if (!selectedGroup || !window.confirm("Retirer ce musicien du groupe ?")) return;
    const updatedMembers = (selectedGroup.members || []).filter(m => m.id !== memberId);
    try {
      await gomboDB.updateMusicGroup(selectedGroup.id, { members: updatedMembers });
    } catch (err) {
      console.error(err);
    }
  };

  // Add gallery object media check
  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    let mediaUrl = newMediaUrl;
    if (newMediaType === "video") {
      // Basic youtube/video url converter helpers if needed
      if (mediaUrl.includes("youtube.com/watch?v=")) {
        const vidId = mediaUrl.split("v=")[1]?.split("&")[0];
        if (vidId) {
          mediaUrl = `https://www.youtube.com/embed/${vidId}`;
        }
      } else if (mediaUrl.includes("youtu.be/")) {
        const vidId = mediaUrl.split("youtu.be/")[1]?.split("?")[0];
        if (vidId) {
          mediaUrl = `https://www.youtube.com/embed/${vidId}`;
        }
      }
    }

    const newMedia: GroupGalleryMedia = {
      id: "med_" + Math.random().toString(36).substr(2, 9),
      type: newMediaType,
      url: mediaUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
      title: newMediaTitle || `${newMediaType.toUpperCase()} Prestation`
    };

    const updatedGallery = [...(selectedGroup.gallery || []), newMedia];
    try {
      await gomboDB.updateMusicGroup(selectedGroup.id, { gallery: updatedGallery });
      setNewMediaTitle("");
      setNewMediaUrl("");
      setShowMediaForm(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout du média.");
    }
  };

  // Delete specific media 
  const handleDeleteMedia = async (mediaId: string) => {
    if (!selectedGroup || !window.confirm("Supprimer ce fichier de la galerie ?")) return;
    const updatedGallery = (selectedGroup.gallery || []).filter(m => m.id !== mediaId);
    try {
      await gomboDB.updateMusicGroup(selectedGroup.id, { gallery: updatedGallery });
    } catch (err) {
      console.error(err);
    }
  };

  // Social interaction view, bookmark, click tracking stats
  const handleViewProfile = async (group: MusicGroup) => {
    setSelectedGroup(group);
    setActiveTab("apropos");
    // Increment view count with real db / local storage update
    await gomboDB.incrementMusicGroupStat(group.id, "viewsCount", 1);
  };

  const handleContactAction = async (groupId: string, type: "phone" | "whatsapp" | "email") => {
    await gomboDB.incrementMusicGroupStat(groupId, "contactsCount", 1);
  };

  const handleToggleFollow = async (group: MusicGroup) => {
    if (!currentUserProfile) {
      onShowAuth();
      return;
    }
    try {
      const followed = await gomboDB.toggleFollowMusicGroup(group.id, currentUserProfile.uid);
      // Local state animation support
      setSelectedGroup({
        ...selectedGroup!,
        followers: followed 
          ? [...(selectedGroup?.followers || []), currentUserProfile.uid]
          : (selectedGroup?.followers || []).filter(id => id !== currentUserProfile.uid),
        favoritesCount: followed 
          ? (selectedGroup?.favoritesCount || 0) + 1 
          : Math.max(0, (selectedGroup?.favoritesCount || 0) - 1)
      });
    } catch(err) {
      console.error(err);
    }
  };

  const simulateShareLocalLink = (groupId: string) => {
    const virtualLink = `https://yagombo.music/groupes/${groupId}`;
    navigator.clipboard.writeText(virtualLink);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  };

  // Filtering Groups
  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.commune.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.ville.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "all" || g.type === selectedType;
    const matchesStyle = selectedStyle === "all" || (g.genres || []).includes(selectedStyle);
    const matchesCommune = selectedCommune === "all" || g.commune === selectedCommune;
    const matchesPlan = selectedPlan === "all" || g.plan === selectedPlan;

    return matchesSearch && matchesType && matchesStyle && matchesCommune && matchesPlan;
  }).sort((a, b) => {
    // Priorities sort: Premium, VIP, Standard
    const priority = { premium: 3, vip: 2, standard: 1 };
    return (priority[b.plan] || 1) - (priority[a.plan] || 1);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans transition-all duration-300">
      
      <AnimatePresence mode="wait">
        {!selectedGroup ? (
          /* Catalog View Mode */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Elegant Header Hero Badge Banner */}
            <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-purple-950 via-slate-900 to-[#120422] border border-purple-500/15 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full" />
              <div className="absolute -bottom-10 left-10 w-48 h-48 bg-purple-600/5 blur-2xl rounded-full" />

              <div className="space-y-3.5 max-w-2xl text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-black uppercase tracking-wider">
                  🎵 LE COIN DES GROUPES
                </div>
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none bg-gradient-to-r from-white via-gray-100 to-purple-250 bg-clip-text text-transparent">
                  Trouvez le Groupe Musical Idéal au Pays !
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl font-medium">
                  Le répertoire de référence pour dégoter le parfait orchestre Zouglou, chorale d'église, fanfare traditionnelle ou groupe rumba d'Abidjan pour tous vos événements de prestige.
                </p>
              </div>

              <div className="flex-shrink-0">
                {currentUserProfile ? (
                  <button
                    onClick={() => {
                      setRegistrationSuccess(false);
                      initFormFields();
                      setShowFormModal(true);
                    }}
                    className="px-6 py-4 bg-gradient-to-r from-[#7C3AED] to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4.5 h-4.5 text-white" />
                    Créer mon groupe
                  </button>
                ) : (
                  <button
                    onClick={onShowAuth}
                    className="px-6 py-4 bg-purple-500/10 text-purple-300 font-bold text-xs uppercase tracking-wider rounded-2xl border border-purple-500/20 hover:bg-purple-500/20 transition-all cursor-pointer"
                  >
                    Se connecter pour s'enregistrer
                  </button>
                )}
              </div>
            </div>

            {/* Simulated Advertising & Plan Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {[
                { 
                  title: "Plan Standard", 
                  price: "Gratuit / Simulation", 
                  badge: "Gratuit", 
                  benefits: ["Référencement standard de base", "Mise en relation par téléphone", "Sélection de genres artistiques"], 
                  color: "border-gray-100 dark:border-gray-800 text-gray-500 bg-white/50 dark:bg-[#120e22]/50" 
                },
                { 
                  title: "Statut Annuaire VIP ⭐", 
                  price: "10 000 FCFA / an", 
                  badge: "Recommandé Ventes", 
                  benefits: ["Badge VIP doré prestigieux", "Indexation prioritaire filtrée", "Gestion exhaustive des musiciens", "Galerie d'audios & vidéos de concerts"], 
                  color: "border-purple-500/30 bg-purple-500/[0.02] text-[#7C3AED] dark:text-[#A78BFA] scale-[1.01]" 
                },
                { 
                  title: "Prestige Premium 👑", 
                  price: "25 000 FCFA / an", 
                  badge: "Absolute Elite", 
                  benefits: ["Finition Premium étincelante", "Tête de liste des requêtes de recherche", "Assistance de placement de gombos", "Relais story Instagram & WhatsApp"], 
                  color: "border-pink-500/30 bg-pink-500/[0.02] text-pink-500" 
                }
              ].map((plan) => (
                <div key={plan.title} className={`p-5 rounded-2xl border ${plan.color} space-y-4 shadow-sm relative flex flex-col justify-between bg-white dark:bg-[#120E22]`}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider">{plan.title}</h3>
                      <span className="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-gray-400">{plan.badge}</span>
                    </div>
                    <div className="text-lg font-black">{plan.price}</div>
                    <ul className="text-xs space-y-2 pt-1 font-medium text-gray-600 dark:text-gray-300">
                      {plan.benefits.map((b) => (
                        <li key={b} className="flex items-center gap-1.5 focus:outline-none">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-[9px] text-gray-400 text-center uppercase tracking-widest border-t border-dashed border-gray-100 dark:border-gray-800/80 pt-3 mt-1.5">
                    Réseau Persistant • Aucun paiement requis
                  </div>
                </div>
              ))}
            </div>

            {/* Smart Search, Filters & Local Catalog index card */}
            <div className="bg-white dark:bg-[#120E22] p-5.5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
              
              <div className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-widest flex items-center gap-1">
                <Search className="w-4 h-4" />
                <span>FILTRES DE RECHERCHE D'ABIDJAN</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                
                {/* Search Text input */}
                <div className="relative sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Saisir un nom de groupe, style ou commune..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-3 pr-4 py-2 bg-gray-50/70 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white dark:focus:bg-[#120e22] text-gray-950 dark:text-white"
                  />
                </div>

                {/* Genre Selector */}
                <div>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50/70 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-850 dark:text-white"
                  >
                    <option value="all">Tous Types de Groupes</option>
                    {TYPES_GROUPES.map(tg => <option key={tg} value={tg}>{tg}</option>)}
                  </select>
                </div>

                {/* Music Style Selection */}
                <div>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50/70 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-850 dark:text-white"
                  >
                    <option value="all">Tous Styles Musicaux</option>
                    {STYLES_MUSICAUX.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                {/* Commune Selection */}
                <div>
                  <select
                    value={selectedCommune}
                    onChange={(e) => setSelectedCommune(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50/70 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-850 dark:text-white"
                  >
                    <option value="all">Toutes Communes</option>
                    {COMMUNES_LIST.map(cm => <option key={cm} value={cm}>{cm}</option>)}
                  </select>
                </div>

              </div>

              {/* Dynamic Group results query grid output */}
              {filteredGroups.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-3.5 border border-dashed border-gray-100 dark:border-gray-800/85 rounded-2xl">
                  <div className="p-3.5 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-full inline-flex">
                    <Music className="w-8 h-8" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider">Aucun Orchestre ou Groupe Répertorié</div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Veuillez défaire certains filtres ou enregistrer votre propre équipe en haut de page.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1.5">
                  {filteredGroups.map((group) => {
                    const isOwner = currentUserProfile && group.creatorId === currentUserProfile.uid;
                    return (
                      <motion.div
                        key={group.id}
                        layout
                        whileHover={{ y: -3 }}
                        className={`p-5.5 rounded-3xl border transition-all shadow-sm relative overflow-hidden flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-[#120E22] ${
                          group.plan === "premium" 
                            ? "border-pink-500/30 ring-2 ring-pink-500/5 shadow-md bg-gradient-to-tr from-pink-500/[0.02] to-transparent" 
                            : group.plan === "vip" 
                            ? "border-purple-500/30 ring-2 ring-purple-500/5 shadow-md bg-gradient-to-tr from-purple-500/[0.02] to-transparent"
                            : "border-gray-150 dark:border-gray-800/80"
                        }`}
                      >
                        {/* Upper Right Plan badges */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                          {group.plan === "premium" && (
                            <span className="text-[8.5px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 inline-flex items-center gap-0.5">
                              👑 PRESTIGE
                            </span>
                          )}
                          {group.plan === "vip" && (
                            <span className="text-[8.5px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-100 text-[#7C3AED] dark:bg-purple-950/45 dark:text-purple-300 inline-flex items-center gap-0.5">
                              ⭐ VIP
                            </span>
                          )}
                        </div>

                        {/* Middle contents */}
                        <div className="flex gap-4 items-start flex-1">
                          
                          {/* Image box */}
                          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-850 flex-shrink-0 flex items-center justify-center text-xl overflow-hidden shadow-inner border border-gray-150 dark:border-gray-850">
                            {group.logoUrl ? (
                              <img src={group.logoUrl} alt={group.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              "🎹"
                            )}
                          </div>

                          <div className="space-y-1.5 flex-1 pr-14">
                            <div>
                              <h3 className="font-extrabold text-sm text-gray-950 dark:text-white uppercase tracking-tight flex items-center gap-1">
                                <span>{group.name}</span>
                                {group.isVerified && <CheckCircle className="w-4 h-4 text-emerald-500 fill-current bg-white rounded-full shrink-0" />}
                              </h3>
                              <div className="text-[10px] text-purple-650 dark:text-[#A78BFA] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <span>{group.type}</span>
                                <span>•</span>
                                <span>{group.membersCount} Musiciens</span>
                              </div>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 pr-2">
                              {group.description}
                            </p>

                            {/* Genres / Tags styles list */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {(group.genres || []).map(g => (
                                <span key={g} className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                                  #{g}
                                </span>
                              ))}
                            </div>
                          </div>

                        </div>

                        {/* Underline actions */}
                        <div className="sm:w-36 flex sm:flex-col justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-800 pt-3 sm:pt-0 sm:pl-3.5 mt-3 sm:mt-0 items-stretch">
                          
                          <div className="text-[9px] text-gray-400 flex items-center gap-1 pb-1 sm:self-center">
                            <MapPin className="w-3 h-3 text-purple-500 shrink-0" />
                            <span>{group.commune}, {group.ville}</span>
                          </div>

                          <button
                            onClick={() => handleViewProfile(group)}
                            className="bg-purple-100 hover:bg-purple-200 text-[#7C3AED] dark:bg-purple-950/30 dark:hover:bg-purple-950/50 flex-1 sm:flex-none py-1.5 px-3 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer text-center"
                          >
                            Détails & Médias
                          </button>

                          <div className="flex gap-1">
                            <a
                              href={`https://wa.me/${group.whatsapp.replace(/\s+/g, "")}`}
                              target="_blank"
                              rel="no-referrer"
                              onClick={() => handleContactAction(group.id, "whatsapp")}
                              className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-650 dark:hover:bg-emerald-700 text-white p-1.5 rounded-xl text-center flex-1 flex items-center justify-center transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider gap-0.5"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Salon</span>
                            </a>

                            {isOwner && (
                              <button
                                onClick={() => handleDeleteGroup(group.id, group.name)}
                                className="p-1.5 border border-rose-300 dark:border-rose-950/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-xl transition cursor-pointer"
                                title="Supprimer de l'annuaire"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Public Profile Detail View */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header / Navigation back actions */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-gray-850">
              <button
                onClick={() => setSelectedGroup(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 hover:text-purple-650 dark:hover:text-purple-400 bg-white dark:bg-[#120E22]/85 border border-gray-200 dark:border-gray-850 rounded-xl transition-all cursor-pointer shadow-inner"
              >
                <span>← Retour à l'annuaire</span>
              </button>

              <div className="flex items-center gap-2">
                {currentUserProfile && selectedGroup.creatorId === currentUserProfile.uid && (
                  <button
                    onClick={() => {
                      initFormFields(selectedGroup);
                      setShowFormModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-white hover:bg-purple-600 rounded-xl border border-gray-250 dark:border-gray-800 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Modifier mon Groupe</span>
                  </button>
                )}

                <button
                  onClick={() => simulateShareLocalLink(selectedGroup.id)}
                  className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-[#120E22]/85 dark:hover:bg-[#120E22] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs"
                >
                  <Share2 className="w-4.5 h-4.5" />
                  <span>{copiedFeedback ? "Lien Copié !" : "Partager"}</span>
                </button>
              </div>
            </div>

            {/* Immersive Cover Visual Profile card */}
            <div className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-850 bg-white dark:bg-[#120E22] shadow-sm">
              
              {/* Cover Banner page */}
              <div className="h-44 sm:h-60 relative w-full overflow-hidden bg-slate-900 border-b border-gray-100 dark:border-gray-850">
                <img 
                  src={selectedGroup.photoUrl} 
                  alt={selectedGroup.name} 
                  className="w-full h-full object-cover opacity-85" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              </div>

              {/* Bottom profile info overlapping cover */}
              <div className="px-6 pb-6 pt-16 sm:pt-20 relative flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
                
                {/* Logo profile floating layout */}
                <div className="absolute -top-12 left-6 sm:-top-16 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white dark:border-[#120E22] bg-gray-50 dark:bg-[#0A0516] overflow-hidden shadow-lg flex items-center justify-center font-black text-4xl text-gray-400">
                  {selectedGroup.logoUrl ? (
                    <img src={selectedGroup.logoUrl} alt={selectedGroup.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    "🎵"
                  )}
                </div>

                <div className="space-y-2 flex-grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-1">
                      <span>{selectedGroup.name}</span>
                      {selectedGroup.isVerified && <CheckCircle className="w-5 h-5 text-emerald-500 fill-current bg-white rounded-full inline-block" />}
                    </h1>

                    <div className="flex gap-1.5 items-center">
                      {selectedGroup.plan === "premium" && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400">
                          👑 PRESTIGE PREMIUM
                        </span>
                      )}
                      {selectedGroup.plan === "vip" && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                          ⭐ VIP COIN
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-purple-650 dark:text-purple-400 font-extrabold flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 roundedbg-purple-50 dark:bg-purple-950/20 border border-purple-100/30">{selectedGroup.type}</span>
                    <span>•</span>
                    <span>Fondé en {selectedGroup.creationYear}</span>
                    <span>•</span>
                    <span>{selectedGroup.membersCount} membres d'équipe</span>
                  </div>

                  <div className="flex flex-wrap gap-1 md:pt-1">
                    {(selectedGroup.genres || []).map(g => (
                      <span key={g} className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800/80 text-gray-500 dark:text-gray-400">
                        #{g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right CTA contact panel */}
                <div className="flex flex-wrap gap-2 pt-2 md:pt-0 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => handleToggleFollow(selectedGroup)}
                    className={`px-4 py-2.5 rounded-xl border font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      currentUserProfile && (selectedGroup.followers || []).includes(currentUserProfile.uid)
                        ? "bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/20 dark:text-rose-400"
                        : "bg-white text-gray-700 border-gray-205 dark:bg-[#120E22] dark:text-gray-300 dark:border-gray-800"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${currentUserProfile && (selectedGroup.followers || []).includes(currentUserProfile.uid) ? "fill-rose-500 stroke-rose-500" : ""}`} />
                    <span>{(selectedGroup.followers || []).includes(currentUserProfile?.uid || "") ? "Suivi" : "Suivre"}</span>
                  </button>

                  <a
                    href={`https://wa.me/${selectedGroup.whatsapp.replace(/\s+/g, "")}`}
                    target="_blank"
                    rel="no-referrer"
                    onClick={() => handleContactAction(selectedGroup.id, "whatsapp")}
                    className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${selectedGroup.phone}`}
                    onClick={() => handleContactAction(selectedGroup.id, "phone")}
                    className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 border border-transparent dark:border-gray-800"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Appeler</span>
                  </a>
                </div>

              </div>

              {/* Statistics Panel */}
              <div className="bg-gray-50 dark:bg-[#0E0B1A] border-t border-gray-100 dark:border-gray-850 px-6 py-4 grid grid-cols-3 gap-4 text-center">
                <div className="space-y-0.5">
                  <div className="text-xs text-gray-400 py-0.5 flex items-center justify-center gap-1 font-bold">
                    <Eye className="w-4 h-4 text-purple-500" />
                    <span>VUES</span>
                  </div>
                  <div className="text-lg font-black text-gray-900 dark:text-white uppercase">
                    {selectedGroup.viewsCount || 0}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs text-gray-400 py-0.5 flex items-center justify-center gap-1 font-bold">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>ABONNÉS</span>
                  </div>
                  <div className="text-lg font-black text-gray-900 dark:text-white uppercase">
                    {selectedGroup.favoritesCount || 0}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs text-gray-400 py-0.5 flex items-center justify-center gap-1 font-bold">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>CONTACTS</span>
                  </div>
                  <div className="text-lg font-black text-gray-900 dark:text-white uppercase">
                    {selectedGroup.contactsCount || 0}
                  </div>
                </div>
              </div>

            </div>

            {/* Profile Tab selectors */}
            <div className="flex gap-4 border-b border-gray-150 dark:border-gray-850">
              {[
                { name: "apropos", label: "📄 À Propos" },
                { name: "membres", label: `👥 Membres (${(selectedGroup.members || []).length})` },
                { name: "galerie", label: `🖼️ Galerie & Sons (${(selectedGroup.gallery || []).length})` }
              ].map(tab => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name as any)}
                  className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeTab === tab.name 
                      ? "border-purple-600 text-purple-600 dark:text-[#A78BFA]"
                      : "border-transparent text-gray-400 hover:text-gray-950 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Subpages renderer */}
            <div className="min-h-56">
              
              {/* Tab A PROPOS */}
              {activeTab === "apropos" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in text-gray-900 dark:text-white">
                  
                  {/* Left block cover descriptions */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-[#120E22] border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-xs space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#7C3AED] dark:text-[#A78BFA]">Présentation Générale</h3>
                      <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line font-medium">
                        {selectedGroup.description}
                      </p>
                    </div>
                  </div>

                  {/* Right block details metadata */}
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-[#120E22] border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-xs space-y-4 text-xs font-bold">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#7C3AED] dark:text-[#A78BFA]">Fiche d'Information</h3>
                      
                      <div className="space-y-2 text-gray-600 dark:text-gray-350">
                        <div className="flex justify-between pb-2 border-b border-gray-50 dark:border-gray-850">
                          <span className="text-xs text-gray-400 font-bold">Commune :</span>
                          <span>{selectedGroup.commune}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-gray-50 dark:border-gray-850">
                          <span className="text-xs text-gray-400 font-bold">Ville :</span>
                          <span>{selectedGroup.ville}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-gray-50 dark:border-gray-850">
                          <span className="text-xs text-gray-400 font-bold">Téléphone direct :</span>
                          <span>{selectedGroup.phone}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-gray-50 dark:border-gray-850">
                          <span className="text-xs text-gray-400 font-bold">Adresse Email :</span>
                          <span className="lowercase font-semibold">{selectedGroup.email || "Non renseigné"}</span>
                        </div>
                        <div className="flex justify-between pb-2">
                          <span className="text-xs text-gray-400 font-bold">Membre fondateur :</span>
                          <span className="text-[#7C3AED] dark:text-purple-400 uppercase tracking-wide">Vérifié Propriétaire</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab MEMBRES */}
              {activeTab === "membres" && (
                <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white">
                  
                  {/* Register dynamic new members overlay for OWNER ONLY */}
                  {currentUserProfile && selectedGroup.creatorId === currentUserProfile.uid && (
                    <div className="bg-purple-500/[0.02] border border-dashed border-purple-500/30 p-4 rounded-3xl relative">
                      <button
                        onClick={() => setShowMemberForm(!showMemberForm)}
                        className="px-4 py-2 bg-purple-100 dark:bg-purple-950/30 text-purple-650 dark:text-purple-300 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-purple-250 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {showMemberForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                        <span>{showMemberForm ? "Annuler" : "Ajouter un musicien à l'équipe"}</span>
                      </button>

                      <AnimatePresence>
                        {showMemberForm && (
                          <motion.form 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleAddMember} 
                            className="space-y-4 pt-4 border-t border-purple-500/10 mt-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase font-bold block pb-1">Nom du musicien</label>
                                <input
                                  type="text"
                                  required
                                  value={newMemberName}
                                  onChange={e => setNewMemberName(e.target.value)}
                                  placeholder="Nom Complet"
                                  className="w-full px-3 py-1.5 bg-white dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase font-bold block pb-1">Fonction principal</label>
                                <select
                                  value={newMemberRole}
                                  onChange={e => setNewMemberRole(e.target.value)}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                                >
                                  <option value="Chanteur Solo">Chanteur Solo</option>
                                  <option value="Choriste">Choriste</option>
                                  <option value="Batteur">Batteur</option>
                                  <option value="Pianiste">Pianiste</option>
                                  <option value="Bassiste">Bassiste</option>
                                  <option value="Guitariste">Guitariste</option>
                                  <option value="Percussionniste">Percussionniste</option>
                                  <option value="Saxophoniste">Saxophoniste</option>
                                  <option value="Manager">Manager / Producteur</option>
                                  <option value="Directeur Technique">Directeur Technique</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase font-bold block pb-1">Instrument joué</label>
                                <input
                                  type="text"
                                  required
                                  value={newMemberInstrument}
                                  onChange={e => setNewMemberInstrument(e.target.value)}
                                  placeholder="Ex: Guitare, Batterie, Keni"
                                  className="w-full px-3 py-1.5 bg-white dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
                            >
                              Confirmer l'ajout du musicien
                            </button>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Rendering Members view hierarchy */}
                  {(selectedGroup.members || []).length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-white dark:bg-[#120E22] border border-gray-100 dark:border-gray-850 rounded-2xl p-6">
                      <p className="text-xs">Aucun membre officiel n'a encore été enregistré sous ce groupe.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {selectedGroup.members.map(member => (
                        <div 
                          key={member.id} 
                          className="bg-white dark:bg-[#120E22]/60 border border-gray-100 dark:border-gray-850 p-4 rounded-2xl flex flex-col items-center text-center gap-2 shadow-inner relative group"
                        >
                          <div className="w-14 h-14 rounded-full bg-slate-50 border-2 border-purple-100 dark:border-purple-950 overflow-hidden shrink-0">
                            <img 
                              src={member.photoUrl || "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=120&auto=format&fit=crop&q=80"} 
                              alt={member.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <h4 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-tight line-clamp-1">{member.name}</h4>
                            <p className="text-[10px] text-purple-650 dark:text-purple-400 uppercase tracking-wider font-extrabold">{member.role}</p>
                            <p className="text-[9px] text-gray-400 font-semibold">{member.instrument}</p>
                          </div>

                          {currentUserProfile && selectedGroup.creatorId === currentUserProfile.uid && (
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              title="Retirer ce membre"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* Tab GALERIE */}
              {activeTab === "galerie" && (
                <div className="space-y-6 animate-fade-in text-gray-900 dark:text-white">
                  
                  {/* Visual tabs filter */}
                  <div className="flex gap-2 border-b border-gray-50 dark:border-gray-850 pb-2">
                    {[
                      { type: "all", label: "Tout" },
                      { type: "photo", label: "Photos 📸" },
                      { type: "video", label: "Vidéos 🎥" },
                      { type: "audio", label: "Audios 🎵" }
                    ].map(st => (
                      <button
                        key={st.type}
                        onClick={() => setGallerySubTab(st.type as any)}
                        className={`px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                          gallerySubTab === st.type 
                            ? "bg-purple-650 text-white"
                            : "bg-gray-100 dark:bg-gray-850 text-gray-500 dark:text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom upload media modal form for user OWNER */}
                  {currentUserProfile && selectedGroup.creatorId === currentUserProfile.uid && (
                    <div className="bg-purple-500/[0.02] border border-dashed border-purple-500/30 p-4 rounded-3xl relative">
                      <button
                        onClick={() => setShowMediaForm(!showMediaForm)}
                        className="px-4 py-2 bg-purple-100 dark:bg-purple-950/30 text-purple-650 dark:text-purple-300 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-purple-250 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {showMediaForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                        <span>{showMediaForm ? "Annuler" : "Ajouter un média à l'annuaire"}</span>
                      </button>

                      <AnimatePresence>
                        {showMediaForm && (
                          <motion.form 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleAddMedia} 
                            className="space-y-4 pt-4 border-t border-purple-500/10 mt-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase font-bold block pb-1">Titre de l'élément</label>
                                <input
                                  type="text"
                                  required
                                  value={newMediaTitle}
                                  onChange={e => setNewMediaTitle(e.target.value)}
                                  placeholder="Ex: Live Sofitel, Répétition..."
                                  className="w-full px-3 py-1.5 bg-white dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase font-bold block pb-1">Type de média</label>
                                <select
                                  value={newMediaType}
                                  onChange={e => setNewMediaType(e.target.value as any)}
                                  className="w-full px-3 py-1.5 bg-white dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                                >
                                  <option value="photo">Photo 📸</option>
                                  <option value="video">Vidéo YouTube Link 🎥</option>
                                  <option value="audio">Audio MP3 Link 🎵</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase font-bold block pb-1">URL Web du média</label>
                                <input
                                  type="text"
                                  required
                                  value={newMediaUrl}
                                  onChange={e => setNewMediaUrl(e.target.value)}
                                  placeholder="Coller l'adresse URL du fichier"
                                  className="w-full px-3 py-1.5 bg-white dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
                            >
                              Enregistrer le Média
                            </button>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Rendering Content filters media catalog */}
                  {(() => {
                    const filteredGallery = (selectedGroup.gallery || []).filter(item => {
                      if (gallerySubTab === "all") return true;
                      return item.type === gallerySubTab;
                    });

                    if (filteredGallery.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-400 bg-white dark:bg-[#120E22] border border-gray-100 dark:border-gray-850 rounded-2xl p-6">
                          <p className="text-xs">Aucun média enregistré de cette catégorie.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredGallery.map(item => (
                          <div 
                            key={item.id} 
                            className="bg-white dark:bg-[#120E22]/60 border border-gray-100 dark:border-gray-850 rounded-2xl p-4 flex flex-col gap-2 relative group overflow-hidden"
                          >
                            {/* Render Photo items */}
                            {item.type === "photo" && (
                              <div 
                                className="h-44 w-full bg-slate-900 rounded-xl overflow-hidden cursor-pointer relative"
                                onClick={() => setLightboxUrl(item.url)}
                              >
                                <img src={item.url} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-all" referrerPolicy="no-referrer" />
                                <div className="absolute top-2 left-2 bg-black/40 text-white px-2 py-0.5 rounded-md text-[9px] uppercase font-black tracking-widest">Photo</div>
                              </div>
                            )}

                            {/* Render Video items */}
                            {item.type === "video" && (
                              <div className="h-44 w-full bg-slate-950 rounded-xl overflow-hidden relative">
                                {item.url.includes("youtube.com/embed/") ? (
                                  <iframe 
                                    src={item.url} 
                                    title={item.title} 
                                    className="w-full h-full border-0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-slate-800 text-purple-400 gap-1 font-bold text-[10px] p-4 text-center">
                                    <Video className="w-8 h-8" />
                                    <span>Lien Vidéo Externe</span>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline mt-1">Ouvrir dans un nouvel onglet</a>
                                  </div>
                                )}
                                <div className="absolute top-2 left-2 bg-black/40 text-white px-2 py-0.5 rounded-md text-[9px] uppercase font-black tracking-widest">Vidéo</div>
                              </div>
                            )}

                            {/* Render Audio items */}
                            {item.type === "audio" && (
                              <div className="h-44 w-full bg-[#0E0B1A] border border-indigo-950/30 rounded-xl flex flex-col items-center justify-center p-4 text-center gap-3 relative">
                                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full inline-flex">
                                  <Volume2 className="w-7 h-7" />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">AUDIO TRACK</div>
                                  <div className="text-xs font-bold text-gray-250 dark:text-white truncate max-w-44">{item.title}</div>
                                </div>

                                {item.url.endsWith(".mp3") || item.url.includes("helix") ? (
                                  <audio controls className="w-full h-8 opacity-80 mt-1 max-w-44 [&::-webkit-media-controls-enclosure]:bg-transparent">
                                    <source src={item.url} type="audio/mpeg" />
                                    Moteur audio indisponible.
                                  </audio>
                                ) : (
                                  <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="px-3 py-1 bg-purple-500/15 border border-purple-500/30 text-[10px] text-purple-300 rounded-lg truncate max-w-44"
                                  >
                                    Écouter le lien externe
                                  </a>
                                )}
                                <div className="absolute top-2 left-2 bg-black/40 text-white px-2 py-0.5 rounded-md text-[9px] uppercase font-black tracking-widest">Audio</div>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-xs font-extrabold px-1 pt-1">
                              <span className="truncate flex-1 max-w-44">{item.title}</span>
                              {currentUserProfile && selectedGroup.creatorId === currentUserProfile.uid && (
                                <button
                                  onClick={() => handleDeleteMedia(item.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg shrink-0 transition"
                                  title="Supprimer ce média"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                          </div>
                        ))}
                      </div>
                    );
                  })()}

                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox for full size photo preview */}
      <AnimatePresence>
        {lightboxUrl && (
          <div 
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setLightboxUrl(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden relative"
            >
              <img src={lightboxUrl} alt="Preview" className="object-scale-down w-full h-full rounded-2xl max-h-[80vh]" referrerPolicy="no-referrer" />
              <button 
                className="absolute top-4 right-4 bg-black/50 hover:bg-black p-2 text-white font-bold rounded-full w-9 h-9 flex items-center justify-center cursor-pointer"
                onClick={() => setLightboxUrl(null)}
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Registration / Modification FORM MODAL */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="bg-white dark:bg-[#120E22] border border-gray-150 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full relative overflow-hidden text-gray-900 dark:text-white shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-indigo-600" />

              <button 
                onClick={() => { setShowFormModal(false); setRegistrationSuccess(false); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-950 dark:hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>

              {!registrationSuccess ? (
                <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
                  
                  <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tight">
                      {editingGroup ? "Modifier les Informations" : "➕ Créer mon groupe"}
                    </h2>
                    <p className="text-xs text-gray-400">
                      Renseignez la fiche officielle du groupe pour l'annuaire de Côte d'Ivoire.
                    </p>
                  </div>

                  {/* Nom du groupe */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-500 block pb-1">Nom du Groupe</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Les Chocs de Yopougon"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-500 block pb-1">Type de Groupe</label>
                      <select
                        value={formType}
                        onChange={e => setFormType(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-extrabold focus:outline-none"
                      >
                        {TYPES_GROUPES.map(tg => <option key={tg} value={tg}>{tg}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Commune et Ville */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-500 block pb-1">Commune</label>
                      <select
                        value={formCommune}
                        onChange={e => setFormCommune(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-extrabold focus:outline-none"
                      >
                        {COMMUNES_LIST.map(tg => <option key={tg} value={tg}>{tg}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-500 block pb-1">Ville</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Abidjan, Yamoussoukro"
                        value={formVille}
                        onChange={e => setFormVille(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Telephones Whatsapp Mail */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-500 block pb-1">Téléphone</label>
                      <input
                        type="tel"
                        required
                        placeholder="0707..."
                        value={formPhone}
                        onChange={e => setFormPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-500 block pb-1">WhatsApp</label>
                      <input
                        type="tel"
                        required
                        placeholder="0505..."
                        value={formWhatsapp}
                        onChange={e => setFormWhatsapp(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-500 block pb-1">Email</label>
                      <input
                        type="email"
                        required
                        placeholder="groupe@gmail.com"
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* MembersCount & Founded Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-500 block pb-1">Nombre membres d'équipe</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formMembersCount}
                        onChange={e => setFormMembersCount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-500 block pb-1">Année de Création</label>
                      <input
                        type="number"
                        min="1960"
                        max={new Date().getFullYear()}
                        required
                        value={formCreationYear}
                        onChange={e => setFormCreationYear(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Photo cover URL & Logo URL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-500 block pb-1">Lien Photo du Groupe (Cover)</label>
                      <input
                        type="url"
                        placeholder="Laisser vide pour photo par défaut"
                        value={formPhotoUrl}
                        onChange={e => setFormPhotoUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-black text-gray-500 block pb-1">Lien Logo du Groupe</label>
                      <input
                        type="url"
                        placeholder="Laisser vide pour logo par défaut"
                        value={formLogoUrl}
                        onChange={e => setFormLogoUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-gray-500 block pb-1">Description & Formules d'Animations</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Présentation du groupe, tarifs indicatifs, répertoires..."
                      value={formDescription}
                      onChange={e => setFormDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none resize-none"
                    />
                  </div>

                  {/* Styles Musicaux - Multiple choosing */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-gray-500 block">Styles Musicaux (Sélection Multiple*)</label>
                    <div className="flex flex-wrap gap-1 bg-gray-50 dark:bg-[#0A0516] p-2.5 rounded-xl border border-gray-150 dark:border-gray-800">
                      {STYLES_MUSICAUX.map(st => {
                        const isChosen = formGenres.includes(st);
                        return (
                          <button
                            type="button"
                            key={st}
                            onClick={() => toggleGenreSelection(st)}
                            className={`px-2 py-1 rounded-lg text-[9px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                              isChosen 
                                ? "bg-purple-600 text-white"
                                : "bg-white dark:bg-[#120E22] border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-405 hover:bg-slate-100"
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Plans options pricing only if creating new group */}
                  {!editingGroup && (
                    <div className="space-y-2 pt-1">
                      <label className="text-[10px] uppercase font-black text-gray-500 block">Niveau de visibilité d'Annuaire d'Abidjan</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: "standard", label: "Standard", price: "Simulation Gratuit" },
                          { value: "vip", label: "⭐ VIP", price: "10 000 FCFA/an" },
                          { value: "premium", label: "👑 Premium", price: "25 000 FCFA/an" }
                        ].map((opt) => (
                          <button
                            type="button"
                            key={opt.value}
                            onClick={() => setFormPlan(opt.value as any)}
                            className={`p-2 rounded-xl text-center border transition flex flex-col items-center justify-center cursor-pointer ${
                              formPlan === opt.value 
                                ? "bg-purple-550/20 text-purple-600 dark:text-purple-300 border-purple-500 ring-2 ring-purple-500/10" 
                                : "bg-gray-50 dark:bg-[#0A0516] text-gray-400 border-gray-150 dark:border-gray-800"
                            }`}
                          >
                            <span className="text-[10px] font-black uppercase tracking-tight">{opt.label}</span>
                            <span className="text-[8.5px] opacity-75">{opt.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Simulated Secure Payment Checkout details if premium select */}
                  {!editingGroup && formPlan !== "standard" && (
                    <div className="p-3 bg-purple-500/[0.03] rounded-xl border border-dashed border-purple-500/20 space-y-3">
                      <div className="text-[10px] font-extrabold text-purple-650 dark:text-purple-300 uppercase tracking-widest">
                        SIMULATION PASSRELE DE PAIEMENT SÉCURISÉ (MOCK) :
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-gray-400 block font-bold">Opérateur Mobile Money</label>
                          <select
                            value={paymentProvider}
                            onChange={e => setPaymentProvider(e.target.value as any)}
                            className="w-full px-2 py-1 bg-white dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-lg text-[10px] font-extrabold text-slate-800 dark:text-white"
                          >
                            <option value="Wave">Wave</option>
                            <option value="Orange Money">Orange Money</option>
                            <option value="MTN Momo">MTN Momo</option>
                            <option value="Moov Money">Moov Money</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block font-bold">Numéro de facturation</label>
                          <input
                            type="tel"
                            required
                            value={paymentPhone}
                            onChange={e => setPaymentPhone(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-[#0A0516] border border-gray-150 dark:border-gray-800 rounded-lg text-[10px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-purple-650 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span>Référencer le Groupe {formPlan !== "standard" && !editingGroup && `(${getPlanPrice(formPlan).toLocaleString()} FCFA)`}</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center space-y-4 text-gray-950 dark:text-white">
                  <div className="w-14 h-14 bg-purple-100 dark:bg-purple-950/40 text-purple-650 dark:text-purple-300 border border-purple-200 dark:border-purple-950 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                    ✓
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">GUIDE GROUPE VIP VALIDE !</h2>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Félicitations, votre groupe est désormais listé avec succès dans l'annuaire de YA GOMBO MUSIC. Les requêtes de scènes arrivent !
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowFormModal(false);
                      setRegistrationSuccess(false);
                    }}
                    className="px-6 py-2 bg-purple-650 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider rounded-lg transition"
                  >
                    Fermer l'onglet
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
