import React, { useState, useEffect } from "react";
import AdminCentre from "./components/AdminCentre.tsx";

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("gombo_theme");
    return saved !== "light"; // Default is dark/prestige mode
  });

  useEffect(() => {
    localStorage.setItem("gombo_theme", darkMode ? "dark" : "light");
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen font-sans antialiased overflow-x-hidden transition-colors duration-300 ${darkMode ? "bg-[#0B0B0B] text-[#F5F5F5]" : "bg-[#F9FBFA] text-[#1F2937]"}`}>
      <AdminCentre darkMode={darkMode} setDarkMode={setDarkMode} />
    </div>
  );
}

export default App;
