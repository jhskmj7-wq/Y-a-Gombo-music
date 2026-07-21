import React from "react";
import { motion } from "motion/react";
import { ShieldCheck, FileCheck, Landmark, CheckCircle2, ShieldAlert, ArrowRight, Zap, Trophy, Heart } from "lucide-react";

const features = [
  {
    title: "Gombo Sécurisé",
    description: "Le système de séquestre (escrow) bloque l'argent au moment de la signature. L'artiste est sûr d'être payé, le client est sûr que la prestation sera faite.",
    icon: Landmark,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    title: "Contrats Intelligents",
    description: "Chaque Gombo génère un contrat numérique certifié avec signature électronique. Plus de malentendus sur les termes de la prestation.",
    icon: FileCheck,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "Validation Mutuelle",
    description: "Le paiement n'est libéré que lorsque les deux parties valident la fin de la mission. Une sécurité totale pour tout l'écosystème.",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    title: "Arbitrage & Protection",
    description: "En cas de litige, AFRIGOMBO intervient pour trancher de manière impartiale en se basant sur le contrat et les preuves fournies.",
    icon: ShieldAlert,
    color: "text-red-500",
    bg: "bg-red-500/10"
  }
];

interface AboutAfrigomboProps {
  onBack?: () => void;
  onSupport?: () => void;
}

export default function AboutAfrigombo({ onBack, onSupport }: AboutAfrigomboProps) {
  return (
    <div className="min-h-screen bg-afri-bg text-afri-text pb-20">
      {/* HEADER WITH BACK BUTTON */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center pointer-events-none">
        <button 
          onClick={onBack}
          className="p-3 bg-afri-bg-sec/80 backdrop-blur-md border border-afri-border rounded-full text-afri-text pointer-events-auto hover:bg-afri-bg-ter transition-all active:scale-95"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
        {onSupport && (
          <button 
            onClick={onSupport}
            className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest pointer-events-auto hover:bg-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Heart className="w-3 h-3" /> Soutenir
          </button>
        )}
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-amber-500/20 to-transparent blur-3xl -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest"
            >
              <Zap className="w-3 h-3" />
              L'Évolution Musicale
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="inline-flex items-center px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Bêta Privée V2.0</span>
            </motion.div>
          </div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black font-mono tracking-tighter leading-none"
          >
            POURQUOI <span className="text-[#D4AF37]">AFRIGOMBO</span> EST DIFFÉRENT ?
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-afri-text-sec text-sm md:text-lg max-w-2xl mx-auto font-medium"
          >
            Nous ne sommes pas juste une application de petites annonces. Nous construisons le Temple de la Confiance pour l'industrie musicale africaine.
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-afri-bg border border-afri-border p-8 rounded-3xl space-y-4 hover:border-afri-border transition-colors group"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center ${feature.color} group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black font-mono uppercase tracking-tight">{feature.title}</h3>
              <p className="text-afri-text-sec text-sm leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="px-6 py-20 bg-afri-bg/50">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black font-mono uppercase">Notre Vision</h2>
            <div className="w-20 h-1 bg-afri-bg-sec mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-afri-bg-sec border border-afri-border flex items-center justify-center mx-auto">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
              <h4 className="font-bold text-sm uppercase">Excellence</h4>
              <p className="text-[11px] text-afri-text-sec font-medium">Nous valorisons le talent pur et la ponctualité exemplaire.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-afri-bg-sec border border-afri-border flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="font-bold text-sm uppercase">Transparence</h4>
              <p className="text-[11px] text-afri-text-sec font-medium">Aucun frais caché. Une commission claire qui finance le Temple.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-afri-bg-sec border border-afri-border flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              <h4 className="font-bold text-sm uppercase">Communauté</h4>
              <p className="text-[11px] text-afri-text-sec font-medium">Un écosystème où chaque musicien est respecté et protégé.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto bg-afri-bg-sec text-black p-12 rounded-[3rem] space-y-8 shadow-[0_20px_50px_rgba(212,175,55,0.2)]"
        >
          <h2 className="text-3xl font-black font-mono leading-none uppercase italic">Prêt à entrer dans l'Élite ?</h2>
          <p className="text-sm font-bold opacity-80 uppercase tracking-wide">
            Le futur de la musique africaine commence avec la confiance.
          </p>
          <button 
            onClick={() => window.location.href = "/"}
            className="bg-afri-bg text-afri-text px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
          >
            Explorer le Terrain <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </section>
    </div>
  );
}
