import { AvatarConfig, AvatarItem } from "../../types/avatar";
import { AVATAR_RENDER_ORDER } from "./Layers";

const FREE_ITEM_IDS = [
  "corps_elite_standard",
  "tete_elite_standard",
  "tete_elite_fine",
  "visage_naturel",
  "visage_barbe_legere",
  "visage_barbe_elite_fournie",
  "visage_bouc_elite",
  "moustache_sapeur",
  "hair_elite_afro_short",
  "hair_elite_degrade",
  "hair_elite_nattes",
  "hair_elite_locks",
  "eyes_elite_noir",
  "eyes_elite_marron",
  "sourcils_naturels",
  "sourcils_sculptes",
  "mouth_elite_sourire",
  "mouth_elite_neutre",
  "clothes_elite_tshirt_blanc",
  "clothes_elite_boubou_short",
  "clothes_elite_veste_sapeur"
];

/**
 * AFRIGOMBO ELITE - PROFESSIONAL SVG RENDERER (V3 MODERN)
 * Handles highly customized dynamic facial geometry for realistic modern African individuals.
 */
export const AvatarRenderer = {
  /**
   * Generates a high-quality SVG URI for the Elite Avatar engine
   */
  render(configV2: any, configV1: AvatarConfig, storeItems: AvatarItem[]): string {
    const skinColor = configV1?.skinColor || "#8D5524";
    const bgColor = configV1?.background || "#18181b";
    
    const getItem = (itemId: string) => storeItems.find(i => i.id === itemId);
    const layers: string[] = [];
    const equippedV2 = configV2?.items || {};

    // 1. BACKGROUND
    if (equippedV2['arriere_plans']) {
      layers.push(getItem(equippedV2['arriere_plans'])?.svgContent || "");
    }

    // Dynamic Parameter Parsing
    const isFemale = configV1?.gender === 'female';
    const age = configV1?.age !== undefined ? Number(configV1.age) : 25;

    // Face Structure parameters (V3 Modern)
    const faceWidth = configV1?.faceWidth !== undefined ? Number(configV1.faceWidth) : 1.0;
    const faceHeight = configV1?.faceHeight !== undefined ? Number(configV1.faceHeight) : 1.0;
    const foreheadWidth = configV1?.foreheadWidth !== undefined ? Number(configV1.foreheadWidth) : 1.0;
    const cheekWidth = configV1?.cheekWidth !== undefined ? Number(configV1.cheekWidth) : 1.0;
    const jawWidth = configV1?.jawWidth !== undefined ? Number(configV1.jawWidth) : (configV1?.jawShape !== undefined ? Number(configV1.jawShape) : 0.5);
    const jawHeight = configV1?.jawHeight !== undefined ? Number(configV1.jawHeight) : 1.0;
    const chinWidth = configV1?.chinWidth !== undefined ? Number(configV1.chinWidth) : 1.0;
    const chinHeight = configV1?.chinHeight !== undefined ? Number(configV1.chinHeight) : 1.0;

    // Eyes & Eyebrows parameters (V3 Modern)
    const eyesHeight = configV1?.eyesHeight !== undefined ? Number(configV1.eyesHeight) : 1.0;
    const eyesWidth = configV1?.eyesWidth !== undefined ? Number(configV1.eyesWidth) : (configV1?.eyeWidth !== undefined ? Number(configV1.eyeWidth) : 1.0);
    const eyesSpacing = configV1?.eyesSpacing !== undefined ? Number(configV1.eyesSpacing) : (configV1?.eyeSpacing !== undefined ? Number(configV1.eyeSpacing) : 1.0);
    const eyeSize = configV1?.eyeSize !== undefined ? Number(configV1.eyeSize) : 1.0;
    const eyeTilt = configV1?.eyeTilt !== undefined ? Number(configV1.eyeTilt) : 0;
    const eyeHeightPosition = configV1?.eyeHeightPosition !== undefined ? Number(configV1.eyeHeightPosition) : 1.0;
    const irisSize = configV1?.irisSize !== undefined ? Number(configV1.irisSize) : 4.2;

    const eyebrowsPosition = configV1?.eyebrowsPosition !== undefined ? Number(configV1.eyebrowsPosition) : 1.0;
    const eyebrowWidth = configV1?.eyebrowWidth !== undefined ? Number(configV1.eyebrowWidth) : 1.0;
    const eyebrowThickness = configV1?.eyebrowThickness !== undefined ? Number(configV1.eyebrowThickness) : 1.0;
    const eyebrowAngle = configV1?.eyebrowAngle !== undefined ? Number(configV1.eyebrowAngle) : 0;
    const eyebrowHeight = configV1?.eyebrowHeight !== undefined ? Number(configV1.eyebrowHeight) : 1.0;

    // Nose parameters (V3 Modern)
    const noseHeight = configV1?.noseHeight !== undefined ? Number(configV1.noseHeight) : 1.0;
    const noseWidth = configV1?.noseWidth !== undefined ? Number(configV1.noseWidth) : 1.0;
    const noseLength = configV1?.noseLength !== undefined ? Number(configV1.noseLength) : 1.0;
    const noseTipWidth = configV1?.noseTipWidth !== undefined ? Number(configV1.noseTipWidth) : 1.0;
    const noseTipHeight = configV1?.noseTipHeight !== undefined ? Number(configV1.noseTipHeight) : 1.0;
    const nostrilWidth = configV1?.nostrilWidth !== undefined ? Number(configV1.nostrilWidth) : 1.0;
    const noseBridgeWidth = configV1?.noseBridgeWidth !== undefined ? Number(configV1.noseBridgeWidth) : 1.0;

    // Mouth parameters (V3 Modern)
    const mouthWidth = configV1?.mouthWidth !== undefined ? Number(configV1.mouthWidth) : 1.0;
    const mouthThickness = configV1?.mouthThickness !== undefined ? Number(configV1.mouthThickness) : 1.0;
    const upperLipThickness = configV1?.upperLipThickness !== undefined ? Number(configV1.upperLipThickness) : 1.0;
    const lowerLipThickness = configV1?.lowerLipThickness !== undefined ? Number(configV1.lowerLipThickness) : 1.0;
    const mouthHeight = configV1?.mouthHeight !== undefined ? Number(configV1.mouthHeight) : 1.0;
    const mouthCornerAngle = configV1?.mouthCornerAngle !== undefined ? Number(configV1.mouthCornerAngle) : 0;

    // Ears parameters (V3 Modern)
    const earsShape = configV1?.earsShape || 'standard';
    const earSize = configV1?.earSize !== undefined ? Number(configV1.earSize) : 1.0;
    const earAngle = configV1?.earAngle !== undefined ? Number(configV1.earAngle) : 0;
    const earPosition = configV1?.earPosition !== undefined ? Number(configV1.earPosition) : 1.0;

    // Hair parameters
    const hairline = configV1?.hairline !== undefined ? Number(configV1.hairline) : (configV1?.hairlineHeight !== undefined ? Number(configV1.hairlineHeight) : 1.0);

    // Body parameters (V3 Modern)
    const shoulderWidth = configV1?.shoulderWidth !== undefined ? Number(configV1.shoulderWidth) : 1.0;
    const torsoWidth = configV1?.torsoWidth !== undefined ? Number(configV1.torsoWidth) : 1.0;
    const neckWidth = configV1?.neckWidth !== undefined ? Number(configV1.neckWidth) : 1.0;
    const bodyHeight = configV1?.bodyHeight !== undefined ? Number(configV1.bodyHeight) : 1.0;

    // Face Landmarks Calculations
    const halfW = (isFemale ? 30 : 32) * faceWidth;
    const halfFw = halfW * foreheadWidth;
    const halfCheekW = halfW * cheekWidth;
    const halfJawW = halfW * (0.4 + jawWidth * 0.5);
    const chinHalfW = halfW * (0.05 + chinWidth * 0.1);

    const foreheadY = 76 - (isFemale ? 42 : 44) * faceHeight * hairline;
    const templeY = 76 - (isFemale ? 15 : 18) * faceHeight;
    const cheekY = 76 + 5 * faceHeight;
    const jawY = 76 + (isFemale ? 40 : 42) * faceHeight * jawHeight;
    const chinY = 76 + (isFemale ? 68 : 70) * faceHeight * chinHeight;

    // Elegant HSL-based skin-tone shadow/highlight calculation for volumetric 3D effects
    const cleanColorHex = skinColor.replace('#', '');
    const skinR = parseInt(cleanColorHex.substring(0, 2), 16) || 0;
    const skinG = parseInt(cleanColorHex.substring(2, 4), 16) || 0;
    const skinB = parseInt(cleanColorHex.substring(4, 6), 16) || 0;

    const skinLr = Math.min(255, Math.floor(skinR * 1.25 + 15));
    const skinLg = Math.min(255, Math.floor(skinG * 1.25 + 10));
    const skinLb = Math.min(255, Math.floor(skinB * 1.15 + 5));
    const skinLight = `#${skinLr.toString(16).padStart(2, '0')}${skinLg.toString(16).padStart(2, '0')}${skinLb.toString(16).padStart(2, '0')}`;

    const skinDr = Math.max(0, Math.floor(skinR * 0.75 - 10));
    const skinDg = Math.max(0, Math.floor(skinG * 0.75 - 10));
    const skinDb = Math.max(0, Math.floor(skinB * 0.7 - 10));
    const skinDark = `#${skinDr.toString(16).padStart(2, '0')}${skinDg.toString(16).padStart(2, '0')}${skinDb.toString(16).padStart(2, '0')}`;

    const gradIdFace = `skinGradFace_${cleanColorHex}`;
    const gradIdNeck = `skinGradNeck_${cleanColorHex}`;

    // Define custom SVG gradients for breathtaking 3D depth rendering
    const gradientsDefs = `
      <defs>
        <radialGradient id="${gradIdFace}" cx="50%" cy="35%" r="65%" fx="42%" fy="28%">
          <stop offset="0%" stop-color="${skinLight}" />
          <stop offset="65%" stop-color="${skinColor}" />
          <stop offset="100%" stop-color="${skinDark}" />
        </radialGradient>
        <linearGradient id="${gradIdNeck}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${skinColor}" />
          <stop offset="100%" stop-color="${skinDark}" />
        </linearGradient>
        <linearGradient id="scleraGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#EBEFF2" />
          <stop offset="15%" stop-color="#FFFFFF" />
          <stop offset="85%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#EBEFF2" />
        </linearGradient>
      </defs>
    `;

    // Push definitions directly as the second layer so everything can use them
    layers.push(gradientsDefs);

    // 2. ELITE BASE CHARACTER BODY (Refined shoulder, neck and torso math)
    const hasCustomBody = equippedV2['corps'] && !FREE_ITEM_IDS.includes(equippedV2['corps']);
    if (!hasCustomBody) {
      const shoulderScale = shoulderWidth * (isFemale ? 0.9 : 1.0);
      const torsoScale = torsoWidth * (isFemale ? 0.95 : 1.0);
      const leftShoulderX = 100 - (isFemale ? 65 : 72) * shoulderScale;
      const rightShoulderX = 100 + (isFemale ? 65 : 72) * shoulderScale;
      const leftTorsoX = 100 - (isFemale ? 62 : 68) * torsoScale;
      const rightTorsoX = 100 + (isFemale ? 62 : 68) * torsoScale;
      
      const bodyPath = `M ${leftTorsoX} 220 
        C ${leftShoulderX} 152, 58 132, 100 132 
        C 142 132, ${rightShoulderX} 152, ${rightTorsoX} 220 Z`;

      const neckW_val = (isFemale ? 12 : 14) * faceWidth * neckWidth;
      const neckY1 = 76 + 32 * faceHeight;
      const neckY2 = 136 + (bodyHeight - 1.0) * 10;
      
      const neckPath = `M ${100 - neckW_val} ${neckY1} 
        L ${100 + neckW_val} ${neckY1} 
        L ${100 + neckW_val * 1.05} ${neckY2} 
        Q 100 ${neckY2 + 4} ${100 - neckW_val * 1.05} ${neckY2} Z`;
      
      layers.push(`
        <g id="elite_character_base">
          <!-- Volumetric clavicle base shadow -->
          <ellipse cx="100" cy="140" rx="28" ry="7" fill="black" opacity="0.12" />
          <!-- Anatomically elegant Torso -->
          <path d="${bodyPath}" fill="url(#${gradIdNeck})" />
          <!-- Neck connecting face and body with natural drop shadow -->
          <path d="${neckPath}" fill="url(#${gradIdNeck})" />
          <path d="M ${100 - neckW_val} ${neckY1 + 1} Q 100 ${neckY1 + 8} ${100 + neckW_val} ${neckY1 + 1}" stroke="rgba(0,0,0,0.18)" stroke-width="1.2" fill="none" />
          <!-- Artistic clavicle definitions -->
          <path d="M 52 148 Q 78 152 96 145" stroke="rgba(0,0,0,0.1)" stroke-width="0.8" fill="none" />
          <path d="M 148 148 Q 122 152 104 145" stroke="rgba(0,0,0,0.1)" stroke-width="0.8" fill="none" />
        </g>
      `);
    } else {
      layers.push(getItem(equippedV2['corps'])?.svgContent || "");
    }

    // 3. HEAD & EARS (Fully parameterized 3D curves)
    const hasCustomHead = equippedV2['tete'] && !FREE_ITEM_IDS.includes(equippedV2['tete']);
    if (!hasCustomHead) {
      const earY = 82 + (earPosition - 1.0) * 8;
      const earW = (isFemale ? 10 : 11) * faceWidth * earSize;
      const earH_val = (isFemale ? 12 : 13) * faceHeight * earSize;
      let leftEarPath = "";
      let rightEarPath = "";

      const earRotL = -earAngle;
      const earRotR = earAngle;

      if (earsShape === 'round') {
        leftEarPath = `M ${100 - halfW} ${earY - earH_val * 0.9} 
          C ${100 - halfW - earW * 1.1} ${earY - earH_val * 0.9}, ${100 - halfW - earW * 1.1} ${earY + earH_val * 0.9}, ${100 - halfW} ${earY + earH_val * 0.9} 
          C ${100 - halfW - earW * 0.3} ${earY + earH_val * 0.75}, ${100 - halfW - earW * 0.1} ${earY - earH_val * 0.75}, ${100 - halfW} ${earY - earH_val * 0.9} Z`;
        rightEarPath = `M ${100 + halfW} ${earY - earH_val * 0.9} 
          C ${100 + halfW + earW * 1.1} ${earY - earH_val * 0.9}, ${100 + halfW + earW * 1.1} ${earY + earH_val * 0.9}, ${100 + halfW} ${earY + earH_val * 0.9} 
          C ${100 + halfW + earW * 0.3} ${earY + earH_val * 0.75}, ${100 + halfW + earW * 0.1} ${earY - earH_val * 0.75}, ${100 + halfW} ${earY - earH_val * 0.9} Z`;
      } else if (earsShape === 'pointed') {
        leftEarPath = `M ${100 - halfW} ${earY - earH_val * 0.7} 
          Q ${100 - halfW - earW * 1.3} ${earY - earH_val * 1.4} ${100 - halfW - earW * 0.4} ${earY - earH_val * 0.15} 
          Q ${100 - halfW - earW * 0.9} ${earY + earH_val * 0.9} ${100 - halfW} ${earY + earH_val * 1.1} Z`;
        rightEarPath = `M ${100 + halfW} ${earY - earH_val * 0.7} 
          Q ${100 + halfW + earW * 1.3} ${earY - earH_val * 1.4} ${100 + halfW + earW * 0.4} ${earY - earH_val * 0.15} 
          Q ${100 + halfW + earW * 0.9} ${earY + earH_val * 0.9} ${100 + halfW} ${earY + earH_val * 1.1} Z`;
      } else {
        // standard
        leftEarPath = `M ${100 - halfW} ${earY - earH_val * 0.8} 
          C ${100 - halfW - earW * 0.9} ${earY - earH_val * 1.1}, ${100 - halfW - earW * 1.1} ${earY + earH_val * 0.8}, ${100 - halfW} ${earY + earH_val * 1.2} 
          C ${100 - halfW - earW * 0.3} ${earY + earH_val * 0.9}, ${100 - halfW - earW * 0.2} ${earY - earH_val * 0.5}, ${100 - halfW} ${earY - earH_val * 0.8} Z`;
        rightEarPath = `M ${100 + halfW} ${earY - earH_val * 0.8} 
          C ${100 + halfW + earW * 0.9} ${earY - earH_val * 1.1}, ${100 + halfW + earW * 1.1} ${earY + earH_val * 0.8}, ${100 + halfW} ${earY + earH_val * 1.2} 
          C ${100 + halfW + earW * 0.3} ${earY + earH_val * 0.9}, ${100 + halfW + earW * 0.2} ${earY - earH_val * 0.5}, ${100 + halfW} ${earY - earH_val * 0.8} Z`;
      }

      // 10-point symmetric high-fidelity organic Bezier face path
      const facePath = `M 100 ${foreheadY} 
        C ${100 + halfFw * 0.5} ${foreheadY}, ${100 + halfFw} ${foreheadY + (templeY - foreheadY) * 0.25}, ${100 + halfFw} ${templeY}
        C ${100 + halfFw} ${templeY + (cheekY - templeY) * 0.4}, ${100 + halfCheekW} ${templeY + (cheekY - templeY) * 0.7}, ${100 + halfCheekW} ${cheekY}
        C ${100 + halfCheekW} ${cheekY + (jawY - cheekY) * 0.4}, ${100 + halfJawW} ${cheekY + (jawY - cheekY) * 0.75}, ${100 + halfJawW} ${jawY}
        C ${100 + halfJawW} ${jawY + (chinY - jawY) * 0.4}, ${100 + chinHalfW * 1.5} ${chinY - (chinY - jawY) * 0.1}, ${100 + chinHalfW} ${chinY}
        L ${100 - chinHalfW} ${chinY}
        C ${100 - chinHalfW * 1.5} ${chinY - (chinY - jawY) * 0.1}, ${100 - halfJawW} ${jawY + (chinY - jawY) * 0.4}, ${100 - halfJawW} ${jawY}
        C ${100 - halfJawW} ${cheekY + (jawY - cheekY) * 0.75}, ${100 - halfCheekW} ${cheekY + (jawY - cheekY) * 0.4}, ${100 - halfCheekW} ${cheekY}
        C ${100 - halfCheekW} ${templeY + (cheekY - templeY) * 0.7}, ${100 - halfFw} ${templeY + (cheekY - templeY) * 0.4}, ${100 - halfFw} ${templeY}
        C ${100 - halfFw} ${foreheadY + (templeY - foreheadY) * 0.25}, ${100 - halfFw * 0.5} ${foreheadY}, 100 ${foreheadY} Z`;

      layers.push(`
        <g id="elite_head_base">
          <!-- Left Ear with dynamic angle rotation -->
          <g transform="rotate(${earRotL}, ${100 - halfW}, ${earY})">
            <path d="${leftEarPath}" fill="url(#${gradIdFace})" />
            <path d="${leftEarPath}" stroke="rgba(0,0,0,0.18)" stroke-width="0.8" fill="none" />
          </g>

          <!-- Right Ear with dynamic angle rotation -->
          <g transform="rotate(${earRotR}, ${100 + halfW}, ${earY})">
            <path d="${rightEarPath}" fill="url(#${gradIdFace})" />
            <path d="${rightEarPath}" stroke="rgba(0,0,0,0.18)" stroke-width="0.8" fill="none" />
          </g>

          <!-- Volumetric 3D Face Outline -->
          <path d="${facePath}" fill="url(#${gradIdFace})" />
          <path d="${facePath}" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="0.8" />
        </g>
      `);
    } else {
      layers.push(getItem(equippedV2['tete'])?.svgContent || "");
    }

    // 4. EYES & IRISES & EYELASHES (High-end V3 details)
    const hasCustomEyes = equippedV2['yeux'] && !FREE_ITEM_IDS.includes(equippedV2['yeux']);
    if (!hasCustomEyes) {
      const eyeY = 76 + 6 * faceHeight * eyeHeightPosition;
      const eyeSpacingOffset = (isFemale ? 14 : 15) * eyesSpacing;
      const eyeW = (isFemale ? 15 : 16) * eyesWidth * eyeSize;
      const eyeH = (isFemale ? 5.5 : 6) * (eyesWidth * 0.4 + 0.6) * eyeSize;
      
      const L_eyeX = 100 - eyeSpacingOffset;
      const R_eyeX = 100 + eyeSpacingOffset;

      const eyelashesLeft = isFemale ? `
        <!-- Eyelash Wing Layout & Creases for female -->
        <path d="M ${L_eyeX - eyeW/2 - 2} ${eyeY} C ${L_eyeX - eyeW/4} ${eyeY - eyeH - 2} ${L_eyeX + eyeW/4} ${eyeY - eyeH - 2.5} ${L_eyeX + eyeW/2 + 2} ${eyeY - 0.5}" stroke="#111111" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <path d="M ${L_eyeX - eyeW/3} ${eyeY - eyeH * 0.8} Q ${L_eyeX - eyeW/2 - 4} ${eyeY - eyeH - 5} ${L_eyeX - eyeW/2 - 6} ${eyeY - eyeH - 6.5}" stroke="#111111" stroke-width="1.2" stroke-linecap="round" fill="none" />
        <path d="M ${L_eyeX + eyeW/4} ${eyeY - eyeH} Q ${L_eyeX + eyeW/2} ${eyeY - eyeH - 4.5} ${L_eyeX + eyeW/2 + 3} ${eyeY - eyeH - 5}" stroke="#111111" stroke-width="1.2" stroke-linecap="round" fill="none" />
      ` : `
        <!-- Defined eyelid lines for male -->
        <path d="M ${L_eyeX - eyeW/2 - 1} ${eyeY} Q ${L_eyeX} ${eyeY - eyeH - 1.2} ${L_eyeX + eyeW/2 + 1} ${eyeY}" stroke="#111111" stroke-width="1.8" stroke-linecap="round" fill="none" />
      `;

      const eyelashesRight = isFemale ? `
        <path d="M ${R_eyeX - eyeW/2 - 2} ${eyeY - 0.5} C ${R_eyeX - eyeW/4} ${eyeY - eyeH - 2.5} ${R_eyeX + eyeW/4} ${eyeY - eyeH - 2} ${R_eyeX + eyeW/2 + 2} ${eyeY}" stroke="#111111" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <path d="M ${R_eyeX + eyeW/3} ${eyeY - eyeH * 0.8} Q ${R_eyeX + eyeW/2 + 4} ${eyeY - eyeH - 5} ${R_eyeX + eyeW/2 + 6} ${eyeY - eyeH - 6.5}" stroke="#111111" stroke-width="1.2" stroke-linecap="round" fill="none" />
        <path d="M ${R_eyeX - eyeW/4} ${eyeY - eyeH} Q ${R_eyeX - eyeW/2} ${eyeY - eyeH - 4.5} ${R_eyeX - eyeW/2 - 3} ${eyeY - eyeH - 5}" stroke="#111111" stroke-width="1.2" stroke-linecap="round" fill="none" />
      ` : `
        <path d="M ${R_eyeX - eyeW/2 - 1} ${eyeY} Q ${R_eyeX} ${eyeY - eyeH - 1.2} ${R_eyeX + eyeW/2 + 1} ${eyeY}" stroke="#111111" stroke-width="1.8" stroke-linecap="round" fill="none" />
      `;

      // Organic almond outlines
      const leftEyePath = `M ${L_eyeX - eyeW/2} ${eyeY} 
        C ${L_eyeX - eyeW/3} ${eyeY - eyeH}, ${L_eyeX + eyeW/3} ${eyeY - eyeH * 0.95}, ${L_eyeX + eyeW/2} ${eyeY} 
        C ${L_eyeX + eyeW/3} ${eyeY + eyeH * 0.95}, ${L_eyeX - eyeW/3} ${eyeY + eyeH}, ${L_eyeX - eyeW/2} ${eyeY} Z`;

      const rightEyePath = `M ${R_eyeX - eyeW/2} ${eyeY} 
        C ${R_eyeX - eyeW/3} ${eyeY - eyeH * 0.95}, ${R_eyeX + eyeW/3} ${eyeY - eyeH}, ${R_eyeX + eyeW/2} ${eyeY} 
        C ${R_eyeX + eyeW/3} ${eyeY + eyeH}, ${R_eyeX - eyeW/3} ${eyeY + eyeH * 0.95}, ${R_eyeX - eyeW/2} ${eyeY} Z`;

      layers.push(`
        <g id="elite_eyes_base">
          <!-- Left Eye System -->
          <g transform="rotate(${eyeTilt}, ${L_eyeX}, ${eyeY})">
            <!-- 3D shaded white sclera -->
            <path d="${leftEyePath}" fill="url(#scleraGrad)" />
            <!-- Inner shade detail -->
            <path d="${leftEyePath}" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="0.6" />
            <!-- Dual-tone Iris with vibrant depth -->
            <circle cx="${L_eyeX}" cy="${eyeY}" r="${irisSize}" fill="#4E3629" />
            <circle cx="${L_eyeX}" cy="${eyeY}" r="${irisSize * 0.85}" fill="#2E1D13" />
            <circle cx="${L_eyeX}" cy="${eyeY}" r="${irisSize * 0.42}" fill="#0A0502" />
            <!-- Specular light reflections (lifelike eye shine) -->
            <circle cx="${L_eyeX - irisSize * 0.4}" cy="${eyeY - irisSize * 0.4}" r="1.3" fill="#FFFFFF" />
            <circle cx="${L_eyeX + irisSize * 0.35}" cy="${eyeY + irisSize * 0.35}" r="0.6" fill="#FFFFFF" opacity="0.6" />
            ${eyelashesLeft}
            <!-- Eyelid fold (paupière crease) -->
            <path d="M ${L_eyeX - eyeW * 0.55} ${eyeY - eyeH - 1.5} Q ${L_eyeX} ${eyeY - eyeH - 4} ${L_eyeX + eyeW * 0.45} ${eyeY - eyeH - 2.2}" stroke="rgba(0,0,0,0.22)" stroke-width="1.2" fill="none" />
          </g>

          <!-- Right Eye System -->
          <g transform="rotate(${-eyeTilt}, ${R_eyeX}, ${eyeY})">
            <path d="${rightEyePath}" fill="url(#scleraGrad)" />
            <path d="${rightEyePath}" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="0.6" />
            <circle cx="${R_eyeX}" cy="${eyeY}" r="${irisSize}" fill="#4E3629" />
            <circle cx="${R_eyeX}" cy="${eyeY}" r="${irisSize * 0.85}" fill="#2E1D13" />
            <circle cx="${R_eyeX}" cy="${eyeY}" r="${irisSize * 0.42}" fill="#0A0502" />
            <circle cx="${R_eyeX - irisSize * 0.4}" cy="${eyeY - irisSize * 0.4}" r="1.3" fill="#FFFFFF" />
            <circle cx="${R_eyeX + irisSize * 0.35}" cy="${eyeY + irisSize * 0.35}" r="0.6" fill="#FFFFFF" opacity="0.6" />
            ${eyelashesRight}
            <path d="M ${R_eyeX - eyeW * 0.45} ${eyeY - eyeH - 2.2} Q ${R_eyeX} ${eyeY - eyeH - 4} ${R_eyeX + eyeW * 0.55} ${eyeY - eyeH - 1.5}" stroke="rgba(0,0,0,0.22)" stroke-width="1.2" fill="none" />
          </g>
        </g>
      `);
    } else {
      layers.push(getItem(equippedV2['yeux'])?.svgContent || "");
    }

    // 5. EYEBROWS (Sleek vector arches)
    const hasCustomEyebrows = equippedV2['sourcils'] && !FREE_ITEM_IDS.includes(equippedV2['sourcils']);
    if (!hasCustomEyebrows) {
      const eyeY = 76 + 6 * faceHeight * eyeHeightPosition;
      const eyeSpacingOffset = (isFemale ? 14 : 15) * eyesSpacing;
      const eyeW = (isFemale ? 15 : 16) * eyesWidth * eyeSize;
      const L_eyeX = 100 - eyeSpacingOffset;
      const R_eyeX = 100 + eyeSpacingOffset;

      const eyebrowY = eyeY - 8 * faceHeight * eyebrowsPosition;
      const eb_w = eyeW * 1.05 * eyebrowWidth;
      const sOpacity = equippedV2['sourcils'] === "sourcils_sculptes" ? 0.95 : 0.85;

      const leftEyebrowPath = `M ${L_eyeX - eb_w * 0.55} ${eyebrowY + 1} 
        Q ${L_eyeX - eb_w * 0.05} ${eyebrowY - 4 - (eyebrowHeight - 1) * 3} ${L_eyeX + eb_w * 0.5} ${eyebrowY + 1.5} 
        Q ${L_eyeX} ${eyebrowY - 2.5 - (eyebrowHeight - 1) * 2} ${L_eyeX - eb_w * 0.5} ${eyebrowY + 0.8} Z`;

      const rightEyebrowPath = `M ${R_eyeX - eb_w * 0.5} ${eyebrowY + 1.5} 
        Q ${R_eyeX + eb_w * 0.05} ${eyebrowY - 4 - (eyebrowHeight - 1) * 3} ${R_eyeX + eb_w * 0.55} ${eyebrowY + 1} 
        Q ${R_eyeX} ${eyebrowY - 2.5 - (eyebrowHeight - 1) * 2} ${R_eyeX - eb_w * 0.5} ${eyebrowY + 0.8} Z`;

      layers.push(`
        <g id="elite_eyebrows_base" fill="#111111" opacity="${sOpacity}">
          <!-- Left Eyebrow with dynamic rotation -->
          <g transform="rotate(${-eyebrowAngle}, ${L_eyeX}, ${eyebrowY})">
            <path d="${leftEyebrowPath}" />
          </g>
          <!-- Right Eyebrow with dynamic rotation -->
          <g transform="rotate(${eyebrowAngle}, ${R_eyeX}, ${eyebrowY})">
            <path d="${rightEyebrowPath}" />
          </g>
        </g>
      `);
    } else {
      layers.push(getItem(equippedV2['sourcils'])?.svgContent || "");
    }

    // 6. NOSE (V3 Multi-element anatomical model)
    const noseY = 76 + 24 * faceHeight * noseHeight;
    const noseW_val = 5 * noseWidth;
    const bridgeTopY = 76 + 6 * faceHeight * eyeHeightPosition;

    layers.push(`
      <g id="elite_nose_base">
        <!-- Natural Nose Bridge highlight/shadow defining bone structure -->
        <path d="M 97.5 ${bridgeTopY} L ${100 - 1.5 * noseBridgeWidth} ${noseY - 4}" stroke="rgba(0,0,0,0.06)" stroke-width="1.5" fill="none" />
        <path d="M 101.5 ${bridgeTopY} L ${100 + 1.5 * noseBridgeWidth} ${noseY - 4}" stroke="rgba(255,255,255,0.08)" stroke-width="1.2" fill="none" />

        <!-- Soft nasal tip definition -->
        <ellipse cx="100" cy="${noseY}" rx="${3 * noseTipWidth * noseWidth}" ry="${2.2 * noseTipHeight}" fill="rgba(0,0,0,0.08)" />
        <ellipse cx="99.5" cy="${noseY - 0.5}" rx="${1.5 * noseTipWidth * noseWidth}" ry="1.0" fill="rgba(255,255,255,0.06)" />

        <!-- Warm natural African nasal wings -->
        <path d="M ${100 - noseW_val * 1.4 * nostrilWidth} ${noseY + 0.5} Q ${100 - noseW_val * 0.8} ${noseY - 1.8} 100 ${noseY + 0.2}" stroke="rgba(0,0,0,0.18)" stroke-width="1.2" stroke-linecap="round" fill="none" />
        <path d="M ${100 + noseW_val * 1.4 * nostrilWidth} ${noseY + 0.5} Q ${100 + noseW_val * 0.8} ${noseY - 1.8} 100 ${noseY + 0.2}" stroke="rgba(0,0,0,0.18)" stroke-width="1.2" stroke-linecap="round" fill="none" />

        <!-- Shadows under nostrils -->
        <path d="M ${100 - noseW_val * 1.1} ${noseY + 1} Q 100 ${noseY + 3.2} ${100 + noseW_val * 1.1} ${noseY + 1}" stroke="rgba(0,0,0,0.32)" stroke-width="1.5" stroke-linecap="round" fill="none" />
      </g>
    `);

    // 7. MOUTH / LIPS (High-end realistic lips with beautiful highlights)
    const hasCustomMouth = equippedV2['bouche'] && !FREE_ITEM_IDS.includes(equippedV2['bouche']);
    if (!hasCustomMouth) {
      const mouthY = noseY + 16 * faceHeight + 4 * mouthThickness * mouthHeight;
      const mouthW_val = (isFemale ? 13 : 14) * mouthWidth;
      const lipThicknessTop = (isFemale ? 4.2 : 3.6) * mouthThickness * upperLipThickness;
      const lipThicknessBottom = (isFemale ? 4.5 : 3.8) * mouthThickness * lowerLipThickness;
      const cornerY = mouthCornerAngle;
      
      const lipToneTop = isFemale ? "rgba(165,42,42,0.32)" : "rgba(0,0,0,0.22)";
      const lipToneBottom = isFemale ? "rgba(180,60,60,0.28)" : "rgba(0,0,0,0.12)";

      const isSourire = equippedV2['bouche'] !== "mouth_elite_neutre";
      const topLipPath = isSourire 
        ? `M ${100 - mouthW_val} ${mouthY + cornerY} 
           Q ${100 - mouthW_val * 0.45} ${mouthY - lipThicknessTop * 1.15} 100 ${mouthY - lipThicknessTop * 0.45} 
           Q ${100 + mouthW_val * 0.45} ${mouthY - lipThicknessTop * 1.15} ${100 + mouthW_val} ${mouthY + cornerY} 
           Q 100 ${mouthY + 0.2} ${100 - mouthW_val} ${mouthY + cornerY} Z`
        : `M ${100 - mouthW_val} ${mouthY + cornerY} 
           Q ${100 - mouthW_val * 0.45} ${mouthY - lipThicknessTop * 0.9} 100 ${mouthY - lipThicknessTop * 0.3} 
           Q ${100 + mouthW_val * 0.45} ${mouthY - lipThicknessTop * 0.9} ${100 + mouthW_val} ${mouthY + cornerY} 
           Q 100 ${mouthY + 0.2} ${100 - mouthW_val} ${mouthY + cornerY} Z`;

      const bottomLipPath = isSourire
        ? `M ${100 - mouthW_val} ${mouthY + cornerY} 
           Q 100 ${mouthY + lipThicknessBottom * 1.25} ${100 + mouthW_val} ${mouthY + cornerY} 
           Q 100 ${mouthY + 0.5} ${100 - mouthW_val} ${mouthY + cornerY} Z`
        : `M ${100 - mouthW_val} ${mouthY + cornerY} 
           Q 100 ${mouthY + lipThicknessBottom * 1.05} ${100 + mouthW_val} ${mouthY + cornerY} 
           Q 100 ${mouthY + 0.5} ${100 - mouthW_val} ${mouthY + cornerY} Z`;

      const lipLine = isSourire
        ? `M ${100 - mouthW_val + 0.8} ${mouthY + cornerY} Q 100 ${mouthY + cornerY * 0.5 + 0.5} ${100 + mouthW_val - 0.8} ${mouthY + cornerY}`
        : `M ${100 - mouthW_val + 0.8} ${mouthY + cornerY} L ${100 + mouthW_val - 0.8} ${mouthY + cornerY}`;

      layers.push(`
        <g id="elite_mouth_base">
          <!-- Top Lip (Natural Blend Crimson-Brown Shadow) -->
          <path d="${topLipPath}" fill="${lipToneTop}" />
          <!-- Bottom Lip (Natural Soft Glow/Highlight) -->
          <path d="${bottomLipPath}" fill="${lipToneBottom}" />
          <!-- Sub-lip depth shadow -->
          <path d="M ${100 - mouthW_val * 0.8} ${mouthY + lipThicknessBottom + 2} Q 100 ${mouthY + lipThicknessBottom + 5} ${100 + mouthW_val * 0.8} ${mouthY + lipThicknessBottom + 2}" stroke="rgba(0,0,0,0.1)" stroke-width="1.2" fill="none" />
          <!-- Central Lip Connection Line -->
          <path d="${lipLine}" stroke="#211005" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.85" />
        </g>
      `);
    } else {
      layers.push(getItem(equippedV2['bouche'])?.svgContent || "");
    }

    // 8. AGE PROGRESSION LINES (If age is set and high)
    if (age > 45) {
      const eyeY = 76 + 6 * faceHeight * eyesHeight;
      const eyeSpacingOffset = (isFemale ? 14 : 15) * eyesSpacing;
      const eyeW = (isFemale ? 15 : 16) * eyesWidth;
      const eyeH = (isFemale ? 5.5 : 6) * (eyesWidth * 0.4 + 0.6);
      const L_eyeX = 100 - eyeSpacingOffset;
      const R_eyeX = 100 + eyeSpacingOffset;
      const mouthY = noseY + 16 * faceHeight + 4 * mouthThickness;
      const mouthW_val = (isFemale ? 13 : 14) * mouthWidth;

      const lineOpacity = age > 60 ? "0.22" : "0.14";
      const strokeW = age > 60 ? "1.0" : "0.7";

      layers.push(`
        <g id="elite_age_progression" stroke="#111111" stroke-width="${strokeW}" fill="none" stroke-linecap="round" opacity="${lineOpacity}">
          <!-- Forehead lines -->
          <path d="M 82 ${foreheadY + 14 * faceHeight} Q 100 ${foreheadY + 16.5 * faceHeight} 118 ${foreheadY + 14 * faceHeight}" />
          <path d="M 86 ${foreheadY + 22 * faceHeight} Q 100 ${foreheadY + 24.5 * faceHeight} 114 ${foreheadY + 22 * faceHeight}" />

          <!-- Crow's feet (Left eye) -->
          <path d="M ${L_eyeX - eyeW/2 - 1} ${eyeY} Q ${L_eyeX - eyeW/2 - 6} ${eyeY - 3} ${L_eyeX - eyeW/2 - 10} ${eyeY - 4}" />
          <path d="M ${L_eyeX - eyeW/2 - 1} ${eyeY + 1.5} Q ${L_eyeX - eyeW/2 - 7} ${eyeY + 1.5} ${L_eyeX - eyeW/2 - 11} ${eyeY + 1.5}" />
          <path d="M ${L_eyeX - eyeW/2 - 1} ${eyeY + 3} Q ${L_eyeX - eyeW/2 - 6} ${eyeY + 4.5} ${L_eyeX - eyeW/2 - 9} ${eyeY + 5}" />

          <!-- Crow's feet (Right eye) -->
          <path d="M ${R_eyeX + eyeW/2 + 1} ${eyeY} Q ${R_eyeX + eyeW/2 + 6} ${eyeY - 3} ${R_eyeX + eyeW/2 + 10} ${eyeY - 4}" />
          <path d="M ${R_eyeX + eyeW/2 + 1} ${eyeY + 1.5} Q ${R_eyeX + eyeW/2 + 7} ${eyeY + 1.5} ${R_eyeX + eyeW/2 + 11} ${eyeY + 1.5}" />
          <path d="M ${R_eyeX + eyeW/2 + 1} ${eyeY + 3} Q ${R_eyeX + eyeW/2 + 6} ${eyeY + 4.5} ${R_eyeX + eyeW/2 + 9} ${eyeY + 5}" />

          <!-- Nasolabial folds -->
          <path d="M ${100 - noseW_val * 1.1} ${noseY + 2} Q ${100 - mouthW_val * 0.9} ${mouthY} ${100 - mouthW_val * 0.75} ${mouthY + 10}" />
          <path d="M ${100 + noseW_val * 1.1} ${noseY + 2} Q ${100 + mouthW_val * 0.9} ${mouthY} ${100 + mouthW_val * 0.75} ${mouthY + 10}" />

          ${age > 60 ? `
            <!-- Soft under-eye bags -->
            <path d="M ${L_eyeX - eyeW/2 + 1} ${eyeY + eyeH + 1.5} Q ${L_eyeX} ${eyeY + eyeH + 4.5} ${L_eyeX + eyeW/2 - 1} ${eyeY + eyeH + 1.5}" />
            <path d="M ${R_eyeX - eyeW/2 + 1} ${eyeY + eyeH + 1.5} Q ${R_eyeX} ${eyeY + eyeH + 4.5} ${R_eyeX + eyeW/2 - 1} ${eyeY + eyeH + 1.5}" />
          ` : ""}
        </g>
      `);
    }

    // 9. OTHER EQUIPMENT LAYERING (Dynamic engine)
    AVATAR_RENDER_ORDER.forEach(cat => {
      // Handled manually above
      if (cat === 'arriere_plans' || cat === 'corps' || cat === 'tete' || cat === 'yeux' || cat === 'bouche' || cat === 'sourcils' || cat === 'nez') return;
      if (isFemale && (cat === 'barbe' || cat === 'moustache')) return;
      
      const itemId = equippedV2[cat];
      if (itemId) {
        const item = getItem(itemId);
        if (item?.svgContent) {
          const cfg = item.engineConfig || { anchorX: 0, anchorY: 0, scaleX: 1, scaleY: 1, rotation: 0, zIndex: 0 };
          
          // Scaled offset origin for hair and cap positioning based on face height/width
          let hairYOffset = 0;
          let hairXOffset = 0;
          
          if (cat === 'cheveux' || cat === 'casquettes' || cat === 'chapeaux' || cat === 'couronnes') {
            hairYOffset = (faceHeight - 1.0) * -12;
            hairXOffset = 0;
          }

          const tx = (cfg.anchorX || 0) + hairXOffset;
          const ty = (cfg.anchorY || 0) + hairYOffset;
          const sx = (cfg.scaleX || 1) * faceWidth;
          const sy = (cfg.scaleY || 1) * faceHeight;

          layers.push(`
            <g id="layer_${cat}" transform="translate(${tx}, ${ty}) scale(${sx}, ${sy}) rotate(${cfg.rotation || 0}, 100, 100)">
              ${item.svgContent}
            </g>
          `);
        }
      }
    });

    // 10. LEGACY V1 COMPATIBILITY (Safety Rule)
    if (Object.keys(equippedV2).length === 0) {
      const getItemSvg = (id: string) => getItem(id)?.svgContent || "";
      if (configV1.clothes) layers.push(getItemSvg(configV1.clothes));
      if (configV1.visage) layers.push(getItemSvg(configV1.visage));
      if (configV1.sourcils) layers.push(getItemSvg(configV1.sourcils));
      if (configV1.nez) layers.push(getItemSvg(configV1.nez));
      if (configV1.mouth) layers.push(getItemSvg(configV1.mouth));
      if (configV1.eyes) layers.push(getItemSvg(configV1.eyes));
      if (configV1.hair) layers.push(getItemSvg(configV1.hair));
      if (configV1.couronnes) layers.push(getItemSvg(configV1.couronnes));
      (configV1.accessories || []).forEach((id: string) => layers.push(getItemSvg(id)));
    }

    const svgString = `
      <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" style="background-color: ${bgColor}; width: 100%; height: 100%;">
        ${layers.join('\n')}
      </svg>
    `;
    
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
  }
};
