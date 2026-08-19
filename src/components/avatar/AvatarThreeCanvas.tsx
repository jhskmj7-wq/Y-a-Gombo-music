import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AvatarConfig, AvatarItem } from '../../types/avatar';

interface AvatarThreeCanvasProps {
  config: AvatarConfig | any;
  size?: number;
  className?: string;
  storeItems?: AvatarItem[];
  isSaving?: boolean;
  expression?: 'neutral' | 'smile' | 'wink' | 'excited' | 'saving';
}

/**
 * AFRIGOMBO ELITE 3D MEMOJI CANVAS
 * Professional WebGL 3D Avatar Engine with Toon Shading & Precise Anchors
 */
export const AvatarThreeCanvas: React.FC<AvatarThreeCanvasProps> = ({
  config,
  size = 200,
  className = "",
  storeItems = [],
  isSaving = false,
  expression = 'neutral'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Canvas dimensions
    const width = container.clientWidth || size;
    const height = container.clientHeight || size;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 5.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    mainLight.position.set(3, 5, 4);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.6);
    fillLight.position.set(-3, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfef08a, 0.7);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // 3. Root Group
    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0, 0.15, 0);
    scene.add(avatarGroup);

    // Professional Stylized Material Creator (Bitmoji / 3D Memoji Elite quality)
    const createToonMaterial = (color: string | number | THREE.Color, roughness = 0.35, metalness = 0.05) => {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: roughness,
        metalness: metalness,
        flatShading: false
      });
    };

    // Extract Colors & Parameters
    const skinHex = config?.skinColor || "#8D5524";
    const hairHex = config?.hairColor || "#140D07";
    const eyeHex = config?.eyeColor === 'green' ? "#15803d" : (config?.eyeColor === 'blue' ? "#1d4ed8" : (config?.eyeColor === 'hazel' ? "#b45309" : "#2A180E"));
    const lipHex = config?.gender === 'female' ? (config?.lipColor || "#a84444") : "#5c3324";

    const skinMaterial = createToonMaterial(skinHex);
    const hairMaterial = createToonMaterial(hairHex);
    const eyeMaterial = createToonMaterial(eyeHex);
    const lipMaterial = createToonMaterial(lipHex);

    const faceW = Number(config?.faceWidth || 1.0);
    const faceH = Number(config?.faceHeight || 1.0);
    const bodyHeight = Number(config?.bodyHeight || 1.0);
    const shoulderWidth = Number(config?.shoulderWidth || 1.0);
    const eyesSpacingVal = Number(config?.eyesSpacing || 1.0) * 0.38;

    const equippedV2 = config?.configV2?.items || {};
    const equippedRaw = config || {};

    // 4. NECK & BODY
    const isFemale = config?.gender === 'female';
    const neckRadius = 0.42 * (isFemale ? 0.85 : 1.0) * faceW;
    const neckGeo = new THREE.CylinderGeometry(neckRadius, neckRadius * 1.15, 1.1, 32);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, -1.35, 0);
    avatarGroup.add(neckMesh);

    // Clothing Item Detection
    const clothesId = String(
      equippedV2['corps'] || equippedV2['chemise'] || equippedV2['veste'] || 
      equippedV2['habits'] || equippedV2['tee-shirt'] || equippedV2['costumes'] || 
      equippedV2['tenues_africaines'] || equippedRaw.clothes || 'clothes_elite_tshirt'
    );

    let clothesColorHex = "#ffffff";
    if (clothesId.includes('boubou') || clothesId.includes('africain') || clothesId.includes('tradition')) clothesColorHex = "#1a1a2e";
    else if (clothesId.includes('veste') || clothesId.includes('costume') || clothesId.includes('rouge')) clothesColorHex = "#991b1b";
    else if (clothesId.includes('chemise') || clothesId.includes('bleu')) clothesColorHex = "#1e3a8a";
    else if (clothesId.includes('hoodie') || clothesId.includes('noir') || clothesId.includes('sombre')) clothesColorHex = "#111827";
    else if (clothesId.includes('or') || clothesId.includes('gold') || clothesId.includes('jaune')) clothesColorHex = "#d4af37";
    else if (clothesId.includes('vert') || clothesId.includes('green')) clothesColorHex = "#15803d";

    const clothesMaterial = createToonMaterial(clothesColorHex);

    // Torso Mesh
    const torsoTopW = 1.2 * shoulderWidth;
    const torsoBotW = 1.4 * shoulderWidth;
    const torsoGeo = new THREE.CylinderGeometry(torsoTopW, torsoBotW, 1.8 * bodyHeight, 32);
    const torsoMesh = new THREE.Mesh(torsoGeo, clothesMaterial);
    torsoMesh.position.set(0, -2.55, 0);
    avatarGroup.add(torsoMesh);

    // Collar Detail
    const collarGeo = new THREE.TorusGeometry(0.58 * shoulderWidth, 0.08, 16, 32);
    const collarMesh = new THREE.Mesh(collarGeo, clothesMaterial);
    collarMesh.position.set(0, -1.72, 0.15);
    collarMesh.rotation.x = Math.PI / 2.3;
    avatarGroup.add(collarMesh);

    // 5. HEAD GROUP
    const headGroup = new THREE.Group();
    avatarGroup.add(headGroup);

    // Skull Base
    const headGeo = new THREE.SphereGeometry(1.15, 32, 32);
    headGeo.scale(faceW * 0.96, faceH * 1.1, 1.05);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.position.set(0, 0, 0);
    headGroup.add(headMesh);

    // Jaw / Chin sculpting
    const jawGeo = new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    jawGeo.scale(faceW * 1.02, faceH * 0.8, 0.95);
    const jawMesh = new THREE.Mesh(jawGeo, skinMaterial);
    jawMesh.position.set(0, -0.4, 0.2);
    headGroup.add(jawMesh);

    // 6. EARS
    const earGeo = new THREE.SphereGeometry(0.28, 16, 16);
    earGeo.scale(0.45, 1.2, 0.9);
    
    const leftEar = new THREE.Mesh(earGeo, skinMaterial);
    leftEar.position.set(-1.1 * faceW, 0.02, -0.05);
    leftEar.rotation.y = -0.15;
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, skinMaterial);
    rightEar.position.set(1.1 * faceW, 0.02, -0.05);
    rightEar.rotation.y = 0.15;
    headGroup.add(rightEar);

    // Earrings / Piercings
    const piercingId = String(equippedV2['piercing'] || equippedV2['boucles'] || equippedV2['bracelets'] || equippedRaw.piercing || '');
    if (piercingId || config?.accessories?.includes('boucles_oreilles')) {
      const earringGeo = new THREE.TorusGeometry(0.16, 0.03, 16, 32);
      const goldMat = createToonMaterial("#d4af37");

      const lEarring = new THREE.Mesh(earringGeo, goldMat);
      lEarring.position.set(-1.12 * faceW, -0.25, 0.02);
      lEarring.rotation.x = Math.PI / 2;
      headGroup.add(lEarring);

      const rEarring = new THREE.Mesh(earringGeo, goldMat);
      rEarring.position.set(1.12 * faceW, -0.25, 0.02);
      rEarring.rotation.x = Math.PI / 2;
      headGroup.add(rEarring);
    }

    // 7. EYES & EYEBROWS
    const scleraGeo = new THREE.SphereGeometry(0.19, 24, 24);
    const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const irisGeo = new THREE.SphereGeometry(0.1, 16, 16);

    const createEye = (xPos: number, isRight = false) => {
      const eye = new THREE.Group();
      const sclera = new THREE.Mesh(scleraGeo, scleraMat);
      sclera.scale.set(1, 1.22, 0.5);
      eye.add(sclera);

      const iris = new THREE.Mesh(irisGeo, eyeMaterial);
      iris.position.set(0, 0, 0.1);
      iris.scale.set(1, 1, 0.4);
      eye.add(iris);

      // Pupil highlight
      const highlightGeo = new THREE.SphereGeometry(0.03, 8, 8);
      const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const highlight = new THREE.Mesh(highlightGeo, highlightMat);
      highlight.position.set(0.03, 0.03, 0.13);
      eye.add(highlight);

      if (expression === 'wink' && isRight) {
        eye.scale.set(1, 0.1, 1);
      }

      eye.position.set(xPos, 0.2, 1.03);
      return eye;
    };

    headGroup.add(createEye(-eyesSpacingVal, false));
    headGroup.add(createEye(eyesSpacingVal, true));

    // Eyebrows
    const ebGeo = new THREE.BoxGeometry(0.38, 0.065, 0.06);
    const ebMat = createToonMaterial("#140D07");

    const leftEb = new THREE.Mesh(ebGeo, ebMat);
    leftEb.position.set(-eyesSpacingVal, 0.54, 1.08);
    leftEb.rotation.z = expression === 'excited' ? 0.18 : 0.05;
    headGroup.add(leftEb);

    const rightEb = new THREE.Mesh(ebGeo, ebMat);
    rightEb.position.set(eyesSpacingVal, 0.54, 1.08);
    rightEb.rotation.z = expression === 'excited' ? -0.18 : -0.05;
    headGroup.add(rightEb);

    // 8. NOSE
    const noseGeo = new THREE.SphereGeometry(0.15, 16, 16);
    noseGeo.scale(1.1, 1.4, 0.8);
    const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
    noseMesh.position.set(0, -0.05, 1.16);
    headGroup.add(noseMesh);

    // 9. MOUTH & LIPS
    const mouthGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16);
    mouthGeo.rotateX(Math.PI / 2);
    mouthGeo.scale(1.0, 0.5, 0.6);
    const mouthMesh = new THREE.Mesh(mouthGeo, lipMaterial);
    mouthMesh.position.set(0, -0.48, 1.05);
    headGroup.add(mouthMesh);

    if (expression === 'smile' || expression === 'excited' || expression === 'saving') {
      mouthMesh.scale.set(1.2, 0.7, 0.7);
    }

    // 10. BEARD & FACIAL HAIR
    const beardId = String(equippedV2['barbe'] || equippedV2['moustache'] || equippedRaw.barbe || equippedRaw.facialHair || '');
    if (beardId && beardId !== 'none' && beardId !== 'visage_naturel') {
      const beardMat = createToonMaterial("#140D07");
      
      if (beardId.includes('fournie') || beardId.includes('barbe')) {
        const beardGeo = new THREE.CylinderGeometry(0.9 * faceW, 0.95 * faceW, 0.7, 32, 1, true, Math.PI * 0.15, Math.PI * 0.7);
        const beardMesh = new THREE.Mesh(beardGeo, beardMat);
        beardMesh.position.set(0, -0.58, 0.4);
        headGroup.add(beardMesh);

        const chinGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const chinMesh = new THREE.Mesh(chinGeo, beardMat);
        chinMesh.position.set(0, -0.82, 0.88);
        chinMesh.scale.set(1.2, 0.8, 0.8);
        headGroup.add(chinMesh);
      } else if (beardId.includes('bouc')) {
        const boucGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.4, 16);
        const boucMesh = new THREE.Mesh(boucGeo, beardMat);
        boucMesh.position.set(0, -0.72, 0.9);
        boucMesh.scale.set(1, 0.8, 0.6);
        headGroup.add(boucMesh);
      }

      if (beardId.includes('moustache')) {
        const stacheGeo = new THREE.BoxGeometry(0.42, 0.08, 0.1);
        const stacheMesh = new THREE.Mesh(stacheGeo, beardMat);
        stacheMesh.position.set(0, -0.38, 1.12);
        headGroup.add(stacheMesh);
      }
    }

    // 11. HAIRSTYLES & HEADWEAR (FITTED Snugly OVER THE SKULL)
    const hairId = String(
      equippedV2['cheveux'] || equippedV2['couronnes'] || equippedV2['chapeaux'] || 
      equippedV2['coiffure'] || equippedV2['casquettes'] || equippedRaw.cheveux || 'hair_elite_afro_short'
    );

    if (hairId.includes('afro_volumineux') || hairId.includes('puff') || hairId.includes('boucle')) {
      const afroGeo = new THREE.SphereGeometry(1.3 * faceW, 32, 32);
      const afroMesh = new THREE.Mesh(afroGeo, hairMaterial);
      afroMesh.position.set(0, 0.38 * faceH, -0.1);
      headGroup.add(afroMesh);
    } else if (hairId.includes('locks') || hairId.includes('nattes') || hairId.includes('braids') || hairId.includes('dreads')) {
      const dreadsGroup = new THREE.Group();
      // Crown cap
      const baseCap = new THREE.SphereGeometry(1.18 * faceW, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
      dreadsGroup.add(new THREE.Mesh(baseCap, hairMaterial));

      // Hanging dreads
      for (let i = 0; i < 12; i++) {
        const dGeo = new THREE.CylinderGeometry(0.065, 0.065, 1.4, 12);
        const dMesh = new THREE.Mesh(dGeo, hairMaterial);
        const angle = (i / 12) * Math.PI * 2;
        dMesh.position.set(Math.cos(angle) * 0.92 * faceW, 0.15 + Math.sin(angle) * 0.1, Math.sin(angle) * 0.92 - 0.1);
        dMesh.rotation.z = (Math.random() - 0.5) * 0.25;
        dreadsGroup.add(dMesh);
      }
      headGroup.add(dreadsGroup);
    } else if (hairId.includes('gele') || hairId.includes('turban')) {
      const turbanGeo = new THREE.TorusGeometry(1.08 * faceW, 0.32, 16, 32);
      const turbanMat = createToonMaterial("#991b1b");
      const turbanMesh = new THREE.Mesh(turbanGeo, turbanMat);
      turbanMesh.position.set(0, 0.65 * faceH, 0.05);
      turbanMesh.rotation.x = Math.PI / 2.3;
      headGroup.add(turbanMesh);
    } else if (hairId.includes('couronne') || hairId.includes('crown')) {
      const crownGeo = new THREE.TorusGeometry(1.02 * faceW, 0.15, 16, 32);
      const goldMat = createToonMaterial("#d4af37");
      const crownMesh = new THREE.Mesh(crownGeo, goldMat);
      crownMesh.position.set(0, 0.78 * faceH, 0);
      crownMesh.rotation.x = Math.PI / 2.2;
      headGroup.add(crownMesh);
    } else if (hairId.includes('casquette') || hairId.includes('chapeau') || hairId.includes('cap')) {
      const hatGeo = new THREE.CylinderGeometry(1.12 * faceW, 1.18 * faceW, 0.6, 32);
      const hatMat = createToonMaterial("#1f2937");
      const hatMesh = new THREE.Mesh(hatGeo, hatMat);
      hatMesh.position.set(0, 0.72 * faceH, 0.05);
      hatMesh.rotation.x = 0.08;
      headGroup.add(hatMesh);

      // Visor
      const visorGeo = new THREE.CylinderGeometry(1.22 * faceW, 1.25 * faceW, 0.06, 16, 1, false, Math.PI * 0.2, Math.PI * 0.6);
      const visorMesh = new THREE.Mesh(visorGeo, hatMat);
      visorMesh.position.set(0, 0.45 * faceH, 0.5);
      headGroup.add(visorMesh);
    } else {
      // Default fitted short hair helmet on skull top/back
      const shortHairGeo = new THREE.SphereGeometry(1.18 * faceW, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.58);
      const shortHairMesh = new THREE.Mesh(shortHairGeo, hairMaterial);
      shortHairMesh.position.set(0, 0.1 * faceH, -0.05);
      headGroup.add(shortHairMesh);
    }

    // 12. GLASSES
    const glassesId = String(equippedV2['lunettes'] || equippedRaw.lunettes || '');
    if (glassesId && glassesId !== 'none') {
      const glassMat = createToonMaterial("#d4af37");
      const frameGeo = new THREE.TorusGeometry(0.28, 0.035, 16, 32);
      
      const lGlass = new THREE.Mesh(frameGeo, glassMat);
      lGlass.position.set(-eyesSpacingVal, 0.2, 1.15);
      headGroup.add(lGlass);

      const rGlass = new THREE.Mesh(frameGeo, glassMat);
      rGlass.position.set(eyesSpacingVal, 0.2, 1.15);
      headGroup.add(rGlass);

      const bridgeGeo = new THREE.BoxGeometry(eyesSpacingVal * 2, 0.03, 0.03);
      const bridge = new THREE.Mesh(bridgeGeo, glassMat);
      bridge.position.set(0, 0.22, 1.15);
      headGroup.add(bridge);
    }

    // 13. Animation Loop (Memoji Subtle Breathing)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Memoji natural motion
      avatarGroup.position.y = 0.15 + Math.sin(elapsedTime * 2.2) * 0.03;
      avatarGroup.rotation.y = Math.sin(elapsedTime * 0.9) * 0.18;
      headGroup.rotation.x = Math.sin(elapsedTime * 1.4) * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    // 14. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || size;
      const h = container.clientHeight || size;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [config, size, expression]);

  return (
    <div 
      ref={mountRef} 
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default AvatarThreeCanvas;
