import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Music, Search, MapPin, Award, 
  Sparkles, ShieldCheck, Star, Trash2, Globe, Check, 
  Smartphone, Plus, Menu, ChevronRight 
} from "lucide-react";
import { gomboDB } from "../firebase";
import { UserProfile, GomboPayment, GomboSubscription } from "../types";

interface GroupeVIPAnnuaireProps {
  currentUserProfile: UserProfile | null;
  onRefreshProfile: () => void;
  onShowAuth: () => void;
}

interface SimulatedGroup {
  id: string;
  name: string;
  category: "Orchestre" | "Groupes Zouglou" | "Chorale" | "Groupes Gospel";
  location: string;
  description: string;
  phone: string;
  status: "standard" | "vip" | "premium";
  membersCount: number;
  avatarUrl?: string;
  creatorId?: string;
}

const PRESET_GROUPS: SimulatedGroup[] = [
  {
    id: "g1",
    name: "Les Choc du Zouglou Abidjan",
    category: "Groupes Zouglou",
    location: "Yopougon, Abidjan",
    description: "Le meilleur du djeka et du Zouglou acoustique woyo en Côte d'Ivoire. Nous animons les mariages, les anniversaires et les concerts géants.",
    phone: "07 48 29 10 20",
    status: "premium",
    membersCount: 6,
    avatarUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=120&auto=format&fit=crop&q=60"
  },
  {
    id: "g2",
    name: "Le Chœur Céleste de Cocody",
    category: "Chorale",
    location: "Cocody, Abidjan",
    description: "Chorale prestigieuse spécialisée dans les chants grégoriens, répertoires classiques, musiques d'église locales et mariages religieux d'exception.",
    phone: "05 11 22 33 44",
    status: "vip",
    membersCount: 22,
    avatarUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=120&auto=format&fit=crop&q=60"
  },
  {
    id: "g3",
    name: "Abidjan Magic Rumba Band",
    category: "Orchestre",
    location: "Marcory, Abidjan",
    description: "Orchestre de variété internationale, Rumba Congolaise et Coupé-Décalé chic. Prestations haut de gamme pour hôtels et soirées d'entreprises.",
    phone: "01 89 77 66 55",
    status: "premium",
    membersCount: 9,
    avatarUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=60"
  },
  {
    id: "g4",
    name: "Gospel Light Singers Côte d'Ivoire",
    category: "Groupes Gospel",
    location: "Plateau, Abidjan",
    description: "Groupe professionnel d'adoration gospel contemporain. Des voix magnifiques et un orchestre rythmique impeccable pour tous vos événements de réjouissance.",
    phone: "07 07 44 99 88",
    status: "vip",
    membersCount: 12,
    avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=60"
  },
  {
    id: "g5",
    name: "Orchestre Souvenir de Bassam",
    category: "Orchestre",
    location: "Grand-Bassam",
    description: "Variétés musicales rétro ivoiriennes et jazz d'époque. Une ambiance feutrée et nostalgique pour les dîners gala.",
    phone: "07 55 44 33 22",
    status: "standard",
    membersCount: 5,
    avatarUrl: ""
  }
];

export default function GroupeVIPAnnuaire({ 
  currentUserProfile, 
  onRefreshProfile, 
  onShowAuth 
}: GroupeVIPAnnuaireProps) {
  const [groups, setGroups] = useState<SimulatedGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // Registration Flow States
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupCategory, setGroupCategory] = useState<"Orchestre" | "Groupes Zouglou" | "Chorale" | "Groupes Gospel">("Orchestre");
  const [groupLocation, setGroupLocation] = useState("Cocody, Abidjan");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupPhone, setGroupPhone] = useState(currentUserProfile?.phone || "");
  const [groupMembers, setGroupMembers] = useState(5);
  const [groupStatusOption, setGroupStatusOption] = useState<"standard" | "vip" | "premium">("standard");
  const [paymentProvider, setPaymentProvider] = useState<"Wave" | "Orange Money" | "MTN Momo" | "Moov Money">("Wave");
  const [paymentPhone, setPaymentPhone] = useState(currentUserProfile?.phone || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = () => {
    try {
      const stored = localStorage.getItem("gombo_simulated_groups");
      if (stored) {
        setGroups(JSON.parse(stored));
      } else {
        localStorage.setItem("gombo_simulated_groups", JSON.stringify(PRESET_GROUPS));
        setGroups(PRESET_GROUPS);
      }
    } catch(e) {
      console.error(e);
      setGroups(PRESET_GROUPS);
    }
  };

  const getStatusPrice = (status: "standard" | "vip" | "premium") => {
    switch(status) {
      case "standard": return 0;
      case "vip": return 10000;
      case "premium": return 25000;
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile) {
      onShowAuth();
      return;
    }

    setLoading(true);
    const id = "group_" + Math.random().toString(36).substr(2, 9);
    const newGroup: SimulatedGroup = {
      id,
      name: groupName,
      category: groupCategory,
      location: groupLocation,
      description: groupDescription,
      phone: groupPhone,
      status: groupStatusOption,
      membersCount: Number(groupMembers),
      creatorId: currentUserProfile.uid
    };

    try {
      const price = getStatusPrice(groupStatusOption);

      if (price > 0) {
        // 1. Create simulated subscription db entry
        await gomboDB.publishSubscription({
          userId: currentUserProfile.uid,
          userName: `${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || currentUserProfile.artistName || ""}`.trim() || "Groupe",
          type: groupStatusOption === "vip" ? "groupe_vip" : "groupe_premium",
          status: "active",
          price,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

        // 2. Create simulated transaction log 
        await gomboDB.publishPayment({
          userId: currentUserProfile.uid,
          userName: `${currentUserProfile.firstName || ""} ${currentUserProfile.lastName || currentUserProfile.artistName || ""}`.trim() || "Groupe",
          amount: price,
          purpose: `Abonnement Annuaire Groupe - Status ${groupStatusOption.toUpperCase()}`,
          provider: paymentProvider,
          phoneNumber: paymentPhone,
          status: "success"
        });
      }

      // 3. Save new group to local directory state
      const updatedList = [...groups, newGroup];
      localStorage.setItem("gombo_simulated_groups", JSON.stringify(updatedList));
      setGroups(updatedList);

      // 4. Update current user's profile group state
      await gomboDB.updateUserProfile(currentUserProfile.uid, {
        groupStatus: groupStatusOption,
        groupType: groupCategory,
        badges: Array.from(new Set([...(currentUserProfile.badges || []), groupStatusOption === "vip" || groupStatusOption === "premium" ? "🎼 Groupe VIP" : "🔥 Artiste Actif"]))
      });

      setRegistrationSuccess(true);
      onRefreshProfile();
    } catch(err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de votre groupe.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = (id: string) => {
    if (!window.confirm("Voulez-vous vraiment retirer votre groupe de l'annuaire ?")) return;
    const updated = groups.filter(g => g.id !== id);
    localStorage.setItem("gombo_simulated_groups", JSON.stringify(updated));
    setGroups(updated);
  };

  // Filters logic
  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          g.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || g.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || g.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    // Premium first, then VIP, then Standard
    const priority = { premium: 3, vip: 2, standard: 1 };
    return (priority[b.status] || 1) - (priority[a.status] || 1);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Visual Hub header with premium gold badge */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border border-amber-500/20 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full" />
        
        <div className="space-y-3 max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider">
            🎼 Le Coin des Groupes VIP
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Annuaire des Groupes de Côte d'Ivoire</h1>
          <p className="text-xs text-gray-300 leading-relaxed max-w-xl">
            Trouvez le parfait groupe de Zouglou, chorale d'église ou orchestre rumba de prestige à Abidjan pour vos événements privés, mariages d'exception, maquis et spectacles chics !
          </p>
        </div>

        <div className="flex-shrink-0">
          {currentUserProfile ? (
            <button
              onClick={() => {
                setRegistrationSuccess(false);
                setShowAddGroupModal(true);
              }}
              className="px-6 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm rounded-2xl transition shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              Référencer mon Groupe VIP
            </button>
          ) : (
            <button
              onClick={onShowAuth}
              className="px-6 py-4 bg-amber-500/20 text-amber-400 font-bold text-sm rounded-2xl border border-amber-500/30 hover:bg-amber-500/30 transition"
            >
              Se connecter pour référencer
            </button>
          )}
        </div>
      </div>

      {/* Plans & Pricing Cards Container - Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {[
          { 
            title: "Plan Standard", 
            price: "Gratuit", 
            badge: "De base", 
            benefits: ["Référencement simple", "Mise en relation WhatsApp", "1 catégorie musicale"], 
            color: "border-gray-200 dark:border-gray-800 text-gray-500" 
          },
          { 
            title: "Statut VIP ⭐", 
            price: "10 000 FCFA/an", 
            badge: "Recommandé", 
            benefits: ["Badging VIP doré", "Affichage prioritaire", "Jusqu'à 15 membres listés", "Liens vidéos de concerts"], 
            color: "border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400 scale-[1.02]" 
          },
          { 
            title: "Prestige Premium 👑", 
            price: "25 000 FCFA/an", 
            badge: "Légende", 
            benefits: ["Badge Premium étincelant", "Affichage en tête de liste absolu", "Support réservation VIP", "Couverture réseaux sociaux Gombo"], 
            color: "border-yellow-400 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400" 
          }
        ].map((plan) => (
          <div key={plan.title} className={`p-5 rounded-2xl border ${plan.color} space-y-4 shadow-sm relative flex flex-col justify-between bg-white dark:bg-[#1e1e24]`}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-sm text-gray-950 dark:text-white uppercase">{plan.title}</h3>
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-gray-150 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{plan.badge}</span>
              </div>
              <div className="text-xl font-black text-gray-900 dark:text-white">{plan.price}</div>
              <ul className="text-xs space-y-2 pt-2">
                {plan.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-[10px] text-gray-400 text-center capitalize border-t border-dashed border-gray-100 dark:border-gray-800 pt-2.5">
              Bientôt disponible • Simulation Démo active
            </div>
          </div>
        ))}
      </div>

      {/* Directory filters & search bar */}
      <div className="bg-white dark:bg-[#1e1e24] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher un groupe, un style, un mot clé d'Abidjan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-950 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-850 dark:text-white"
            >
              <option value="all">Toutes Catégories</option>
              <option value="Orchestre">🎻 Orchestres</option>
              <option value="Groupes Zouglou">🥁 Zouglou Acoustique</option>
              <option value="Chorale">⛪ Chorales église</option>
              <option value="Groupes Gospel">🎤 Groupes Gospel</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-850 dark:text-white"
            >
              <option value="all">Tous Niveaux</option>
              <option value="premium">👑 Prestige Premium</option>
              <option value="vip">⭐ Statut VIP</option>
              <option value="standard">Standard</option>
            </select>
          </div>
        </div>

        {/* Directory output listing card-grid */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-400 space-y-2">
            <div className="text-4xl text-gray-300">👥</div>
            <div className="text-xs">Aucun groupe ne correspond aux filtres de votre recherche.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGroups.map((g) => (
              <motion.div
                key={g.id}
                layout
                className={`p-5 rounded-2xl border transition shadow-sm relative overflow-hidden flex gap-4 ${
                  g.status === "premium" 
                    ? "border-yellow-400 shadow-md ring-2 ring-yellow-500/10 bg-gradient-to-br from-yellow-500/[0.04] to-transparent" 
                    : g.status === "vip" 
                    ? "border-amber-400 bg-gradient-to-br from-amber-500/[0.04] to-transparent"
                    : "border-gray-105 dark:border-gray-800 bg-white dark:bg-[#1e1e24]"
                }`}
              >
                {/* Visual Status Tag absolute label */}
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  {g.status === "premium" && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 inline-flex items-center gap-0.5">
                      👑 PREMIUM
                    </span>
                  )}
                  {g.status === "vip" && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 inline-flex items-center gap-0.5">
                      ⭐ VIP
                    </span>
                  )}
                </div>

                {/* Left logo / avatar */}
                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center text-2xl overflow-hidden shadow-inner font-black text-gray-500">
                  {g.avatarUrl ? (
                    <img src={g.avatarUrl} alt={g.name} className="w-full h-full object-cover" />
                  ) : (
                    g.category === "Chorale" ? "⛪" : g.category === "Groupes Gospel" ? "🎤" : "🥁"
                  )}
                </div>

                {/* Content details */}
                <div className="space-y-2 flex-grow">
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-sm text-gray-950 dark:text-white pr-20">{g.name}</h3>
                    <div className="text-[10px] text-purple-650 dark:text-purple-400 font-bold flex items-center gap-2">
                      <span>{g.category}</span>
                      <span>•</span>
                      <span>{g.membersCount} Musiciens</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 md:line-clamp-3">
                    {g.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-50 dark:border-gray-800">
                    <div className="text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {g.location}
                    </div>

                    <div className="flex items-center gap-2">
                      {currentUserProfile && g.creatorId === currentUserProfile.uid && (
                        <button
                          onClick={() => handleDeleteGroup(g.id)}
                          className="p-1 hover:text-red-500 text-gray-400 transition"
                          title="Supprimer le groupe du catalogue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <a
                        href={`https://wa.me/${g.phone.replace(/\s+/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition text-[10px]"
                      >
                        📞 Contact Direct
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal to Register a new Group */}
      <AnimatePresence>
        {showAddGroupModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#1e1e24] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full relative overflow-hidden text-gray-900 dark:text-white shadow-2xl"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 to-yellow-500" />

              <button 
                onClick={() => { setShowAddGroupModal(false); setRegistrationSuccess(false); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-950 dark:hover:text-white font-bold"
              >
                ✕
              </button>

              {!registrationSuccess ? (
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tight">Référencer un Nouveau Groupe</h2>
                    <p className="text-xs text-gray-400">Renseignez les détails pour le Coin des Groupes VIP d'Abidjan.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5Col">
                      <label className="text-[11px] font-bold text-gray-500 block">Nom du Groupe</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Les Frères du Zouglou"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-950 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-500 block">Catégorie d'Annuaire</label>
                      <select
                        value={groupCategory}
                        onChange={(e) => setGroupCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-950 dark:text-white"
                      >
                        <option value="Orchestre">🎻 Orchestre</option>
                        <option value="Groupes Zouglou">🥁 Zouglou Acoustique</option>
                        <option value="Chorale">⛪ Chorale église</option>
                        <option value="Groupes Gospel">🎤 Groupe Gospel</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 block">Commune d'Abidjan</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Marcory, Cocody, Yopougon"
                        value={groupLocation}
                        onChange={(e) => setGroupLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-950 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-500 block">Nombre de membres/musiciens</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={groupMembers}
                        onChange={(e) => setGroupMembers(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-950 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 block">Description artistique & Prestations</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Décrivez vos styles favoris, vos formules d'animations, vos accomplissements..."
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-950 dark:text-white resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 block">Téléphone contact WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 07 07 12 34 56"
                      value={groupPhone}
                      onChange={(e) => setGroupPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-950 dark:text-white"
                    />
                  </div>

                  {/* Pricing Status Selectors */}
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-black uppercase text-gray-500 block">Sélectionnez le niveau de visibilité à Abidjan</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "standard", label: "Standard", price: "0 FCFA" },
                        { value: "vip", label: "⭐ VIP", price: "10 000 FCFA/an" },
                        { value: "premium", label: "👑 Premium", price: "25 000 FCFA/an" }
                      ].map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => setGroupStatusOption(opt.value as any)}
                          className={`p-2 rounded-xl text-center border transition flex flex-col items-center justify-center ${
                            groupStatusOption === opt.value 
                              ? "bg-amber-500/20 text-slate-900 dark:text-white border-amber-500 ring-2 ring-amber-500/20" 
                              : "bg-gray-50 dark:bg-gray-850 text-gray-500 border-gray-100 dark:border-gray-800"
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-tight">{opt.label}</span>
                          <span className="text-[9px] opacity-70">{opt.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {groupStatusOption !== "standard" && (
                    <div className="p-3 bg-amber-500/5 rounded-xl border border-dashed border-amber-500/30 space-y-3">
                      <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Simulation de Paiement Sécurisé :</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 block font-semibold">Opérateur Mobile</label>
                          <select
                            value={paymentProvider}
                            onChange={(e) => setPaymentProvider(e.target.value as any)}
                            className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-[10px]"
                          >
                            <option value="Wave">Wave</option>
                            <option value="Orange Money">Orange Money</option>
                            <option value="MTN Momo">MTN Momo</option>
                            <option value="Moov Money">Moov Money</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block font-semibold">Numéro de facturation</label>
                          <input
                            type="tel"
                            required
                            value={paymentPhone}
                            onChange={(e) => setPaymentPhone(e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-[10px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-slate-950" />
                        Confirmer le Référencement du Groupe {groupStatusOption !== "standard" && `(${getStatusPrice(groupStatusOption).toLocaleString()} FCFA)`}
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-100 dark:border-amber-900 rounded-full flex items-center justify-center mx-auto text-3xl">
                    ✓
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">GUIDE GROUPE VIP VALIDE !</h2>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                      Félicitations, votre groupe est désormais répertorié dans le catalogue d'annuaire d'élite de Y'a Gombo Music. Les contrats de scènes arrivent à grand pas !
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddGroupModal(false);
                      setRegistrationSuccess(false);
                    }}
                    className="px-6 py-2 bg-gray-900 dark:bg-gray-800 hover:bg-black text-white text-xs font-bold rounded-lg transition"
                  >
                    Fermer la vue
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
