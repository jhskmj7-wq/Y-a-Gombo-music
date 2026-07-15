import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, Send, X, HelpCircle, Sparkles, Terminal, Cpu, CheckCircle, ArrowRight
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "griot";
  text: string;
  timestamp: Date;
}

const KNOWLEDGE_BASE = [
  {
    keywords: ["gombo id", "code id", "obtenir id", "identifiant"],
    question: "Comment obtenir le GOMBO ID ?",
    answer: "Le GOMBO ID s'obtient automatiquement lors de la complétion de votre profil à 100% dans l'onglet 'Profil' de l'application, assorti d'une validation d'excellence administrative par notre Conseil."
  },
  {
    keywords: ["publier un gombo", "publier gombo", "creer un gombo", "nouveau gombo"],
    question: "Comment publier un Gombo ?",
    answer: "Rendez-vous sur l'écran principal ou dans votre espace de gestion, puis cliquez sur 'Publier un Gombo'. Remplissez soigneusement le formulaire en spécifiant les détails de la prestation, la date et le budget prévu."
  },
  {
    keywords: ["modifier mon profil", "modifier profil", "changer bio", "photo profil", "mettre a jour profil"],
    question: "Comment modifier mon profil ?",
    answer: "Naviguez vers l'onglet 'Profil' dans le menu de l'application, puis cliquez sur 'Modifier le Profil'. Vous pourrez modifier vos spécialités scéniques, votre biographie impériale, votre commune et vos numéros de paiement sécurisés."
  },
  {
    keywords: ["creer un groupe", "creer groupe", "orchestre", "enregistrer groupe", "groupe vip"],
    question: "Comment créer un groupe ?",
    answer: "Dans le menu principal de l'application, accédez à la section 'Écosystème' ou l'onglet 'Groupes' du tableau, puis utilisez le formulaire d'inscription pour enregistrer votre groupe de musique ou orchestre national."
  },
  {
    keywords: ["contacter le support", "support", "contacter assistance", "aide", "contact", "probleme technique"],
    question: "Comment contacter le support ?",
    answer: "L'assistance d'élite d'AFRIGOMBO est à votre disposition permanente. Vous pouvez joindre le Support AFRIGOMBO directement par WhatsApp officiel au +225 0503222712."
  },
  {
    keywords: ["certification", "certifie", "obtenir certification", "badge bleu", "artiste certifie"],
    question: "Comment fonctionne la certification ?",
    answer: "La certification atteste officiellement de votre excellence artistique sur la scène africaine. Déposez une demande d'accréditation avec un lien de performance vidéo dans le Centre de Certification pour audit."
  },
  {
    keywords: ["mes gombos", "mes contrats", "suivre contrat", "historique contrats"],
    question: "Comment fonctionne Mes Gombos ?",
    answer: "L'onglet 'Mes Gombos' centralise tous vos contrats créés en tant que Client/Organisateur ou postulés en tant qu'Artiste, assurant un suivi d'état synchrone et sécurisé en temps réel."
  },
  {
    keywords: ["signaler un probleme", "signaler", "abus", "fraude", "signaler profil"],
    question: "Comment signaler un problème ?",
    answer: "Utilisez le bouton 'Signaler' disponible sur la fiche de chaque gombo ou de chaque profil suspect. Un rapport de menace est envoyé instantanément aux Moniteurs de Sécurité."
  },
  {
    keywords: ["utiliser l'application", "comment ca marche", "tutoriel", "guide", "fonctionnement"],
    question: "Comment utiliser l'application ?",
    answer: "AFRIGOMBO ELITE met en relation sécurisée les talents et recruteurs d'Abidjan : postulez à des Gombos, gérez vos paiements et échangez via notre chat crypté."
  }
];

export default function GriotIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "griot",
      text: "Akwaba au Temple d'AFRIGOMBO ELITE. Je suis le GRIOT IA, votre gardien de la connaissance impériale d'Abidjan. Quelle sagesse recherchez-vous aujourd'hui ?",
      timestamp: new Date()
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "v2">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    // 1. Add user message
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery("");

    // Simulate Griot contemplation latency
    setTimeout(() => {
      const normalized = queryText.toLowerCase().trim();
      let bestResponse = "";

      // Precise or keyword search
      for (const item of KNOWLEDGE_BASE) {
        // Direct question click matching
        if (normalized === item.question.toLowerCase().trim()) {
          bestResponse = item.answer;
          break;
        }
        // Keyword checking
        const matched = item.keywords.some(keyword => normalized.includes(keyword));
        if (matched) {
          bestResponse = item.answer;
          break;
        }
      }

      if (!bestResponse) {
        bestResponse = "Je suis encore en apprentissage. Un Griot du Temple vous répondra bientôt.";
      }

      const griotMsg: Message = {
        id: `griot_${Date.now()}`,
        sender: "griot",
        text: bestResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, griotMsg]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="griot-ia-container">
      {/* 1. FLOATING ACTION BUTTON */}
      <motion.button
        id="griot-floating-trigger"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-3.5 bg-black hover:bg-zinc-950 text-[#D4AF37] hover:text-[#FFD700] rounded-full border border-[#D4AF37]/50 shadow-[0_4px_25px_rgba(212,175,55,0.25)] transition-all font-mono font-bold text-xs uppercase tracking-wider"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
        </span>
        🧠 GRIOT IA
      </motion.button>

      {/* 2. MAIN CONVERSATION SHELL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="griot-chat-window"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="absolute bottom-16 right-0 w-[92vw] sm:w-[420px] h-[580px] bg-[#0A0A0A] border border-[#D4AF37]/40 rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col"
          >
            {/* Elegant Header */}
            <div className="p-4 bg-gradient-to-r from-[#030303] via-zinc-950 to-zinc-900 border-b border-[#D4AF37]/25 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/25">
                  <Cpu className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-mono text-xs font-black uppercase tracking-widest text-[#D4AF37]">
                    GRIOT IA V1
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Temple de la Connaissance Impériale
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Access Mode Tabs */}
            <div className="flex bg-[#030303] border-b border-zinc-900/40 text-xs text-zinc-500 font-mono">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-2.5 text-center transition-colors border-b ${
                  activeTab === "chat" 
                    ? "text-[#D4AF37] border-[#D4AF37] font-bold" 
                    : "border-transparent hover:text-zinc-300"
                }`}
              >
                💬 Conseil du Griot
              </button>
              <button
                onClick={() => setActiveTab("v2")}
                className={`flex-1 py-2.5 text-center transition-colors border-b flex items-center justify-center gap-1.5 ${
                  activeTab === "v2" 
                    ? "text-[#D4AF37] border-[#D4AF37] font-bold" 
                    : "border-transparent hover:text-zinc-300"
                }`}
              >
                ⚙️ Architecture V2
              </button>
            </div>

            {/* View Switching */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === "chat" ? (
                <>
                  {/* Chat Messages Log */}
                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800"
                  >
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[9px] text-zinc-650 font-mono mb-1 px-1">
                          {msg.sender === "griot" ? "🦁 GRIOT TEMPLE" : "👤 MOI"}
                        </span>
                        <div
                          className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === "user"
                              ? "bg-gradient-to-r from-[#D4AF37] to-[#B48F17] text-black font-semibold rounded-tr-none shadow-md"
                              : "bg-[#111111] border border-zinc-900 text-zinc-200 rounded-tl-none shadow-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Knowledge Base Core Suggestion Prompts */}
                  <div className="px-4 py-2 bg-[#050505] border-t border-zinc-900/60 overflow-x-auto whitespace-nowrap flex gap-2 scrollbar-none shrink-0">
                    {KNOWLEDGE_BASE.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuery(item.question)}
                        className="inline-block px-3 py-1.5 bg-[#111111] hover:bg-[#1A1A1A] border border-[#D4AF37]/15 hover:border-[#D4AF37]/35 rounded-full text-[10px] text-zinc-400 hover:text-white transition-all font-mono"
                      >
                        ❓ {item.question}
                      </button>
                    ))}
                  </div>

                  {/* Chat Text Input Field */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleQuery(inputQuery);
                    }}
                    className="p-3 bg-[#030303] border-t border-zinc-950 flex gap-2"
                  >
                    <input
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      placeholder="Demander la sagesse du Griot..."
                      className="flex-1 bg-[#111111] border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 font-sans focus:outline-none focus:border-[#D4AF37] transition-all"
                    />
                    <button
                      type="submit"
                      className="p-2.5 bg-[#D4AF37] text-black hover:bg-[#FFD700] rounded-xl font-bold transition-all shrink-0 flex items-center justify-center shadow-lg"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                /* Architecture V2 specifications (Enterprise grade blueprint) */
                <div className="flex-1 overflow-y-auto p-5 text-zinc-300 font-mono text-[11px] leading-relaxed space-y-6 scrollbar-thin">
                  <div className="p-4 bg-[#111111] border border-[#D4AF37]/15 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                      <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                      <span className="text-[#D4AF37] font-black uppercase text-xs">
                        PLAN DE VOL GRIOT V2
                      </span>
                    </div>
                    <p className="font-sans text-zinc-400">
                      Spécifications de la V2 entièrement modélisée et prête à être raccordée aux services Cloud d'Afrisystems.
                    </p>
                  </div>

                  {/* Architecture Diagram */}
                  <div className="space-y-4">
                    <strong className="text-white text-xs block uppercase border-b border-zinc-900 pb-1">
                      🛠️ Éco-Système des Composants
                    </strong>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-black border border-zinc-900 rounded-xl">
                        <span className="text-[#D4AF37] font-bold">1. Firebase Trigger Cloud Function</span>
                        <p className="text-[10px] text-zinc-500 mt-1 font-sans">
                          Un microservice Node.js déporté sur Google Cloud Run réagit aux modifications de documents.
                        </p>
                      </div>

                      <div className="p-3 bg-black border border-zinc-900 rounded-xl">
                        <span className="text-[#D4AF37] font-bold">2. OpenAI Assistant Engine</span>
                        <p className="text-[10px] text-zinc-500 mt-1 font-sans">
                          Raccordé à l'API OpenAI Assistants spécifiée avec instanciation du modèle gpt-4o ou gemini-2.5-pro, ancré dans le corpus doctrinal d'AFRIGOMBO.
                        </p>
                      </div>

                      <div className="p-3 bg-black border border-zinc-900 rounded-xl">
                        <span className="text-[#D4AF37] font-bold">3. Stockage Documentaire</span>
                        <p className="text-[10px] text-zinc-500 mt-1 font-sans">
                          Indexation immédiate des dialogues de sagesse dans la collection Firebase Firestore <code className="text-white bg-zinc-900 px-1 rounded">/griot_session</code>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview Code snippet */}
                  <div className="space-y-2">
                    <strong className="text-white text-xs block uppercase">
                      📂 Modèle de Cloud Function (Stubs)
                    </strong>
                    <div className="p-3.5 bg-[#030303] text-zinc-400 rounded-xl border border-zinc-900 overflow-x-auto text-[9.5px]">
                      <span className="text-amber-500">// Cloud Function V2 Trigger template</span><br />
                      <span className="text-teal-400">export const</span> <span className="text-blue-400">griotChatV2</span> = functions.https.onCall(<span className="text-purple-400">async</span> (data, context) =&gt; &#123;<br />
                      &nbsp;&nbsp;<span className="text-zinc-600">// Securing auth context</span><br />
                      &nbsp;&nbsp;<span className="text-teal-400">if</span> (!context.auth) <span className="text-teal-400">throw</span> <span className="text-teal-400">new</span> Error(<span className="text-amber-600">"Non authentifié."</span>);<br />
                      &nbsp;&nbsp;<br />
                      &nbsp;&nbsp;<span className="text-teal-450">const</span> openai = <span className="text-teal-400">new</span> OpenAI(&#123; apiKey: process.env.OPENAI_API_KEY &#125;);<br />
                      &nbsp;&nbsp;<br />
                      &nbsp;&nbsp;<span className="text-teal-450">const</span> response = <span className="text-teal-450">await</span> openai.chat.completions.create(&#123;<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;model: <span className="text-amber-600">"gpt-4o"</span>,<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;messages: [&#123; role: <span className="text-amber-600">"user"</span>, content: data.prompt &#125;]<br />
                      &nbsp;&nbsp;&#125;);<br />
                      &nbsp;&nbsp;<span className="text-teal-400">return</span> &#123; text: response.choices[0].message.content &#125;;<br />
                      &#125;);
                    </div>
                  </div>

                  <div className="p-3 bg-teal-950/20 border border-teal-900/40 rounded-xl text-teal-400 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-[10px] font-sans">
                      Architecture documentée et balisée pour l'évolution vers l'intelligence générative complète.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
