import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart3, X, Check, Star, Send, Vote, AlertCircle, Info, Sparkles, CheckCircle
} from "lucide-react";
import { collection, onSnapshot, query, where, doc, setDoc, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

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
  answers: string[];
  rating?: number;
  comment?: string;
  createdAt: string;
}

interface UserPollsWidgetProps {
  currentUser: any;
  profile: any;
  audioSynth?: any;
}

export default function UserPollsWidget({ currentUser, profile, audioSynth }: UserPollsWidgetProps) {
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [choices, setChoices] = useState<PollChoice[]>([]);
  const [userResponses, setUserResponses] = useState<Record<string, PollResponse>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [ratingVal, setRatingVal] = useState<number>(0);
  const [textComment, setTextComment] = useState<string>("");
  const [pollStats, setPollStats] = useState<any[]>([]); // current poll answers stats
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Fetch active polls
  useEffect(() => {
    const q = query(collection(db, "polls"), where("status", "==", "active"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allActive = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Poll[];
      
      // Filter based on user profile and targets
      const filtered = allActive.filter(p => {
        // Audience type check
        if (p.audienceType === "premium" && !profile?.isPremium) return false;
        if (p.audienceType === "musician" && profile?.kycStatus !== "validated") return false;
        if (p.audienceType === "promoter" && profile?.role !== "promoter") return false;
        if (p.audienceType === "admin" && profile?.role !== "admin") return false;

        // City filter
        if (p.audienceCity && p.audienceCity !== "Toutes") {
          const userCity = profile?.city || profile?.location || "";
          if (!userCity.toLowerCase().includes(p.audienceCity.toLowerCase())) return false;
        }

        // Commune filter
        if (p.audienceCommune && p.audienceCommune !== "Toutes") {
          const userCommune = profile?.commune || "";
          if (!userCommune.toLowerCase().includes(p.audienceCommune.toLowerCase())) return false;
        }

        return true;
      });

      setActivePolls(filtered);
    });

    return () => unsubscribe();
  }, [profile]);

  // 2. Fetch current user's responses for active polls to check participation
  useEffect(() => {
    if (!currentUser?.uid || activePolls.length === 0) return;

    const q = query(collection(db, "pollResponses"), where("userUid", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const respMap: Record<string, PollResponse> = {};
      snapshot.forEach(docSnap => {
        const resp = docSnap.data() as PollResponse;
        respMap[resp.pollId] = resp;
      });
      setUserResponses(respMap);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, activePolls]);

  // 3. Fetch choices and all responses to build statistics when a poll is selected
  useEffect(() => {
    if (!selectedPoll?.id) {
      setChoices([]);
      setPollStats([]);
      return;
    }

    // Fetch choices
    const choicesQ = query(collection(db, "pollChoices"), where("pollId", "==", selectedPoll.id));
    const unsubscribeChoices = onSnapshot(choicesQ, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PollChoice[];
      setChoices(list.sort((a, b) => a.order - b.order));
    });

    // Fetch all responses to compute real-time visual statistics
    const responsesQ = query(collection(db, "pollResponses"), where("pollId", "==", selectedPoll.id));
    const unsubscribeResponses = onSnapshot(responsesQ, (snap) => {
      const list = snap.docs.map(doc => doc.data() as PollResponse);
      setPollStats(list);
    });

    return () => {
      unsubscribeChoices();
      unsubscribeResponses();
    };
  }, [selectedPoll?.id]);

  // Handle open modal
  const handleOpenPoll = (poll: Poll) => {
    setSelectedPoll(poll);
    setSelectedAnswers([]);
    setRatingVal(0);
    setTextComment("");
    setErrorMsg("");
    setIsModalOpen(true);
    try { audioSynth?.playTamTam?.(false); } catch(_) {}
  };

  // Multiple choices toggle helper
  const handleToggleMultipleChoice = (choiceId: string) => {
    if (selectedAnswers.includes(choiceId)) {
      setSelectedAnswers(selectedAnswers.filter(id => id !== choiceId));
    } else {
      if (selectedAnswers.length >= (selectedPoll?.maxChoices || 1)) {
        // Replace first element to stay under limits or do nothing
        setSelectedAnswers([...selectedAnswers.slice(1), choiceId]);
      } else {
        setSelectedAnswers([...selectedAnswers, choiceId]);
      }
    }
  };

  // Submit Answer
  const handleSendResponse = async () => {
    if (!selectedPoll || !currentUser) return;
    
    // Validations
    if (selectedPoll.questionType === "single" && selectedAnswers.length === 0) {
      setErrorMsg("Veuillez choisir une option.");
      return;
    }
    if (selectedPoll.questionType === "multiple" && selectedAnswers.length === 0) {
      setErrorMsg("Veuillez cocher au moins une option.");
      return;
    }
    if (selectedPoll.questionType === "yes_no" && selectedAnswers.length === 0) {
      setErrorMsg("Veuillez choisir Oui ou Non.");
      return;
    }
    if (selectedPoll.questionType === "satisfaction" && ratingVal === 0) {
      setErrorMsg("Veuillez attribuer une note.");
      return;
    }
    if (selectedPoll.questionType === "text" && !textComment.trim()) {
      setErrorMsg("Veuillez saisir votre commentaire avant d'envoyer.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const responseId = `resp_${selectedPoll.id}_${currentUser.uid}`;
      const payload: PollResponse = {
        id: responseId,
        pollId: selectedPoll.id,
        userUid: currentUser.uid,
        userName: profile?.artisticName || profile?.name || "Membre Gombo",
        answers: selectedAnswers,
        rating: ratingVal > 0 ? ratingVal : undefined,
        comment: textComment.trim() ? textComment : undefined,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "pollResponses", responseId), payload);

      // Play drum sound or validation sound
      try { audioSynth?.playValidationSuccess?.(); } catch(_) {}
    } catch (err: any) {
      setErrorMsg("Erreur lors de l'enregistrement de votre vote.");
    } finally {
      setSubmitting(false);
    }
  };

  if (activePolls.length === 0) return null;

  // Let's identify if there's any active poll the user hasn't voted on yet
  const unvotedPolls = activePolls.filter(p => !userResponses[p.id]);
  const displayPoll = unvotedPolls.length > 0 ? unvotedPolls[0] : activePolls[0];
  const hasVotedCurrent = Boolean(userResponses[displayPoll.id]);

  // Compute stats details for the display poll when selected / displayed
  const statsList = pollStats;
  const totalVotes = statsList.length;

  const choiceVotes: Record<string, number> = {};
  choices.forEach(c => { choiceVotes[c.id] = 0; });
  
  const ratingsCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sumRatings = 0;
  let countRatings = 0;

  statsList.forEach(r => {
    if (displayPoll.questionType === "satisfaction" && r.rating) {
      ratingsCount[r.rating] = (ratingsCount[r.rating] || 0) + 1;
      sumRatings += r.rating;
      countRatings++;
    } else if (displayPoll.questionType === "yes_no" && r.answers && r.answers[0]) {
      const ans = r.answers[0];
      choiceVotes[ans] = (choiceVotes[ans] || 0) + 1;
    } else if (r.answers) {
      r.answers.forEach(cid => {
        choiceVotes[cid] = (choiceVotes[cid] || 0) + 1;
      });
    }
  });

  const averageRating = countRatings > 0 ? (sumRatings / countRatings).toFixed(1) : "0.0";

  return (
    <>
      {/* 1. DISCREET HOME FEED BANNER CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => handleOpenPoll(displayPoll)}
        className="afri-card border border-[#D4AF37]/50 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-4 rounded-3xl flex items-center justify-between gap-4 cursor-pointer hover:border-[#D4AF37] hover:scale-[1.01] transition-all duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.06)] group relative overflow-hidden text-left"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/2 rounded-full blur-xl pointer-events-none group-hover:bg-[#D4AF37]/5 transition-all duration-300" />
        
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[8px] font-mono font-black uppercase tracking-widest text-[#D4AF37] px-1.5 py-0.5 bg-[#D4AF37]/10 rounded border border-[#D4AF37]/20">
                📊 SONDAGE OFFICIEL
              </span>
              {hasVotedCurrent && (
                <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 rounded-full border border-emerald-500/20">
                  Voté ✓
                </span>
              )}
            </div>
            <h4 className="text-xs font-black text-white uppercase truncate font-sans">
              {displayPoll.title}
            </h4>
            <p className="text-[10px] text-zinc-400 line-clamp-1">
              {hasVotedCurrent ? "Consulter l'avis de l'Empire en temps réel" : "Le Fondateur sollicite votre avis impérial."}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-black text-[#D4AF37] uppercase tracking-wider shrink-0 bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800 hover:bg-[#D4AF37] hover:text-black transition-all">
          {hasVotedCurrent ? "Résultats →" : "Voter →"}
        </span>
      </motion.div>

      {/* 2. RICH INTERACTIVE MODAL DIALOG */}
      <AnimatePresence>
        {isModalOpen && selectedPoll && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-zinc-950 border border-[#D4AF37]/40 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col my-8"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Body */}
              <div className="p-6 space-y-6 text-left">
                
                {/* Header */}
                <div className="space-y-2 pr-8 border-b border-zinc-800 pb-4">
                  <span className="px-2.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[8px] font-mono font-black uppercase rounded border border-[#D4AF37]/20">
                    Sondage Officiel : {selectedPoll.category}
                  </span>
                  <h3 className="text-sm font-black text-white uppercase font-sans tracking-wide">
                    {selectedPoll.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    {selectedPoll.description}
                  </p>
                </div>

                {/* Main Dynamic View: Voted vs Not Voted */}
                {userResponses[selectedPoll.id] ? (
                  /* ALREADY VOTED VIEW: SHOW DETAILED LIVE RESULTS */
                  <div className="space-y-5">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="text-left">
                        <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest block">PARTICIPATION ENREGISTRÉE</span>
                        <p className="text-[11px] text-zinc-300 font-sans mt-0.5">Merci pour votre participation impériale ! Votre voix compte.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-b border-zinc-900 pb-1.5">
                        <span className="uppercase">RÉSULTATS DE LA COMMUNAUTÉ</span>
                        <span className="font-bold">{totalVotes} réponses</span>
                      </div>

                      {/* Display calculations */}
                      {selectedPoll.questionType === "satisfaction" ? (
                        <div className="space-y-3">
                          <div className="text-center py-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                            <span className="text-3xl font-mono font-black text-[#D4AF37]">{averageRating}</span>
                            <span className="text-[10px] text-zinc-400 font-mono block">Moyenne de satisfaction</span>
                            
                            <div className="flex items-center justify-center gap-1 mt-1.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`w-5 h-5 ${star <= Math.round(Number(averageRating)) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-zinc-800"}`}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map(stars => {
                              const count = ratingsCount[stars] || 0;
                              const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(0) : "0";
                              return (
                                <div key={stars} className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                                  <span className="w-8 text-[#D4AF37] font-bold">{stars} ★</span>
                                  <div className="flex-1 h-1.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#D4AF37]" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="w-8 text-right font-bold text-white">{pct}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : selectedPoll.questionType === "text" ? (
                        <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                          {statsList.filter(r => r.comment && r.comment.trim()).length === 0 ? (
                            <div className="text-center py-8 text-zinc-600 text-xs font-mono">Aucun commentaire déposé pour l'instant.</div>
                          ) : (
                            statsList.filter(r => r.comment && r.comment.trim()).map((r, idx) => (
                              <div key={idx} className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-1">
                                <span className="text-[8px] font-mono text-[#D4AF37] block font-black uppercase">{r.userName || "Artiste Gombo"}</span>
                                <p className="text-[10px] text-zinc-300 leading-normal">{r.comment}</p>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        /* Choices results */
                        <div className="space-y-3">
                          {choices.map(c => {
                            const count = choiceVotes[c.id] || 0;
                            const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(0) : "0";
                            return (
                              <div key={c.id} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                                  <span>{c.text}</span>
                                  <span className="text-[#D4AF37] font-black">{pct}% <span className="text-[8px] text-zinc-500">({count})</span></span>
                                </div>
                                <div className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-500" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}

                          {selectedPoll.questionType === "yes_no" && choices.length === 0 && (
                            ["Oui", "Non"].map(ans => {
                              const count = choiceVotes[ans] || 0;
                              const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(0) : "0";
                              return (
                                <div key={ans} className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-mono text-zinc-300">
                                    <span>{ans}</span>
                                    <span className="text-[#D4AF37] font-black">{pct}% <span className="text-[8px] text-zinc-500">({count})</span></span>
                                  </div>
                                  <div className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-500" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                    >
                      Fermer la fenêtre
                    </button>
                  </div>
                ) : (
                  /* ACTIVE VOTING FORM FOR ELIGIBLE USERS */
                  <div className="space-y-5 text-left">
                    
                    {/* Question Header */}
                    <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                      <span className="text-[9px] font-mono font-black text-[#D4AF37] uppercase tracking-wider block mb-1">LA QUESTION :</span>
                      <h4 className="text-xs font-bold text-white uppercase font-sans">
                        {selectedPoll.questionTitle}
                      </h4>
                    </div>

                    {/* Input Controls Based on QuestionType */}
                    <div className="space-y-3">
                      {selectedPoll.questionType === "yes_no" && (
                        <div className="grid grid-cols-2 gap-4">
                          {["Oui", "Non"].map(ans => {
                            const isChosen = selectedAnswers[0] === ans;
                            return (
                              <button
                                key={ans}
                                type="button"
                                onClick={() => setSelectedAnswers([ans])}
                                className={`py-4 rounded-2xl border text-sm font-black uppercase tracking-wider transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
                                  isChosen 
                                    ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37] shadow-lg" 
                                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                                }`}
                              >
                                <span className="text-2xl">{ans === "Oui" ? "🤝" : "🙅‍♂️"}</span>
                                <span>{ans}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {selectedPoll.questionType === "satisfaction" && (
                        <div className="space-y-2 text-center py-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                          <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest block">Notez votre satisfaction :</span>
                          <div className="flex items-center justify-center gap-3 mt-3">
                            {[1, 2, 3, 4, 5].map(star => {
                              const active = ratingVal >= star;
                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingVal(star)}
                                  className="transition hover:scale-125 focus:outline-none cursor-pointer"
                                >
                                  <Star
                                    className={`w-8 h-8 ${active ? "fill-[#D4AF37] text-[#D4AF37]" : "text-zinc-700 hover:text-amber-500"}`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                          {ratingVal > 0 && (
                            <span className="text-[10px] font-mono text-[#D4AF37] font-bold mt-2 block">
                              {ratingVal === 5 ? "Excellent ! ✨" : ratingVal === 4 ? "Très bon" : ratingVal === 3 ? "Moyen" : ratingVal === 2 ? "Insatisfaisant" : "Médiocre"}
                            </span>
                          )}
                        </div>
                      )}

                      {selectedPoll.questionType === "text" && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono font-bold text-zinc-500 block uppercase">Votre message souverain :</label>
                          <textarea
                            rows={4}
                            required
                            value={textComment}
                            onChange={(e) => setTextComment(e.target.value)}
                            placeholder="Saisissez vos idées, remarques ou propositions constructives..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                          />
                        </div>
                      )}

                      {selectedPoll.questionType === "single" && (
                        <div className="space-y-2">
                          {choices.map(c => {
                            const isChosen = selectedAnswers.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setSelectedAnswers([c.id])}
                                className={`w-full p-3.5 rounded-xl border text-xs font-bold text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                                  isChosen 
                                    ? "bg-[#D4AF37]/10 text-white border-[#D4AF37]" 
                                    : "bg-zinc-900 text-zinc-400 border-zinc-800/80 hover:border-zinc-700"
                                }`}
                              >
                                <span>{c.text}</span>
                                <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 ${isChosen ? "border-[#D4AF37] bg-[#D4AF37]" : "border-zinc-700"}`}>
                                  {isChosen && <Check className="w-3 h-3 text-black stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {selectedPoll.questionType === "multiple" && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 mb-1">
                            <span>SÉLECTIONNEZ VOS CHOIX</span>
                            <span className="font-bold text-[#D4AF37]">
                              {selectedAnswers.length} / {selectedPoll.maxChoices} choix max
                            </span>
                          </div>
                          
                          {choices.map(c => {
                            const isChosen = selectedAnswers.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleToggleMultipleChoice(c.id)}
                                className={`w-full p-3.5 rounded-xl border text-xs font-bold text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                                  isChosen 
                                    ? "bg-[#D4AF37]/10 text-white border-[#D4AF37]" 
                                    : "bg-zinc-900 text-zinc-400 border-zinc-800/80 hover:border-zinc-700"
                                }`}
                              >
                                <span>{c.text}</span>
                                <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 ${isChosen ? "border-[#D4AF37] bg-[#D4AF37]" : "border-zinc-700"}`}>
                                  {isChosen && <Check className="w-3 h-3 text-black stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {errorMsg && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono rounded-lg flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* Submit Action */}
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSendResponse}
                        className="w-full py-3.5 bg-[#D4AF37] hover:bg-amber-400 text-black rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg active:scale-95"
                      >
                        <Vote className="w-4 h-4 stroke-[2.5]" />
                        <span>{submitting ? "Enregistrement..." : "Soumettre mon vote impérial 🚀"}</span>
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
