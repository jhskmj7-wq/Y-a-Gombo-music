const fs = require('fs');
let content = fs.readFileSync('src/components/UserTerrainLandingPage.tsx', 'utf8');

// The file has a main return (
// <div className={...}>
//   {/* 1. BARRE DE RECHERCHE UNIVERSELLE */}
//   <div className="relative">...</div>
//   {/* 1.5 TOGGLES */}
//   <div className="flex justify-center items-center gap-1.5 p-1 bg-afri-bg-sec/85 ...">...</div>
//   <div className="text-center text-[8.5px] ...">...</div> // duplicate ReelsPlayer here!
//   {currentSection === "home" ? ( <> ... </> ) : ( <ReelsPlayer /> )}

// Let's replace the whole top part!
// We can just find the start of BARRE DE RECHERCHE UNIVERSELLE
const searchStart = '{/* ==========================================\n          1. BARRE DE RECHERCHE UNIVERSELLE\n         ========================================== */}';
const currentSectionHomeStart = '{currentSection === "home" ? (';
const secondCurrentSectionHomeStart = '      {currentSection === "home" ? (\n        <>\n          {/* ==========================================';

const searchIndex = content.indexOf(searchStart);
const splitIndex = content.indexOf(secondCurrentSectionHomeStart);

if (searchIndex !== -1 && splitIndex !== -1) {
  // We want to remove the duplicate ReelsPlayer which is inside the text-center div.
  // Actually, we can just replace the whole text-center block.
  
  // Let's just find the text-center div and replace it.
  const textCenterStart = '<div className="text-center text-[8.5px] font-mono tracking-wider font-extrabold text-afri-text-sec uppercase flex items-center justify-center gap-1 sm:hidden select-none -translate-y-2 mt-1">';
  const textCenterEnd = '</div>';
  const textCenterStartIndex = content.indexOf(textCenterStart);
  if (textCenterStartIndex !== -1) {
    // Find the matching end div for textCenterStart
    let count = 0;
    let textCenterEndIndex = -1;
    const substr = content.substring(textCenterStartIndex);
    for (let i = 0; i < substr.length - 5; i++) {
       if (substr.substring(i, i+4) === '<div') count++;
       if (substr.substring(i, i+5) === '</div') count--;
       if (count === 0 && i > 0) {
          textCenterEndIndex = textCenterStartIndex + i + 6;
          break;
       }
    }
    
    if (textCenterEndIndex !== -1) {
       const replacement = `<div className="text-center text-[8.5px] font-mono tracking-wider font-extrabold text-afri-text-sec uppercase flex items-center justify-center gap-1 sm:hidden select-none -translate-y-2 mt-1">
        <span>Faites glisser vers la droite</span>
        <span className="text-[#D4AF37] animate-pulse">➔</span>
        <span>pour les réels</span>
      </div>`;
       content = content.substring(0, textCenterStartIndex) + replacement + content.substring(textCenterEndIndex);
    }
  }

  // Now wrap the top in {currentSection === "home" && ( <> ... </> )}
  const searchStartNewIndex = content.indexOf(searchStart);
  const homeConditionIndex = content.indexOf('      {currentSection === "home" ? (\n        <>\n          {/* ==========================================');
  
  if (searchStartNewIndex !== -1 && homeConditionIndex !== -1) {
     const before = content.substring(0, searchStartNewIndex);
     const middle = content.substring(searchStartNewIndex, homeConditionIndex);
     const after = content.substring(homeConditionIndex);
     
     // The after part starts with:
     // {currentSection === "home" ? (
     //   <>
     //     {/* ==========================================
     
     // We can just move the `middle` into the `<>` in the `after` part!
     const newAfter = after.replace(
       '      {currentSection === "home" ? (\n        <>\n',
       '      {currentSection === "home" ? (\n        <>\n' + middle + '\n'
     );
     
     fs.writeFileSync('src/components/UserTerrainLandingPage.tsx', before + newAfter);
     console.log("Successfully wrapped home section!");
  }
}
