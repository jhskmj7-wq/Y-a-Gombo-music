import { NotificationService } from "../../lib/NotificationService";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart3, Plus, Trash2, Edit, Copy, CheckCircle, XCircle, Archive, 
  Clock, AlertTriangle, Send, User, ShieldCheck, Filter, Search, Sparkles, 
  MapPin, Globe, CheckSquare, Square, ChevronRight, HelpCircle, Star, MessageSquare
} from "lucide-react";
import { collection, onSnapshot, query, orderBy, doc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface Poll {
  id: string;
  title: string;
  description: string;
  category: "Application" | "Musique" | "Événements" | "Wallet" | "Autre";
  startDate: string;
  endDate: string;
  maxChoices: number;
  questionType: "single" | "multiple" | "yes_no" | "satisfaction" | "text";
  questionTitle: string;
  audienceType: "all" | "premium" | "musician" | "promoter" | "admin";
  audienceCity?: string;
  audienceCommune?: string;
  status: "active" | "closed" | "archived";
  createdAt: string;
}

interface PollQuestion {
  id: string;
  pollId: string;
  title: string;
  type: string;
}

interface PollChoice {
  id: string;
  pollId: string;
  questionId: string;
  text: string;
  order: number;
}

interface PollResponse {
  id: string;
  pollId: string;
  userUid: string;
  userName: string;
  answers: string[]; // choice ids or string answer
  rating?: number;
  comment?: string;
  createdAt: string;
}

export default function AdminPollCenter({ audioSynth }: { audioSynth?: any }) {
  useEffect(() => {
    console.log("[MODULE: AdminPollCenter] Mounted");
    return () => console.log("[MODULE: AdminPollCenter] Unmounted");
  }, []);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [responses, setResponses] = useState<PollResponse[]>([]);
  const [choices, setChoices] = useState<PollChoice[]>([]);
  
  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<Poll["category"]>("Application");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [formEndDate, setFormEndDate] = useState("");
  const [formMaxChoices, setFormMaxChoices] = useState(1);
  const [formQuestionType, setFormQuestionType] = useState<Poll["questionType"]>("single");
  const [formQuestionTitle, setFormQuestionTitle] = useState("");
  const [formChoices, setFormChoices] = useState<string[]>(["Choix 1", "Choix 2"]);
  const [formAudienceType, setFormAudienceType] = useState<Poll["audienceType"]>("all");
  const [formAudienceCity, setFormAudienceCity] = useState("Toutes");
  const [formAudienceCommune, setFormAudienceCommune] = useState("Toutes");
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const categories = ["Application", "Musique", "Événements", "Wallet", "Autre"];
  const questionTypes = [
    { key: "single", label: "Choix unique 🔘" },
    { key: "multiple", label: "Choix multiples ☑️" },
    { key: "yes_no", label: "Oui / Non 🤝" },
    { key: "satisfaction", label: "Échelle (1-5 Étoiles) ⭐" },
    { key: "text", label: "Texte libre ✍️" }
  ];

  // 1. Listen to polls collection
  useEffect(() => {
    const q = query(collection(db, "polls"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Poll[];
      setPolls(list);
      if (list.length > 0 && !selectedPoll) {
        setSelectedPoll(list[0]);
      }
    }, (err) => {
      console.warn("Error streaming polls:", err);
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen to choices for selected poll
  useEffect(() => {
    if (!selectedPoll?.id) {
      setChoices([]);
      return;
    }
    const q = query(collection(db, "pollChoices"), where("pollId", "==", selectedPoll.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PollChoice[];
      setChoices(list.sort((a, b) => a.order - b.order));
    });
    return () => unsubscribe();
  }, [selectedPoll?.id]);

  // 3. Listen to responses for selected poll
  useEffect(() => {
    if (!selectedPoll?.id) {
      setResponses([]);
      return;
    }
    const q = query(collection(db, "pollResponses"), where("pollId", "==", selectedPoll.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PollResponse[];
      setResponses(list);
    });
    return () => unsubscribe();
  }, [selectedPoll?.id]);

  // Handle adding choice input
  const addFormChoice = () => {
    setFormChoices([...formChoices, `Choix ${formChoices.length + 1}`]);
  };

  // Handle removing choice input
  const removeFormChoice = (index: number) => {
    const updated = [...formChoices];
    updated.splice(index, 1);
    setFormChoices(updated);
  };

  // Handle form change on choice text
  const handleChoiceTextChange = (index: number, val: string) => {
    const updated = [...formChoices];
    updated[index] = val;
    setFormChoices(updated);
  };

  // Pre-fill form for editing
  const handleStartEdit = (poll: Poll) => {
    setEditingPollId(poll.id);
    setFormTitle(poll.title);
    setFormDescription(poll.description);
    setFormCategory(poll.category);
    setFormStartDate(poll.startDate);
    setFormEndDate(poll.endDate);
    setFormMaxChoices(poll.maxChoices || 1);
    setFormQuestionType(poll.questionType);
    setFormQuestionTitle(poll.questionTitle || "");
    setFormAudienceType(poll.audienceType);
    setFormAudienceCity(poll.audienceCity || "Toutes");
    setFormAudienceCommune(poll.audienceCommune || "Toutes");
    
    // Fetch choices for editing
    const fetchChoices = async () => {
      const q = query(collection(db, "pollChoices"), where("pollId", "==", poll.id));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => d.data() as PollChoice).sort((a, b) => a.order - b.order);
      setFormChoices(list.map(c => c.text));
    };
    fetchChoices();
    setIsCreating(true);
  };

  // Duplication helper
  const handleDuplicate = async (poll: Poll) => {
    try {
      const newPollId = `poll_${Date.now()}`;
      const duplicatePayload = {
        ...poll,
        id: newPollId,
        title: `${poll.title} (Copie)`,
        createdAt: new Date().toISOString(),
        status: "active"
      };
      
      await setDoc(doc(db, "polls", newPollId), duplicatePayload);

      // Duplicate question
      const qId = `q_${Date.now()}`;
      await setDoc(doc(db, "pollQuestions", qId), {
        id: qId,
        pollId: newPollId,
        title: poll.questionTitle,
        type: poll.questionType
      });

      // Duplicate choices if any
      const choicesQuery = query(collection(db, "pollChoices"), where("pollId", "==", poll.id));
      const choicesSnap = await getDocs(choicesQuery);
      for (const choiceDoc of choicesSnap.docs) {
        const cData = choiceDoc.data() as PollChoice;
        const newCId = `choice_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await setDoc(doc(db, "pollChoices", newCId), {
          ...cData,
          id: newCId,
          pollId: newPollId,
          questionId: qId
        });
      }

      setSuccessMsg("Sondage dupliqué avec succès ! Un nouveau sondage actif a été créé.");
      try { audioSynth?.playValidationSuccess?.(); } catch(_) {}
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(`Erreur de duplication : ${err.message}`);
    }
  };

  // Toggle status (clôturer, archiver)
  const handleUpdateStatus = async (pollId: string, newStatus: Poll["status"]) => {
    try {
      await updateDoc(doc(db, "polls", pollId), { status: newStatus });
      setSuccessMsg(`Statut du sondage mis à jour à : ${newStatus}`);
      try { audioSynth?.playValidationSuccess?.(); } catch(_) {}
      setTimeout(() => setSuccessMsg(""), 4000);

      // If closing, send notifications with results
      if (newStatus === "closed") {
        await NotificationService.sendNotification({
          userId: "all",
          title: "Sondage Clôturé 📊",
          message: `Les résultats du sondage officiel "${polls.find(p => p.id === pollId)?.title}" sont désormais disponibles !`,
          type: "poll_results",
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setErrorMsg(`Erreur lors de la mise à jour : ${err.message}`);
    }
  };

  // Delete poll
  const handleDelete = async (pollId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce sondage et toutes ses données associées ?")) return;
    try {
      await deleteDoc(doc(db, "polls", pollId));
      
      // Delete questions
      const qSnap = await getDocs(query(collection(db, "pollQuestions"), where("pollId", "==", pollId)));
      for (const d of qSnap.docs) {
        await deleteDoc(doc(db, "pollQuestions", d.id));
      }

      // Delete choices
      const cSnap = await getDocs(query(collection(db, "pollChoices"), where("pollId", "==", pollId)));
      for (const d of cSnap.docs) {
        await deleteDoc(doc(db, "pollChoices", d.id));
      }

      // Delete responses
      const rSnap = await getDocs(query(collection(db, "pollResponses"), where("pollId", "==", pollId)));
      for (const d of rSnap.docs) {
        await deleteDoc(doc(db, "pollResponses", d.id));
      }

      if (selectedPoll?.id === pollId) {
        setSelectedPoll(null);
      }
      setSuccessMsg("Sondage supprimé avec succès.");
      try { audioSynth?.playTrash?.(); } catch(_) {}
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(`Erreur lors de la suppression : ${err.message}`);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formQuestionTitle.trim()) {
      setErrorMsg("Veuillez remplir le titre et la question du sondage.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      const pollId = editingPollId || `poll_${Date.now()}`;
      
      const pollPayload: Poll = {
        id: pollId,
        title: formTitle,
        description: formDescription,
        category: formCategory,
        startDate: formStartDate,
        endDate: formEndDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0], // default 1 week
        maxChoices: Number(formMaxChoices),
        questionType: formQuestionType,
        questionTitle: formQuestionTitle,
        audienceType: formAudienceType,
        audienceCity: formAudienceCity,
        audienceCommune: formAudienceCommune,
        status: "active",
        createdAt: new Date().toISOString()
      };

      // 1. Save Poll
      await setDoc(doc(db, "polls", pollId), pollPayload);

      // 2. Save Question
      const qId = `q_${pollId}`;
      const questionPayload: PollQuestion = {
        id: qId,
        pollId,
        title: formQuestionTitle,
        type: formQuestionType
      };
      await setDoc(doc(db, "pollQuestions", qId), questionPayload);

      // 3. Clear old choices and Save new ones if applicable
      if (editingPollId) {
        const oldChoicesSnap = await getDocs(query(collection(db, "pollChoices"), where("pollId", "==", pollId)));
        for (const docD of oldChoicesSnap.docs) {
          await deleteDoc(doc(db, "pollChoices", docD.id));
        }
      }

      if (formQuestionType === "single" || formQuestionType === "multiple" || formQuestionType === "yes_no") {
        const actualChoices = formQuestionType === "yes_no" ? ["Oui", "Non"] : formChoices;
        for (let i = 0; i < actualChoices.length; i++) {
          const choiceText = actualChoices[i];
          if (!choiceText.trim()) continue;
          const choiceId = `choice_${pollId}_${i}`;
          await setDoc(doc(db, "pollChoices", choiceId), {
            id: choiceId,
            pollId,
            questionId: qId,
            text: choiceText,
            order: i
          });
        }
      }

      // Initialize statistics
      await setDoc(doc(db, "pollStatistics", pollId), {
        pollId,
        participantsCount: 0,
        lastUpdatedAt: new Date().toISOString()
      });

      // 4. Send targeted notifications
      await NotificationService.sendNotification({
        userId: "all",
        title: "Nouveau Sondage Officiel 📊",
        message: `Le Fondateur sollicite votre avis ! Répondez au sondage : "${formTitle}"`,
        type: "poll_alert",
        read: false,
        createdAt: new Date().toISOString()
      });

      setSuccessMsg(editingPollId ? "Sondage mis à jour !" : "Nouveau sondage publié avec succès !");
      try { audioSynth?.playValidationSuccess?.(); } catch(_) {}
      
      // Reset form
      setIsCreating(false);
      setEditingPollId(null);
      setFormTitle("");
      setFormDescription("");
      setFormCategory("Application");
      setFormQuestionTitle("");
      setFormChoices(["Choix 1", "Choix 2"]);
      setFormAudienceType("all");
      setFormAudienceCity("Toutes");
      setFormAudienceCommune("Toutes");

      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(`Erreur de publication : ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate live results based on responses
  const totalVotes = responses.length;
  
  // Choice counts
  const choiceVotes: Record<string, number> = {};
  choices.forEach(c => {
    choiceVotes[c.id] = 0;
  });

  // Star ratings count
  const ratingsCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sumRatings = 0;
  let countRatings = 0;

  responses.forEach(r => {
    if (selectedPoll?.questionType === "satisfaction" && r.rating) {
      ratingsCount[r.rating] = (ratingsCount[r.rating] || 0) + 1;
      sumRatings += r.rating;
      countRatings++;
    } else if (selectedPoll?.questionType === "yes_no" && r.answers && r.answers[0]) {
      const ans = r.answers[0]; // "Oui" or "Non"
      choiceVotes[ans] = (choiceVotes[ans] || 0) + 1;
    } else if (r.answers) {
      r.answers.forEach(choiceId => {
        choiceVotes[choiceId] = (choiceVotes[choiceId] || 0) + 1;
      });
    }
  });

  const averageRating = countRatings > 0 ? (sumRatings / countRatings).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      
      {/* Messages */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-500/25 border border-emerald-500/40 rounded-2xl text-emerald-300 font-mono text-xs flex items-center gap-2 shadow-lg"
          >
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-500/25 border border-red-500/40 rounded-2xl text-red-300 font-mono text-xs flex items-center gap-2 shadow-lg"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-afri-bg-sec border border-afri-border p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-afri-gold/20 border border-afri-gold/40 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-afri-gold" />
          </div>
          <div>
            <h2 className="text-lg font-black text-afri-text uppercase tracking-wider font-sans">CENTRE DES SONDAGES</h2>
            <p className="text-xs font-mono text-afri-text-sec">Consultez la communauté et pilotez l'évolution en temps réel</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingPollId(null);
            setIsCreating(!isCreating);
            try { audioSynth?.playTamTam?.(false); } catch(_) {}
          }}
          className="px-4 py-3 bg-afri-gold hover:bg-amber-400 text-[#1C1917] rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-md active:scale-95"
        >
          {isCreating ? (
            "Annuler"
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Créer un sondage</span>
            </>
          )}
        </button>
      </div>

      {isCreating ? (
        /* Create/Edit Form */
        <form onSubmit={handleSubmit} className="bg-afri-bg-sec border border-afri-gold/35 rounded-3xl p-6 space-y-6 shadow-2xl">
          <h3 className="text-sm font-sans font-black text-afri-gold uppercase tracking-wider border-b border-afri-border pb-3">
            {editingPollId ? "📝 MODIFIER LE SONDAGE" : "➕ CRÉER UN NOUVEAU SONDAGE SOUVERAIN"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Col: Basics */}
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Titre du sondage</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Refonte du Gombo ID & Avantages"
                  className="w-full bg-afri-bg-ter border border-afri-border rounded-xl px-4 py-3 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Description / Contexte</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Expliquez brièvement l'importance de ce sondage à la communauté..."
                  rows={4}
                  className="w-full bg-afri-bg-ter border border-afri-border rounded-xl px-4 py-3 text-xs text-afri-text focus:outline-none focus:border-afri-gold resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Catégorie</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Poll["category"])}
                    className="w-full bg-afri-bg-ter border border-afri-border rounded-xl px-3 py-2.5 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
                  >
                    {categories.map(c => (
                      <option key={c} value={c} className="bg-afri-bg text-afri-text">{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Date de fin</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-afri-bg-ter border border-afri-border rounded-xl px-3 py-2 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div className="p-4 bg-afri-bg-ter rounded-2xl border border-afri-border space-y-3">
                <span className="text-[10px] font-mono font-black uppercase text-afri-gold tracking-wider block">🎯 Public cible / Destinataires</span>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-mono uppercase text-afri-text-muted block">Type d'utilisateur</label>
                  <select
                    value={formAudienceType}
                    onChange={(e) => setFormAudienceType(e.target.value as Poll["audienceType"])}
                    className="w-full bg-afri-bg border border-afri-border rounded-lg px-3 py-1.5 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
                  >
                    <option value="all" className="bg-afri-bg text-afri-text">Tous les utilisateurs</option>
                    <option value="premium" className="bg-afri-bg text-afri-text">Premium Elite uniquement</option>
                    <option value="musician" className="bg-afri-bg text-afri-text">Musiciens uniquement</option>
                    <option value="promoter" className="bg-afri-bg text-afri-text">Promoteurs uniquement</option>
                    <option value="admin" className="bg-afri-bg text-afri-text">Administrateurs uniquement</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-afri-text-muted block">Ville</label>
                    <input
                      type="text"
                      value={formAudienceCity}
                      onChange={(e) => setFormAudienceCity(e.target.value)}
                      placeholder="Ex: Abidjan (ou Toutes)"
                      className="w-full bg-afri-bg border border-afri-border rounded-lg px-3 py-1.5 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-afri-text-muted block">Commune</label>
                    <input
                      type="text"
                      value={formAudienceCommune}
                      onChange={(e) => setFormAudienceCommune(e.target.value)}
                      placeholder="Ex: Cocody (ou Toutes)"
                      className="w-full bg-afri-bg border border-afri-border rounded-lg px-3 py-1.5 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Question details & Options */}
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Type de question</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {questionTypes.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setFormQuestionType(t.key as Poll["questionType"]);
                        if (t.key === "yes_no") {
                          setFormChoices(["Oui", "Non"]);
                        }
                      }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer border ${
                        formQuestionType === t.key
                          ? "bg-afri-gold/15 text-afri-gold border-afri-gold"
                          : "bg-afri-bg-ter text-afri-text-sec border-afri-border hover:border-afri-gold/50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-black uppercase text-afri-text-sec">Intitulé de la question</label>
                <input
                  type="text"
                  required
                  value={formQuestionTitle}
                  onChange={(e) => setFormQuestionTitle(e.target.value)}
                  placeholder="Ex: Êtes-vous favorable au nouveau badge de confiance ?"
                  className="w-full bg-afri-bg-ter border border-afri-border rounded-xl px-4 py-3 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
                />
              </div>

              {/* Dynamic choices configuration */}
              {(formQuestionType === "single" || formQuestionType === "multiple") && (
                <div className="p-4 bg-afri-bg-ter rounded-2xl border border-afri-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black uppercase text-afri-gold tracking-wider block">Options de réponses</span>
                    <button
                      type="button"
                      onClick={addFormChoice}
                      className="px-2.5 py-1 bg-afri-bg hover:bg-afri-bg-sec text-afri-gold rounded-lg text-[9px] font-bold uppercase transition border border-afri-border"
                    >
                      + Ajouter option
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {formChoices.map((choice, index) => (
                      <div key={index} className="flex items-center gap-2 animate-fadeIn">
                        <span className="text-[10px] font-mono text-afri-text-muted font-bold w-4">#{index + 1}</span>
                        <input
                          type="text"
                          required
                          value={choice}
                          onChange={(e) => handleChoiceTextChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 bg-afri-bg border border-afri-border rounded-lg px-3 py-1.5 text-xs text-afri-text focus:outline-none focus:border-afri-gold"
                        />
                        {formChoices.length > 2 && (
                           <button
                             type="button"
                             onClick={() => removeFormChoice(index)}
                             className="p-1.5 hover:bg-red-500/10 text-red-400 rounded transition cursor-pointer"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {formQuestionType === "multiple" && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase text-afri-text-muted">Nombre maximum de choix autorisés</label>
                      <input
                        type="number"
                        min={1}
                        max={formChoices.length}
                        value={formMaxChoices}
                        onChange={(e) => setFormMaxChoices(Number(e.target.value))}
                        className="w-16 bg-afri-bg border border-afri-border rounded-lg px-2.5 py-1 text-xs text-afri-text focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="border-t border-afri-border pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingPollId(null);
              }}
              className="px-4 py-2 bg-afri-bg border border-afri-border hover:bg-afri-bg-ter text-afri-text-sec hover:text-afri-text rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-afri-gold hover:bg-amber-400 text-[#1C1917] rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer disabled:opacity-40 flex items-center gap-1 shadow-md active:scale-95"
            >
              {submitting ? "Publication..." : (editingPollId ? "Sauvegarder" : "Publier le sondage 🚀")}
            </button>
          </div>
        </form>
      ) : (
        /* List & Results Split View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Poll List (5 cols) */}
          <div className="lg:col-span-5 bg-afri-bg-sec border border-afri-border rounded-3xl p-4 space-y-4 h-[650px] overflow-y-auto flex flex-col">
            <div className="px-1 shrink-0">
              <h3 className="text-xs font-mono font-black text-afri-text-muted uppercase tracking-widest">
                Sondages créés ({polls.length})
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {polls.length === 0 ? (
                <div className="text-center py-24 text-afri-text-muted text-xs font-mono">Aucun sondage trouvé.</div>
              ) : (
                polls.map(p => {
                  const isSelected = selectedPoll?.id === p.id;
                  const isClosed = p.status === "closed";
                  const isArchived = p.status === "archived";
                  
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPoll(p);
                        try { audioSynth?.playTamTam?.(false); } catch(_) {}
                      }}
                      className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 relative text-left ${
                        isSelected 
                          ? "bg-afri-gold/10 border-afri-gold shadow-lg" 
                          : "bg-afri-bg-ter/60 border-afri-border/80 hover:border-afri-gold/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          isArchived ? "bg-afri-bg text-afri-text-muted" :
                          isClosed ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {isArchived ? "Archivé" : isClosed ? "Clôturé" : "Actif 🟢"}
                        </span>
                        
                        <span className="px-1.5 py-0.5 bg-afri-bg border border-[#D4AF37]/30 text-afri-gold text-[8px] font-mono font-black uppercase rounded flex items-center gap-1">
                          <span>{p.category === "Application" ? "📱" : p.category === "Musique" ? "🎵" : p.category === "Événements" ? "🎪" : p.category === "Wallet" ? "💳" : "💡"}</span>
                          <span>{p.category}</span>
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-afri-text uppercase line-clamp-1">{p.title}</h4>
                        <p className="text-[10px] text-afri-text-sec font-mono line-clamp-2">{p.description}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-afri-border/60 pt-2 text-[8px] font-mono text-afri-text-muted">
                        <span>Finit le : {p.endDate}</span>
                        <span className="text-afri-gold font-bold">Type : {p.questionType.toUpperCase()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Live Statistics & Action Panel (7 cols) */}
          <div className="lg:col-span-7 bg-afri-bg-sec border border-afri-border rounded-3xl p-5 min-h-[650px] shadow-xl flex flex-col justify-between">
            {selectedPoll ? (
              <div className="space-y-6 text-left flex-1">
                
                {/* Selected Poll Meta */}
                <div className="border-b border-afri-border pb-4 space-y-2">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-afri-gold/10 text-afri-gold text-[9px] font-mono font-black uppercase rounded-md border border-afri-gold/20">
                      {selectedPoll.category}
                    </span>
                    <span className="text-[9px] font-mono text-afri-text-muted">
                      Publié le {new Date(selectedPoll.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-afri-text uppercase tracking-wider">{selectedPoll.title}</h3>
                  <p className="text-xs text-afri-text-sec leading-relaxed font-sans">{selectedPoll.description}</p>
                  
                  {/* Target Audience recap */}
                  <div className="bg-afri-bg-ter p-2.5 rounded-xl border border-afri-border/80 text-[10px] font-mono text-afri-text-sec flex items-center justify-between gap-4">
                    <span>🎯 Public : <strong className="text-afri-text uppercase">{selectedPoll.audienceType}</strong></span>
                    <span>📍 Localité : <strong className="text-afri-gold">{selectedPoll.audienceCity || "Toutes"} / {selectedPoll.audienceCommune || "Toutes"}</strong></span>
                  </div>
                </div>

                {/* Question Section */}
                <div className="space-y-4">
                  <div className="bg-afri-bg-ter p-4 rounded-2xl border border-afri-gold/20 relative">
                    <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-afri-bg border border-afri-border rounded text-[8px] font-mono text-afri-gold font-black uppercase">
                      Question du sondage
                    </span>
                    <h4 className="text-xs font-bold text-afri-text uppercase mt-1">
                      {selectedPoll.questionTitle}
                    </h4>
                  </div>

                  {/* Results Visualisation */}
                  <div className="p-4 bg-afri-bg-ter rounded-2xl border border-afri-border space-y-4">
                    <div className="flex items-center justify-between border-b border-afri-border/60 pb-2">
                      <span className="text-[10px] font-mono font-black uppercase text-afri-gold tracking-wider block">📊 Résultats en temps réel</span>
                      <span className="text-[10px] font-mono text-afri-text-muted font-bold">
                        {totalVotes} participants
                      </span>
                    </div>

                    {/* Conditional Rendering of Results based on Type */}
                    {selectedPoll.questionType === "satisfaction" ? (
                      <div className="space-y-3">
                        <div className="text-center py-4 bg-afri-bg-sec/60 rounded-xl border border-afri-border">
                          <span className="text-3xl font-mono font-black text-afri-gold">{averageRating}</span>
                          <span className="text-xs text-afri-text-muted font-mono block">Moyenne / 5.0 Étoiles</span>
                          
                          <div className="flex items-center justify-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${star <= Math.round(Number(averageRating)) ? "fill-afri-gold text-afri-gold" : "text-afri-text-muted/40"}`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map(stars => {
                            const count = ratingsCount[stars] || 0;
                            const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(0) : "0";
                            return (
                              <div key={stars} className="flex items-center gap-2 text-[10px] font-mono">
                                <span className="w-8 flex items-center gap-0.5 text-afri-gold font-bold">{stars} ★</span>
                                <div className="flex-1 h-2 bg-afri-bg border border-afri-border rounded-full overflow-hidden">
                                  <div className="h-full bg-afri-gold" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-8 text-right font-bold text-afri-text">{pct}%</span>
                                <span className="text-afri-text-muted font-mono w-6 text-right">({count})</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : selectedPoll.questionType === "text" ? (
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {responses.filter(r => r.comment && r.comment.trim()).length === 0 ? (
                          <div className="text-center py-8 text-afri-text-muted text-xs font-mono">Aucun commentaire textuel déposé pour l'instant.</div>
                        ) : (
                          responses.filter(r => r.comment && r.comment.trim()).map(r => (
                            <div key={r.id} className="p-3 bg-afri-bg rounded-xl border border-afri-border space-y-1">
                              <div className="flex justify-between items-center text-[8px] font-mono text-afri-gold font-black">
                                <span className="uppercase">{r.userName || "Artiste Gombo"}</span>
                                <span className="text-afri-text-muted">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <p className="text-[11px] text-afri-text-sec font-sans">{r.comment}</p>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      /* Choice results (Single, Multi, Yes/No) */
                      <div className="space-y-3.5">
                        {choices.map((c, idx) => {
                          const count = choiceVotes[c.id] || 0;
                          const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(0) : "0";
                          const optionIcons = ["🌟", "⚡", "💎", "🔥", "🔮", "🌈", "🍀"];
                          const optionIcon = optionIcons[idx % optionIcons.length];
                          
                          return (
                            <div key={c.id} className="space-y-1 bg-afri-bg-sec p-2.5 rounded-xl border border-zinc-800/40 hover:border-zinc-700/60 transition-all duration-[120ms]">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-afri-text font-bold flex items-center gap-1.5">
                                  <span>{optionIcon}</span>
                                  <span>{c.text}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-afri-gold font-black">{pct}%</span>
                                  <span className="text-afri-text-muted text-[9px]">({count} votes)</span>
                                  
                                  {selectedPoll.status === "active" && (
                                    <button
                                      onClick={async () => {
                                        if (!selectedPoll?.id) return;
                                        try {
                                          const mockResponseId = `admin_vote_${Date.now()}`;
                                          await setDoc(doc(db, "pollResponses", mockResponseId), {
                                            id: mockResponseId,
                                            pollId: selectedPoll.id,
                                            userUid: "admin_tester",
                                            userName: "Souverain (Simulation)",
                                            answers: [c.id],
                                            createdAt: new Date().toISOString()
                                          });
                                          setSuccessMsg("🗳️ Vote de simulation enregistré en direct !");
                                          try { audioSynth?.playValidationSuccess?.(); } catch(_) {}
                                          setTimeout(() => setSuccessMsg(""), 3000);
                                        } catch (err: any) {
                                          setErrorMsg(`Erreur vote : ${err.message}`);
                                        }
                                      }}
                                      className="ml-1.5 px-2 py-0.5 bg-afri-gold hover:bg-amber-400 text-black rounded text-[8px] font-bold transition active:scale-90"
                                      title="Simuler un vote sur cette option"
                                    >
                                      Vote Test
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="w-full h-2.5 bg-afri-bg border border-afri-border rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-afri-gold to-amber-500 rounded-full transition-all duration-[140ms] ease-out shadow-[0_0_8px_rgba(212,175,55,0.4)]" 
                                  style={{ width: `${pct}%` }} 
                                />
                              </div>
                            </div>
                          );
                        })}

                        {selectedPoll.questionType === "yes_no" && choices.length === 0 && (
                          /* Fallback Yes/No calculations if pollChoices didn't sync yet */
                          ["Oui", "Non"].map((ans, idx) => {
                            const count = choiceVotes[ans] || 0;
                            const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(0) : "0";
                            const optionIcon = ans === "Oui" ? "👍" : "👎";
                            
                            return (
                              <div key={ans} className="space-y-1 bg-afri-bg-sec p-2.5 rounded-xl border border-zinc-800/40 hover:border-zinc-700/60 transition-all duration-[120ms]">
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                  <span className="text-afri-text font-bold flex items-center gap-1.5">
                                    <span>{optionIcon}</span>
                                    <span>{ans}</span>
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-afri-gold font-black">{pct}%</span>
                                    <span className="text-afri-text-muted text-[9px]">({count} votes)</span>
                                    
                                    {selectedPoll.status === "active" && (
                                      <button
                                        onClick={async () => {
                                          if (!selectedPoll?.id) return;
                                          try {
                                            const mockResponseId = `admin_vote_${Date.now()}`;
                                            await setDoc(doc(db, "pollResponses", mockResponseId), {
                                              id: mockResponseId,
                                              pollId: selectedPoll.id,
                                              userUid: "admin_tester",
                                              userName: "Souverain (Simulation)",
                                              answers: [ans],
                                              createdAt: new Date().toISOString()
                                            });
                                            setSuccessMsg("🗳️ Vote de simulation enregistré en direct !");
                                            try { audioSynth?.playValidationSuccess?.(); } catch(_) {}
                                            setTimeout(() => setSuccessMsg(""), 3000);
                                          } catch (err: any) {
                                            setErrorMsg(`Erreur vote : ${err.message}`);
                                          }
                                        }}
                                        className="ml-1.5 px-2 py-0.5 bg-afri-gold hover:bg-amber-400 text-black rounded text-[8px] font-bold transition active:scale-90"
                                        title="Simuler un vote sur cette option"
                                      >
                                        Vote Test
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="w-full h-2.5 bg-afri-bg border border-afri-border rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-afri-gold to-amber-500 rounded-full transition-all duration-[140ms] ease-out shadow-[0_0_8px_rgba(212,175,55,0.4)]" 
                                    style={{ width: `${pct}%` }} 
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations Actions Footer */}
                <div className="border-t border-afri-border pt-5 space-y-3 shrink-0">
                  <span className="text-[9px] font-mono font-black text-afri-text-muted uppercase tracking-widest block">ADMINISTRATION ACTIONS</span>
                  
                  <div className="flex flex-wrap gap-2">
                    
                    {/* Status Triggers */}
                    {selectedPoll.status === "active" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedPoll.id, "closed")}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Clôturer</span>
                      </button>
                    )}

                    {selectedPoll.status === "closed" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedPoll.id, "active")}
                        className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Réactiver</span>
                      </button>
                    )}

                    {selectedPoll.status !== "archived" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedPoll.id, "archived")}
                        className="px-3 py-2 bg-afri-bg border border-afri-border hover:bg-afri-bg-ter text-afri-text-sec rounded-xl text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archiver</span>
                      </button>
                    )}

                    {/* Edit Trigger */}
                    {selectedPoll.status !== "archived" && (
                      <button
                        onClick={() => handleStartEdit(selectedPoll)}
                        className="px-3 py-2 bg-afri-bg border border-afri-border hover:bg-afri-bg-ter text-amber-400 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>
                    )}

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicate(selectedPoll)}
                      className="px-3 py-2 bg-afri-gold/10 hover:bg-afri-gold/20 text-afri-gold border border-afri-gold/20 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Dupliquer</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(selectedPoll.id)}
                      className="px-3 py-2 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-xl text-[10px] font-bold uppercase transition cursor-pointer ml-auto flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>

                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-afri-text-muted text-xs font-mono py-24 space-y-2">
                <BarChart3 className="w-8 h-8 text-afri-gold/40" />
                <p>Sélectionnez un sondage pour examiner les votes de l'Empire</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
