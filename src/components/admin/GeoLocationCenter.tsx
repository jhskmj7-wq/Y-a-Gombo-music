import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function GeoLocationCenter() {
  const mapContainer = useRef(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [activeFilter, setActiveFilter] = useState("Tous");

  useEffect(() => {
    if (map.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [-4.0083, 5.3599], // Abidjan, Côte d'Ivoire
      zoom: 12,
    });
    map.current.addControl(new maplibregl.NavigationControl());
  }, []);

  return (
    <div className="h-full flex flex-col p-4 bg-afri-bg text-afri-text">
      <h2 className="text-2xl font-bold mb-4">Centre de Géolocalisation</h2>
      
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {["Tous", "Gombos", "Renforts", "Castings", "Évènements", "Premium", "Utilisateurs"].map(filter => (
          <button 
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm ${activeFilter === filter ? "bg-afri-gold text-black" : "bg-afri-bg-sec"}`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div ref={mapContainer} className="flex-grow rounded-xl overflow-hidden mb-4" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["Total Gombos", "Renforts", "Castings", "Actifs"].map(stat => (
          <div key={stat} className="bg-afri-bg-sec p-4 rounded-xl">
            <p className="text-afri-text-sec text-sm">{stat}</p>
            <p className="text-xl font-bold">0</p>
          </div>
        ))}
      </div>
    </div>
  );
}
