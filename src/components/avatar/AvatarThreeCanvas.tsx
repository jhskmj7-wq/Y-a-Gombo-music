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

    // Dimensions
    const width = container.clientWidth || size;
    const height = container.clientHeight || size;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting (Toon/Memoji Style)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(3, 5, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xfff2a1, 0.6);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    const underLight = new THREE.PointLight(0xffd700, 0.4, 10);
    underLight.position.set(0, -3, 2);
    scene.add(underLight);

    // Avatar Root Group
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // Skin Color Setup
    const skinHex = config?.skinColor || "#8D5524";
    const skinColorObj = new THREE.Color(skinHex);

    // Toon / Stylized Shader Material helper
    const createToonMaterial = (color: string | number | THREE.Color, roughness = 0.3) => {
      return new THREE.MeshToonMaterial({
        color: color,
        gradientMap: null
      });
    };

    const skinMaterial = createToonMaterial(skinColorObj);

    // 1. BODY & NECK 3D MESH
    const isFemale = config?.gender === 'female';
    const bodyHeight = Number(config?.bodyHeight || 1.0);
    const shoulderWidth = Number(config?.shoulderWidth || 1.0);

    const neckGeo = new THREE.CylinderGeometry(0.55 * (isFemale ? 0.9 : 1.0), 0.75 * (isFemale ? 0.9 : 1.0), 1.2, 32);
    const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
    neckMesh.position.set(0, -1.55, 0);
    avatarGroup.add(neckMesh);

    // Torso / Clothing 3D Mesh
    const equippedV2 = config?.configV2?.items || {};
    const clothesId = equippedV2['corps'] || equippedV2['chemise'] || equippedV2['veste'] || 'clothes_elite_tshirt_blanc';
    
    let clothesColor = new THREE.Color(0xffffff);
    if (clothesId.includes('boubou')) clothesColor.set(0x1a1a2e);
    else if (clothesId.includes('veste')) clothesColor.set(0xa02020);
    else if (clothesId.includes('chemise')) clothesColor.set(0x1e3a8a);
    else if (clothesId.includes('hoodie')) clothesColor.set(0x111827);

    const clothesMaterial = createToonMaterial(clothesColor);
    const torsoGeo = new THREE.CylinderGeometry(1.2 * shoulderWidth, 1.4 * shoulderWidth, 1.8 * bodyHeight, 32);
    const torsoMesh = new THREE.Mesh(torsoGeo, clothesMaterial);
    torsoMesh.position.set(0, -2.8, 0);
    avatarGroup.add(torsoMesh);

    // 2. HEAD 3D MESH (Stunning Memoji Oval Shape)
    const faceW = Number(config?.faceWidth || 1.0);
    const faceH = Number(config?.faceHeight || 1.0);
    const headGeo = new THREE.SphereGeometry(1.2, 32, 32);
    headGeo.scale(faceW * 0.95, faceH * 1.15, 1.05);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.position.set(0, 0, 0);
    avatarGroup.add(headMesh);

    // 3. EARS 3D
    const earGeo = new THREE.SphereGeometry(0.32, 16, 16);
    earGeo.scale(0.5, 1.2, 1.0);
    const leftEar = new THREE.Mesh(earGeo, skinMaterial);
    leftEar.position.set(-1.1 * faceW, 0.1, -0.1);
    avatarGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, skinMaterial);
    rightEar.position.set(1.1 * faceW, 0.1, -0.1);
    avatarGroup.add(rightEar);

    // Earrings / Accessories on ears
    if (equippedV2['bracelets'] || config?.accessories?.includes('boucles_oreilles_creoles')) {
      const ringGeo = new THREE.TorusGeometry(0.2, 0.04, 16, 32);
      const goldMat = createToonMaterial(0xd4af37);
      const lEarring = new THREE.Mesh(ringGeo, goldMat);
      lEarring.position.set(-1.2 * faceW, -0.2, 0);
      lEarring.rotation.x = Math.PI / 2;
      avatarGroup.add(lEarring);

      const rEarring = new THREE.Mesh(ringGeo, goldMat);
      rEarring.position.set(1.2 * faceW, -0.2, 0);
      rEarring.rotation.x = Math.PI / 2;
      avatarGroup.add(rEarring);
    }

    // 4. EYES 3D
    const eyeSpacing = Number(config?.eyesSpacing || 1.0) * 0.38;
    const scleraGeo = new THREE.SphereGeometry(0.22, 32, 32);
    const scleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const irisGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const irisMat = createToonMaterial(0x2d1810);

    const createEyePair = (xOffset: number) => {
      const eyeGroup = new THREE.Group();
      const sclera = new THREE.Mesh(scleraGeo, scleraMat);
      sclera.scale.set(1, 1.2, 0.6);
      eyeGroup.add(sclera);

      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.set(0, 0, 0.12);
      iris.scale.set(1, 1, 0.5);
      eyeGroup.add(iris);

      eyeGroup.position.set(xOffset, 0.25, 1.02);
      return eyeGroup;
    };

    const leftEye = createEyePair(-eyeSpacing);
    const rightEye = createEyePair(eyeSpacing);
    avatarGroup.add(leftEye);
    avatarGroup.add(rightEye);

    // Eyebrows 3D
    const ebGeo = new THREE.BoxGeometry(0.42, 0.08, 0.08);
    const ebMat = createToonMaterial(0x111111);
    const leftEb = new THREE.Mesh(ebGeo, ebMat);
    leftEb.position.set(-eyeSpacing, 0.62, 1.12);
    leftEb.rotation.z = 0.08;
    avatarGroup.add(leftEb);

    const rightEb = new THREE.Mesh(ebGeo, ebMat);
    rightEb.position.set(eyeSpacing, 0.62, 1.12);
    rightEb.rotation.z = -0.08;
    avatarGroup.add(rightEb);

    // 5. NOSE 3D
    const noseGeo = new THREE.ConeGeometry(0.18, 0.4, 16);
    noseGeo.rotateX(Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
    noseMesh.position.set(0, -0.05, 1.22);
    avatarGroup.add(noseMesh);

    // 6. MOUTH & LIPS 3D
    const lipMat = createToonMaterial(isFemale ? 0x984242 : 0x5a3222);
    const mouthGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.12, 16);
    mouthGeo.rotateX(Math.PI / 2);
    mouthGeo.scale(1, 0.4, 0.6);
    const mouthMesh = new THREE.Mesh(mouthGeo, lipMat);
    mouthMesh.position.set(0, -0.55, 1.08);
    avatarGroup.add(mouthMesh);

    // Smile expression adjustment
    if (expression === 'smile' || expression === 'excited') {
      mouthMesh.scale.set(1.2, 0.6, 0.8);
    }

    // 7. HAIR / HEADWEAR 3D
    const hairId = equippedV2['cheveux'] || equippedV2['couronnes'] || equippedV2['chapeaux'] || 'hair_elite_afro_short';
    const hairMat = createToonMaterial(0x16100a);

    if (hairId.includes('afro_volumineux') || hairId.includes('puff')) {
      const afroGeo = new THREE.SphereGeometry(1.4, 32, 32);
      const afroMesh = new THREE.Mesh(afroGeo, hairMat);
      afroMesh.position.set(0, 0.4, -0.1);
      avatarGroup.add(afroMesh);
    } else if (hairId.includes('locks') || hairId.includes('nattes') || hairId.includes('braids')) {
      const dreadsGroup = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const dGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 12);
        const dMesh = new THREE.Mesh(dGeo, hairMat);
        const angle = (i / 8) * Math.PI * 2;
        dMesh.position.set(Math.cos(angle) * 0.9, 0.6 + Math.sin(angle) * 0.2, Math.sin(angle) * 0.9 - 0.2);
        dreadsGroup.add(dMesh);
      }
      avatarGroup.add(dreadsGroup);
    } else if (hairId.includes('gele') || hairId.includes('couronne')) {
      const crownGeo = new THREE.TorusGeometry(1.1, 0.25, 16, 32);
      const goldMat = createToonMaterial(0xd4af37);
      const crownMesh = new THREE.Mesh(crownGeo, goldMat);
      crownMesh.position.set(0, 0.9, 0);
      crownMesh.rotation.x = Math.PI / 2;
      avatarGroup.add(crownMesh);
    } else {
      // Default short afro hair helmet
      const shortHairGeo = new THREE.SphereGeometry(1.25, 32, 16);
      shortHairGeo.scale(1.02, 1.1, 1.05);
      const shortHairMesh = new THREE.Mesh(shortHairGeo, hairMat);
      shortHairMesh.position.set(0, 0.25, 0);
      avatarGroup.add(shortHairMesh);
    }

    // 8. GLASSES 3D (if equipped)
    const glassesId = equippedV2['lunettes'];
    if (glassesId) {
      const glassMat = createToonMaterial(0xd4af37);
      const frameGeo = new THREE.TorusGeometry(0.32, 0.04, 16, 32);
      
      const lGlass = new THREE.Mesh(frameGeo, glassMat);
      lGlass.position.set(-eyeSpacing, 0.25, 1.15);
      avatarGroup.add(lGlass);

      const rGlass = new THREE.Mesh(frameGeo, glassMat);
      rGlass.position.set(eyeSpacing, 0.25, 1.15);
      avatarGroup.add(rGlass);

      const bridgeGeo = new THREE.BoxGeometry(eyeSpacing * 2, 0.04, 0.04);
      const bridge = new THREE.Mesh(bridgeGeo, glassMat);
      bridge.position.set(0, 0.28, 1.15);
      avatarGroup.add(bridge);
    }

    // Animation loop (gentle floating & rotation)
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle idle floating animation (Memoji live feel)
      avatarGroup.position.y = Math.sin(elapsedTime * 2) * 0.06;
      avatarGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.25;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
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
