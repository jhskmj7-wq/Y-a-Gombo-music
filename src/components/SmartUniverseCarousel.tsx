import React from "react";
import { motion } from "motion/react";
import { 
  Globe, ShoppingBag, GraduationCap, Calendar, Users, Star, 
  ArrowRight, Sparkles
} from "lucide-react";

interface UniverseItem {
  id: string;
  type: "product" | "course" | "event" | "creator" | "service" | "news";
  title: string;
  image: string;
  description: string;
  tag: string;
}

interface SmartUniverseCarouselProps {
  items: UniverseItem[];
  onAction?: (item: UniverseItem) => void;
}

const getIconForType = (type: UniverseItem["type"]) => {
  switch (type) {
    case "product": return <ShoppingBag className="w-3 h-3" />;
    case "course": return <GraduationCap className="w-3 h-3" />;
    case "event": return <Calendar className="w-3 h-3" />;
    case "creator": return <Users className="w-3 h-3" />;
    case "news": return <Sparkles className="w-3 h-3" />;
    default: return <Globe className="w-3 h-3" />;
  }
};

export const SmartUniverseCarousel: React.FC<SmartUniverseCarouselProps> = ({ items, onAction }) => {
  if (!items || items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-4 py-4"
    >
      <div className="flex items-center gap-2 px-1">
        <Globe className="w-4 h-4 text-indigo-400" />
        <h3 className="text-[11px] font-sans font-black tracking-widest text-afri-text uppercase">
          UNIVERS AFRIGOMBO
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-indigo-400/30 to-transparent ml-2" />
      </div>

      <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar snap-x">
        {items.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -5 }}
            onClick={() => onAction?.(item)}
            className="flex-none w-72 bg-afri-bg-sec border border-afri-border rounded-3xl overflow-hidden shadow-xl group cursor-pointer snap-start relative"
          >
            <div className="relative aspect-[4/3]">
              <img 
                src={item.image} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt={item.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-afri-bg via-afri-bg/20 to-transparent" />
              
              {/* Floating Tag */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-afri-bg/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-afri-border/50">
                <span className="text-indigo-400">{getIconForType(item.type)}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-afri-text">{item.tag}</span>
              </div>
            </div>

            <div className="p-5 space-y-2">
              <h4 className="text-sm font-black text-afri-text leading-tight group-hover:text-indigo-400 transition-colors">
                {item.title}
              </h4>
              <p className="text-[11px] text-afri-text-sec line-clamp-2 leading-relaxed">
                {item.description}
              </p>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-5 h-5 rounded-full border-2 border-afri-bg-sec bg-afri-bg overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="avatar" />
                    </div>
                  ))}
                  <div className="w-5 h-5 rounded-full border-2 border-afri-bg-sec bg-indigo-400 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-black">+</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black text-indigo-400 uppercase tracking-widest group-hover:gap-2 transition-all">
                  Explorer <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Premium Glow Effect */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-400/20 rounded-3xl transition-colors pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
