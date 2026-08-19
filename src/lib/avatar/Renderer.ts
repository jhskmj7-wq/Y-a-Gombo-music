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
 * AFRIGOMBO ELITE - PROFESSIONAL 3D STYLIZED SVG EXPORT RENDERER
 * Renders 3D-stylized vector avatars with volumetric melanin shaders and full African identity.
 */
export const AvatarRenderer = {
  /**
   * Generates a high-quality SVG data URI for the Elite Avatar engine
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

    // Face Structure parameters
    const faceWidth = configV1?.faceWidth !== undefined ? Number(configV1.faceWidth) : 1.0;
    const faceHeight = configV1?.faceHeight !== undefined ? Number(configV1.faceHeight) : 1.0;
    const foreheadWidth = configV1?.foreheadWidth !== undefined ? Number(configV1.foreheadWidth) : 1.0;
    const cheekWidth = configV1?.cheekWidth !== undefined ? Number(configV1.cheekWidth) : 1.0;
    const jawWidth = configV1?.jawWidth !== undefined ? Number(configV1.jawWidth) : (configV1?.jawShape !== undefined ? Number(configV1.jawShape) : 0.5);
    const jawHeight = configV1?.jawHeight !== undefined ? Number(configV1.jawHeight) : 1.0;
    const chinWidth = configV1?.chinWidth !== undefined ? Number(configV1.chinWidth) : 1.0;
    const chinHeight = configV1?.chinHeight !== undefined ? Number(configV1.chinHeight) : 1.0;

    // Eyes & Eyebrows parameters
    const eyesHeight = configV1?.eyesHeight !== undefined ? Number(configV1.eyesHeight) : 1.0;
    const eyesWidth = configV1?.eyesWidth !== undefined ? Number(configV1.eyesWidth) : (configV1?.eyeWidth !== undefined ? Number(configV1.eyeWidth) : 1.0);
    const eyesSpacing = configV1?.eyesSpacing !== undefined ? Number(configV1.eyesSpacing) : (configV1?.eyeSpacing !== undefined ? Number(configV1.eyeSpacing) : 1.0);
    const eyeSize = configV1?.eyeSize !== undefined ? Number(configV1.eyeSize) : 1.0;
    const eyeTilt = configV1?.eyeTilt !== undefined ? Number(configV1.eyeTilt) : 0;
    const eyeHeightPosition = configV1?.eyeHeightPosition !== undefined ? Number(configV1.eyeHeightPosition) : 1.0;
    const irisSize = configV1?.irisSize !== undefined ? Number(configV1.irisSize) : 4.4;

    const eyebrowsPosition = configV1?.eyebrowsPosition !== undefined ? Number(configV1.eyebrowsPosition) : 1.0;
    const eyebrowWidth = configV1?.eyebrowWidth !== undefined ? Number(configV1.eyebrowWidth) : 1.0;
    const eyebrowThickness = configV1?.eyebrowThickness !== undefined ? Number(configV1.eyebrowThickness) : 1.0;
    const eyebrowAngle = configV1?.eyebrowAngle !== undefined ? Number(configV1.eyebrowAngle) : 0;
    const eyebrowHeight = configV1?.eyebrowHeight !== undefined ? Number(configV1.eyebrowHeight) : 1.0;

    // Nose parameters
    const noseHeight = configV1?.noseHeight !== undefined ? Number(configV1.noseHeight) : 1.0;
    const noseWidth = configV1?.noseWidth !== undefined ? Number(configV1.noseWidth) : 1.0;
    const noseTipWidth = configV1?.noseTipWidth !== undefined ? Number(configV1.noseTipWidth) : 1.0;
    const noseTipHeight = configV1?.noseTipHeight !== undefined ? Number(configV1.noseTipHeight) : 1.0;
    const nostrilWidth = configV1?.nostrilWidth !== undefined ? Number(configV1.nostrilWidth) : 1.0;
    const noseBridgeWidth = configV1?.noseBridgeWidth !== undefined ? Number(configV1.noseBridgeWidth) : 1.0;

    // Mouth parameters
    const mouthWidth = configV1?.mouthWidth !== undefined ? Number(configV1.mouthWidth) : 1.0;
    const mouthThickness = configV1?.mouthThickness !== undefined ? Number(configV1.mouthThickness) : 1.0;
    const upperLipThickness = configV1?.upperLipThickness !== undefined ? Number(configV1.upperLipThickness) : 1.0;
    const lowerLipThickness = configV1?.lowerLipThickness !== undefined ? Number(configV1.lowerLipThickness) : 1.0;
    const mouthHeight = configV1?.mouthHeight !== undefined ? Number(configV1.mouthHeight) : 1.0;
    const mouthCornerAngle = configV1?.mouthCornerAngle !== undefined ? Number(configV1.mouthCornerAngle) : 0;

    // Ears parameters
    const earsShape = configV1?.earsShape || 'standard';
    const earSize = configV1?.earSize !== undefined ? Number(configV1.earSize) : 1.0;
    const earAngle = configV1?.earAngle !== undefined ? Number(configV1.earAngle) : 0;
    const earPosition = configV1?.earPosition !== undefined ? Number(configV1.earPosition) : 1.0;

    // Hair parameters
    const hairline = configV1?.hairline !== undefined ? Number(configV1.hairline) : (configV1?.hairlineHeight !== undefined ? Number(configV1.hairlineHeight) : 1.0);

    // Body parameters
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

    // 3D Melanin Shader Color Mathematics
    const cleanColorHex = skinColor.replace('#', '');
    const skinR = parseInt(cleanColorHex.substring(0, 2), 16) || 141;
    const skinG = parseInt(cleanColorHex.substring(2, 4), 16) || 85;
    const skinB = parseInt(cleanColorHex.substring(4, 6), 16) || 36;

    const hlR = Math.min(255, Math.floor(skinR * 1.35 + 30));
    const hlG = Math.min(255, Math.floor(skinG * 1.3 + 20));
    const hlB = Math.min(255, Math.floor(skinB * 1.25 + 15));
    const skinHighlight = `#${hlR.toString(16).padStart(2, '0')}${hlG.toString(16).padStart(2, '0')}${hlB.toString(16).padStart(2, '0')}`;

    const subR = Math.min(255, Math.floor(skinR * 1.15 + 15));
    const subG = Math.min(255, Math.floor(skinG * 1.05 + 8));
    const subB = Math.min(255, Math.floor(skinB * 0.95));
    const skinSubsurface = `#${subR.toString(16).padStart(2, '0')}${subG.toString(16).padStart(2, '0')}${subB.toString(16).padStart(2, '0')}`;

    const shR = Math.max(0, Math.floor(skinR * 0.65 - 8));
    const shG = Math.max(0, Math.floor(skinG * 0.65 - 8));
    const shB = Math.max(0, Math.floor(skinB * 0.6 - 8));
    const skinShadow = `#${shR.toString(16).padStart(2, '0')}${shG.toString(16).padStart(2, '0')}${shB.toString(16).padStart(2, '0')}`;

    const aoR = Math.max(0, Math.floor(skinR * 0.42 - 12));
    const aoG = Math.max(0, Math.floor(skinG * 0.42 - 12));
    const aoB = Math.max(0, Math.floor(skinB * 0.38 - 10));
    const skinDeepShadow = `#${aoR.toString(16).padStart(2, '0')}${aoG.toString(16).padStart(2, '0')}${aoB.toString(16).padStart(2, '0')}`;

    const gradIdFace = `melaninFace3D_${cleanColorHex}`;
    const gradIdNeck = `melaninNeck3D_${cleanColorHex}`;
    const cheekGradId = `cheekHighlight3D_${cleanColorHex}`;

    // Define SVG gradients for 3D depth rendering
    const gradientsDefs = `
      <defs>
        <radialGradient id="${gradIdFace}" cx="42%" cy="32%" r="68%" fx="36%" fx2="26%">
          <stop offset="0%" stop-color="${skinHighlight}" />
          <stop offset="30%" stop-color="${skinSubsurface}" />
          <stop offset="70%" stop-color="${skinColor}" />
          <stop offset="90%" stop-color="${skinShadow}" />
          <stop offset="100%" stop-color="${skinDeepShadow}" />
        </radialGradient>
        <radialGradient id="${cheekGradId}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${skinHighlight}" stop-opacity="0.4" />
          <stop offset="100%" stop-color="${skinSubsurface}" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="${gradIdNeck}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${skinDeepShadow}" />
          <stop offset="35%" stop-color="${skinShadow}" />
          <stop offset="85%" stop-color="${skinColor}" />
          <stop offset="100%" stop-color="${skinDeepShadow}" />
        </linearGradient>
        <radialGradient id="scleraGrad3D" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="75%" stop-color="#F0F4F8" />
          <stop offset="100%" stop-color="#D9E1E8" />
        </radialGradient>
        <linearGradient id="goldAfrican3D" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFF2A1" />
          <stop offset="30%" stop-color="#F5D061" />
          <stop offset="70%" stop-color="#D4AF37" />
          <stop offset="100%" stop-color="#8F6D17" />
        </linearGradient>
        <linearGradient id="lipGlossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
        </linearGradient>
      </defs>
    `;

    layers.push(gradientsDefs);

    // 2. ELITE BASE CHARACTER BODY
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
          <ellipse cx="100" cy="142" rx="30" ry="8" fill="black" opacity="0.16" />
          <path d="${bodyPath}" fill="url(#${gradIdNeck})" />
          <path d="${neckPath}" fill="url(#${gradIdNeck})" />
          <path d="M ${100 - neckW_val} ${neckY1 + 1} Q 100 ${neckY1 + 9} ${100 + neckW_val} ${neckY1 + 1}" stroke="${skinDeepShadow}" stroke-width="2.2" fill="none" opacity="0.5" />
          <path d="M 52 148 Q 78 153 96 145" stroke="${skinHighlight}" stroke-width="1.2" fill="none" opacity="0.25" />
          <path d="M 148 148 Q 122 153 104 145" stroke="${skinHighlight}" stroke-width="1.2" fill="none" opacity="0.25" />
        </g>
      `);
    } else {
      layers.push(getItem(equippedV2['corps'])?.svgContent || "");
    }

    // 3. HEAD & EARS
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
        leftEarPath = `M ${100 - halfW} ${earY - earH_val * 0.8} 
          C ${100 - halfW - earW * 0.9} ${earY - earH_val * 1.1}, ${100 - halfW - earW * 1.1} ${earY + earH_val * 0.8}, ${100 - halfW} ${earY + earH_val * 1.2} 
          C ${100 - halfW - earW * 0.3} ${earY + earH_val * 0.9}, ${100 - halfW - earW * 0.2} ${earY - earH_val * 0.5}, ${100 - halfW} ${earY - earH_val * 0.8} Z`;
        rightEarPath = `M ${100 + halfW} ${earY - earH_val * 0.8} 
          C ${100 + halfW + earW * 0.9} ${earY - earH_val * 1.1}, ${100 + halfW + earW * 1.1} ${earY + earH_val * 0.8}, ${100 + halfW} ${earY + earH_val * 1.2} 
          C ${100 + halfW + earW * 0.3} ${earY + earH_val * 0.9}, ${100 + halfW + earW * 0.2} ${earY - earH_val * 0.5}, ${100 + halfW} ${earY - earH_val * 0.8} Z`;
      }

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
          <g transform="rotate(${earRotL}, ${100 - halfW}, ${earY})">
            <path d="${leftEarPath}" fill="url(#${gradIdFace})" />
            <path d="${leftEarPath}" stroke="${skinDeepShadow}" stroke-width="1.0" fill="none" opacity="0.4" />
          </g>
          <g transform="rotate(${earRotR}, ${100 + halfW}, ${earY})">
            <path d="${rightEarPath}" fill="url(#${gradIdFace})" />
            <path d="${rightEarPath}" stroke="${skinDeepShadow}" stroke-width="1.0" fill="none" opacity="0.4" />
          </g>
          <path d="${facePath}" fill="url(#${gradIdFace})" />
          <path d="${facePath}" fill="none" stroke="${skinDeepShadow}" stroke-width="0.8" opacity="0.2" />
          <ellipse cx="${100 - halfCheekW * 0.55}" cy="${cheekY + 2}" rx="15" ry="10" fill="url(#${cheekGradId})" />
          <ellipse cx="${100 + halfCheekW * 0.55}" cy="${cheekY + 2}" rx="15" ry="10" fill="url(#${cheekGradId})" />
          <ellipse cx="100" cy="${foreheadY + 16}" rx="${halfFw * 0.45}" ry="8" fill="${skinHighlight}" opacity="0.32" />
        </g>
      `);
    } else {
      layers.push(getItem(equippedV2['tete'])?.svgContent || "");
    }

    // 4. EYES
    const hasCustomEyes = equippedV2['yeux'] && !FREE_ITEM_IDS.includes(equippedV2['yeux']);
    if (!hasCustomEyes) {
      const eyeY = 76 + 6 * faceHeight * eyeHeightPosition;
      const eyeSpacingOffset = (isFemale ? 14 : 15) * eyesSpacing;
      const eyeW = (isFemale ? 15 : 16) * eyesWidth * eyeSize;
      const eyeH = (isFemale ? 5.8 : 6.2) * (eyesWidth * 0.4 + 0.6) * eyeSize;
      
      const L_eyeX = 100 - eyeSpacingOffset;
      const R_eyeX = 100 + eyeSpacingOffset;

      const eyelashesLeft = isFemale ? `
        <path d="M ${L_eyeX - eyeW/2 - 2} ${eyeY} C ${L_eyeX - eyeW/4} ${eyeY - eyeH - 2.5} ${L_eyeX + eyeW/4} ${eyeY - eyeH - 3} ${L_eyeX + eyeW/2 + 2} ${eyeY - 0.5}" stroke="#111111" stroke-width="2.8" stroke-linecap="round" fill="none" />
        <path d="M ${L_eyeX - eyeW/3} ${eyeY - eyeH * 0.8} Q ${L_eyeX - eyeW/2 - 4} ${eyeY - eyeH - 5} ${L_eyeX - eyeW/2 - 6} ${eyeY - eyeH - 7}" stroke="#111111" stroke-width="1.4" stroke-linecap="round" fill="none" />
      ` : `
        <path d="M ${L_eyeX - eyeW/2 - 1} ${eyeY} Q ${L_eyeX} ${eyeY - eyeH - 1.2} ${L_eyeX + eyeW/2 + 1} ${eyeY}" stroke="#111111" stroke-width="2.0" stroke-linecap="round" fill="none" />
      `;

      const eyelashesRight = isFemale ? `
        <path d="M ${R_eyeX - eyeW/2 - 2} ${eyeY - 0.5} C ${R_eyeX - eyeW/4} ${eyeY - eyeH - 3} ${R_eyeX + eyeW/4} ${eyeY - eyeH - 2.5} ${R_eyeX + eyeW/2 + 2} ${eyeY}" stroke="#111111" stroke-width="2.8" stroke-linecap="round" fill="none" />
        <path d="M ${R_eyeX + eyeW/3} ${eyeY - eyeH * 0.8} Q ${R_eyeX + eyeW/2 + 4} ${eyeY - eyeH - 5} ${R_eyeX + eyeW/2 + 6} ${eyeY - eyeH - 7}" stroke="#111111" stroke-width="1.4" stroke-linecap="round" fill="none" />
      ` : `
        <path d="M ${R_eyeX - eyeW/2 - 1} ${eyeY} Q ${R_eyeX} ${eyeY - eyeH - 1.2} ${R_eyeX + eyeW/2 + 1} ${eyeY}" stroke="#111111" stroke-width="2.0" stroke-linecap="round" fill="none" />
      `;

      const leftEyePath = `M ${L_eyeX - eyeW/2} ${eyeY} 
        C ${L_eyeX - eyeW/3} ${eyeY - eyeH}, ${L_eyeX + eyeW/3} ${eyeY - eyeH * 0.95}, ${L_eyeX + eyeW/2} ${eyeY} 
        C ${L_eyeX + eyeW/3} ${eyeY + eyeH * 0.95}, ${L_eyeX - eyeW/3} ${eyeY + eyeH}, ${L_eyeX - eyeW/2} ${eyeY} Z`;

      const rightEyePath = `M ${R_eyeX - eyeW/2} ${eyeY} 
        C ${R_eyeX - eyeW/3} ${eyeY - eyeH * 0.95}, ${R_eyeX + eyeW/3} ${eyeY - eyeH}, ${R_eyeX + eyeW/2} ${eyeY} 
        C ${R_eyeX + eyeW/3} ${eyeY + eyeH}, ${R_eyeX - eyeW/3} ${eyeY + eyeH * 0.95}, ${R_eyeX - eyeW/2} ${eyeY} Z`;

      layers.push(`
        <g id="elite_eyes_base">
          <g transform="rotate(${eyeTilt}, ${L_eyeX}, ${eyeY})">
            <path d="${leftEyePath}" fill="url(#scleraGrad3D)" />
            <path d="${leftEyePath}" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" />
            <path d="M ${L_eyeX - eyeW/2} ${eyeY - eyeH * 0.4} Q ${L_eyeX} ${eyeY - eyeH * 0.9} ${L_eyeX + eyeW/2} ${eyeY - eyeH * 0.4} Z" fill="rgba(0,0,0,0.14)" />
            <circle cx="${L_eyeX}" cy="${eyeY}" r="${irisSize}" fill="#4A2F22" />
            <circle cx="${L_eyeX}" cy="${eyeY}" r="${irisSize * 0.86}" fill="#27150C" />
            <circle cx="${L_eyeX}" cy="${eyeY}" r="${irisSize * 0.45}" fill="#080403" />
            <circle cx="${L_eyeX - irisSize * 0.35}" cy="${eyeY - irisSize * 0.35}" r="1.6" fill="#FFFFFF" />
            <circle cx="${L_eyeX + irisSize * 0.35}" cy="${eyeY + irisSize * 0.35}" r="0.9" fill="#FFFFFF" opacity="0.8" />
            ${eyelashesLeft}
            <path d="M ${L_eyeX - eyeW * 0.58} ${eyeY - eyeH - 1.8} Q ${L_eyeX} ${eyeY - eyeH - 4.8} ${L_eyeX + eyeW * 0.48} ${eyeY - eyeH - 2.5}" stroke="rgba(0,0,0,0.32)" stroke-width="1.5" stroke-linecap="round" fill="none" />
          </g>
          <g transform="rotate(${-eyeTilt}, ${R_eyeX}, ${eyeY})">
            <path d="${rightEyePath}" fill="url(#scleraGrad3D)" />
            <path d="${rightEyePath}" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" />
            <path d="M ${R_eyeX - eyeW/2} ${eyeY - eyeH * 0.4} Q ${R_eyeX} ${eyeY - eyeH * 0.9} ${R_eyeX + eyeW/2} ${eyeY - eyeH * 0.4} Z" fill="rgba(0,0,0,0.14)" />
            <circle cx="${R_eyeX}" cy="${eyeY}" r="${irisSize}" fill="#4A2F22" />
            <circle cx="${R_eyeX}" cy="${eyeY}" r="${irisSize * 0.86}" fill="#27150C" />
            <circle cx="${R_eyeX}" cy="${eyeY}" r="${irisSize * 0.45}" fill="#080403" />
            <circle cx="${R_eyeX - irisSize * 0.35}" cy="${eyeY - irisSize * 0.35}" r="1.6" fill="#FFFFFF" />
            <circle cx="${R_eyeX + irisSize * 0.35}" cy="${eyeY + irisSize * 0.35}" r="0.9" fill="#FFFFFF" opacity="0.8" />
            ${eyelashesRight}
            <path d="M ${R_eyeX - eyeW * 0.48} ${eyeY - eyeH - 2.5} Q ${R_eyeX} ${eyeY - eyeH - 4.8} ${R_eyeX + eyeW * 0.58} ${eyeY - eyeH - 1.8}" stroke="rgba(0,0,0,0.32)" stroke-width="1.5" stroke-linecap="round" fill="none" />
          </g>
        </g>
      `);
    } else {
      layers.push(getItem(equippedV2['yeux'])?.svgContent || "");
    }

    // 5. EYEBROWS
    const hasCustomEyebrows = equippedV2['sourcils'] && !FREE_ITEM_IDS.includes(equippedV2['sourcils']);
    if (!hasCustomEyebrows) {
      const eyeY = 76 + 6 * faceHeight * eyeHeightPosition;
      const eyeSpacingOffset = (isFemale ? 14 : 15) * eyesSpacing;
      const eyeW = (isFemale ? 15 : 16) * eyesWidth * eyeSize;
      const L_eyeX = 100 - eyeSpacingOffset;
      const R_eyeX = 100 + eyeSpacingOffset;

      const eyebrowY = eyeY - 8 * faceHeight * eyebrowsPosition;
      const eb_w = eyeW * 1.08 * eyebrowWidth;
      const sOpacity = equippedV2['sourcils'] === "sourcils_sculptes" ? 0.95 : 0.88;

      const leftEyebrowPath = `M ${L_eyeX - eb_w * 0.55} ${eyebrowY + 1} 
        Q ${L_eyeX - eb_w * 0.05} ${eyebrowY - 4.5 - (eyebrowHeight - 1) * 3} ${L_eyeX + eb_w * 0.5} ${eyebrowY + 1.5} 
        Q ${L_eyeX} ${eyebrowY - 2.5 - (eyebrowHeight - 1) * 2} ${L_eyeX - eb_w * 0.5} ${eyebrowY + 0.8} Z`;

      const rightEyebrowPath = `M ${R_eyeX - eb_w * 0.5} ${eyebrowY + 1.5} 
        Q ${R_eyeX + eb_w * 0.05} ${eyebrowY - 4.5 - (eyebrowHeight - 1) * 3} ${R_eyeX + eb_w * 0.55} ${eyebrowY + 1} 
        Q ${R_eyeX} ${eyebrowY - 2.5 - (eyebrowHeight - 1) * 2} ${R_eyeX - eb_w * 0.5} ${eyebrowY + 0.8} Z`;

      layers.push(`
        <g id="elite_eyebrows_base" fill="#111111" opacity="${sOpacity}">
          <g transform="rotate(${-eyebrowAngle}, ${L_eyeX}, ${eyebrowY})">
            <path d="${leftEyebrowPath}" />
          </g>
          <g transform="rotate(${eyebrowAngle}, ${R_eyeX}, ${eyebrowY})">
            <path d="${rightEyebrowPath}" />
          </g>
        </g>
      `);
    } else {
      layers.push(getItem(equippedV2['sourcils'])?.svgContent || "");
    }

    // 6. NOSE
    const noseY = 76 + 24 * faceHeight * noseHeight;
    const noseW_val = 5 * noseWidth;
    const bridgeTopY = 76 + 6 * faceHeight * eyeHeightPosition;

    layers.push(`
      <g id="elite_nose_base">
        <path d="M 97.5 ${bridgeTopY} L ${100 - 1.5 * noseBridgeWidth} ${noseY - 4}" stroke="${skinDeepShadow}" stroke-width="1.8" fill="none" opacity="0.25" />
        <path d="M 101.5 ${bridgeTopY} L ${100 + 1.5 * noseBridgeWidth} ${noseY - 4}" stroke="${skinHighlight}" stroke-width="1.4" fill="none" opacity="0.35" />
        <ellipse cx="100" cy="${noseY}" rx="${3.2 * noseTipWidth * noseWidth}" ry="${2.4 * noseTipHeight}" fill="${skinDeepShadow}" opacity="0.18" />
        <ellipse cx="99.2" cy="${noseY - 0.8}" rx="${1.8 * noseTipWidth * noseWidth}" ry="1.2" fill="${skinHighlight}" opacity="0.45" />
        <path d="M ${100 - noseW_val * 1.4 * nostrilWidth} ${noseY + 0.5} Q ${100 - noseW_val * 0.8} ${noseY - 2.0} 100 ${noseY + 0.2}" stroke="${skinDeepShadow}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6" />
        <path d="M ${100 + noseW_val * 1.4 * nostrilWidth} ${noseY + 0.5} Q ${100 + noseW_val * 0.8} ${noseY - 2.0} 100 ${noseY + 0.2}" stroke="${skinDeepShadow}" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6" />
        <path d="M ${100 - noseW_val * 1.1} ${noseY + 1} Q 100 ${noseY + 3.5} ${100 + noseW_val * 1.1} ${noseY + 1}" stroke="#1A0D06" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.75" />
      </g>
    `);

    // 7. MOUTH / LIPS
    const hasCustomMouth = equippedV2['bouche'] && !FREE_ITEM_IDS.includes(equippedV2['bouche']);
    if (!hasCustomMouth) {
      const mouthY = noseY + 16 * faceHeight + 4 * mouthThickness * mouthHeight;
      const mouthW_val = (isFemale ? 13.5 : 14.5) * mouthWidth;
      const lipThicknessTop = (isFemale ? 4.5 : 3.8) * mouthThickness * upperLipThickness;
      const lipThicknessBottom = (isFemale ? 4.8 : 4.0) * mouthThickness * lowerLipThickness;
      const cornerY = mouthCornerAngle;
      
      const lipToneTop = isFemale ? "rgba(165,42,42,0.48)" : "rgba(80,30,15,0.38)";
      const lipToneBottom = isFemale ? "rgba(195,65,65,0.42)" : "rgba(100,40,20,0.28)";

      const isSourire = equippedV2['bouche'] !== "mouth_elite_neutre";
      const topLipPath = isSourire 
        ? `M ${100 - mouthW_val} ${mouthY + cornerY} 
           Q ${100 - mouthW_val * 0.45} ${mouthY - lipThicknessTop * 1.25} 100 ${mouthY - lipThicknessTop * 0.5} 
           Q ${100 + mouthW_val * 0.45} ${mouthY - lipThicknessTop * 1.25} ${100 + mouthW_val} ${mouthY + cornerY} 
           Q 100 ${mouthY + 0.2} ${100 - mouthW_val} ${mouthY + cornerY} Z`
        : `M ${100 - mouthW_val} ${mouthY + cornerY} 
           Q ${100 - mouthW_val * 0.45} ${mouthY - lipThicknessTop * 0.9} 100 ${mouthY - lipThicknessTop * 0.3} 
           Q ${100 + mouthW_val * 0.45} ${mouthY - lipThicknessTop * 0.9} ${100 + mouthW_val} ${mouthY + cornerY} 
           Q 100 ${mouthY + 0.2} ${100 - mouthW_val} ${mouthY + cornerY} Z`;

      const bottomLipPath = isSourire
        ? `M ${100 - mouthW_val} ${mouthY + cornerY} 
           Q 100 ${mouthY + lipThicknessBottom * 1.35} ${100 + mouthW_val} ${mouthY + cornerY} 
           Q 100 ${mouthY + 0.5} ${100 - mouthW_val} ${mouthY + cornerY} Z`
        : `M ${100 - mouthW_val} ${mouthY + cornerY} 
           Q 100 ${mouthY + lipThicknessBottom * 1.1} ${100 + mouthW_val} ${mouthY + cornerY} 
           Q 100 ${mouthY + 0.5} ${100 - mouthW_val} ${mouthY + cornerY} Z`;

      const lipLine = isSourire
        ? `M ${100 - mouthW_val + 0.8} ${mouthY + cornerY} Q 100 ${mouthY + cornerY * 0.5 + 1.2} ${100 + mouthW_val - 0.8} ${mouthY + cornerY}`
        : `M ${100 - mouthW_val + 0.8} ${mouthY + cornerY} L ${100 + mouthW_val - 0.8} ${mouthY + cornerY}`;

      layers.push(`
        <g id="elite_mouth_base">
          <path d="${topLipPath}" fill="${lipToneTop}" />
          <path d="${bottomLipPath}" fill="${lipToneBottom}" />
          <ellipse cx="100" cy="${mouthY + lipThicknessBottom * 0.5}" rx="${mouthW_val * 0.38}" ry="1.2" fill="url(#lipGlossGrad)" />
          <path d="M ${100 - mouthW_val * 0.8} ${mouthY + lipThicknessBottom + 2} Q 100 ${mouthY + lipThicknessBottom + 5.5} ${100 + mouthW_val * 0.8} ${mouthY + lipThicknessBottom + 2}" stroke="${skinDeepShadow}" stroke-width="1.5" fill="none" opacity="0.3" />
          <path d="${lipLine}" stroke="#211005" stroke-width="2.0" stroke-linecap="round" fill="none" opacity="0.9" />
        </g>
      `);
    } else {
      layers.push(getItem(equippedV2['bouche'])?.svgContent || "");
    }

    // 8. OTHER EQUIPMENT LAYERING
    AVATAR_RENDER_ORDER.forEach(cat => {
      if (cat === 'arriere_plans' || cat === 'corps' || cat === 'tete' || cat === 'yeux' || cat === 'bouche' || cat === 'sourcils' || cat === 'nez') return;
      if (isFemale && (cat === 'barbe' || cat === 'moustache')) return;
      
      const itemId = equippedV2[cat];
      if (itemId) {
        const item = getItem(itemId);
        if (item?.svgContent) {
          const cfg = item.engineConfig || { anchorX: 0, anchorY: 0, scaleX: 1, scaleY: 1, rotation: 0, zIndex: 0 };
          
          let hairYOffset = 0;
          let hairXOffset = 0;
          
          if (['cheveux', 'casquettes', 'chapeaux', 'couronnes', 'hair', 'chapeau', 'casquette', 'headwear'].includes(cat)) {
            hairYOffset = -15 + (faceHeight - 1.0) * -12;
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

    // 9. LEGACY V1 COMPATIBILITY
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
