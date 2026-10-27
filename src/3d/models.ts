import * as THREE from 'three';
import { FoodType, FOOD_DEFINITIONS } from '../types/game';

const materialsCache = new Map<string, THREE.Material>();

function getMaterial(key: string, creator: () => THREE.Material): THREE.Material {
  if (!materialsCache.has(key)) {
    materialsCache.set(key, creator());
  }
  return materialsCache.get(key)!;
}

/**
 * Creates distinct, high-fidelity procedural 3D food items
 */
export function createFoodMesh(type: FoodType): THREE.Group {
  const group = new THREE.Group();
  group.name = `food_${type}`;

  switch (type) {
    case 'puri': {
      // Golden, puffed irregular disc with crisp blister spots
      const puriMat = getMaterial('food_puri', () =>
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          roughness: 0.45,
          metalness: 0.1,
        })
      );
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 16), puriMat);
      body.scale.set(1, 1, 0.92);
      group.add(body);

      // Fried blisters
      const blisterMat = getMaterial('food_puri_blister', () =>
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
      );
      const blister1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), blisterMat);
      blister1.position.set(0.09, 0.07, 0.05);
      blister1.scale.set(1.2, 0.45, 1);
      group.add(blister1);
      break;
    }

    case 'singara': {
      // Crispy tetrahedral pyramid (3-sided cone with crimped folded base)
      const singaraMat = getMaterial('food_singara', () =>
        new THREE.MeshStandardMaterial({
          color: 0xd97706,
          roughness: 0.5,
          metalness: 0.05,
        })
      );
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.46, 3), singaraMat);
      cone.rotation.y = Math.PI / 6;
      group.add(cone);

      const foldMat = getMaterial('food_singara_fold', () =>
        new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 })
      );
      const baseRim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.09, 3), foldMat);
      baseRim.position.y = -0.19;
      baseRim.rotation.y = Math.PI / 6;
      group.add(baseRim);
      break;
    }

    case 'samosa': {
      // Crispy triangular folded prism with pinched edges
      const samosaMat = getMaterial('food_samosa', () =>
        new THREE.MeshStandardMaterial({
          color: 0xb45309,
          roughness: 0.45,
          metalness: 0.05,
        })
      );
      const tri = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.3, 3), samosaMat);
      tri.rotation.x = Math.PI / 2;
      tri.scale.set(1, 1.25, 0.38);
      group.add(tri);

      const edge = new THREE.Mesh(
        new THREE.TorusGeometry(0.26, 0.04, 6, 3),
        getMaterial('food_samosa_edge', () =>
          new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.55 })
        )
      );
      edge.rotation.x = Math.PI / 2;
      group.add(edge);
      break;
    }

    case 'jilapi': {
      // Glossy syrupy saffron translucent concentric pretzel coils
      const jilapiMat = getMaterial('food_jilapi', () =>
        new THREE.MeshStandardMaterial({
          color: 0xf97316,
          roughness: 0.12,
          metalness: 0.15,
          emissive: 0xea580c,
          emissiveIntensity: 0.2,
        })
      );
      const loop1 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.075, 8, 16), jilapiMat);
      loop1.rotation.x = Math.PI / 2;
      group.add(loop1);

      const loop2 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.07, 8, 16), jilapiMat);
      loop2.position.set(0.08, 0.03, 0);
      loop2.rotation.x = Math.PI / 2;
      group.add(loop2);

      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.36, 8), jilapiMat);
      bridge.rotation.z = Math.PI / 3;
      bridge.rotation.x = Math.PI / 2;
      group.add(bridge);
      break;
    }

    case 'cha': {
      // Terracotta clay cup (matir bhaar) with steaming milk chai
      const cupMat = getMaterial('food_cup', () =>
        new THREE.MeshStandardMaterial({
          color: 0x9a3412,
          roughness: 0.85,
        })
      );
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.4, 14), cupMat);
      group.add(cup);

      const teaMat = getMaterial('food_tea', () =>
        new THREE.MeshStandardMaterial({
          color: 0x78350f,
          roughness: 0.15,
        })
      );
      const liquid = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), teaMat);
      liquid.position.y = 0.18;
      liquid.rotation.x = -Math.PI / 2;
      group.add(liquid);
      break;
    }
  }

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}

/**
 * Creates 3-10 part low-poly character model with smooth kinematics
 */
export function createCharacterMesh(options: {
  role: 'player' | 'customer' | 'chef' | 'waiter' | 'cleaner';
  clothesColor?: number;
  skinColor?: number;
  accessory?: 'hat' | 'cap' | 'gamcha' | 'hair';
}): {
  group: THREE.Group;
  torso: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  head: THREE.Mesh;
  stackAnchor: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = `char_${options.role}`;

  const skinMat = new THREE.MeshStandardMaterial({
    color: options.skinColor || 0xc68642,
    roughness: 0.55,
  });

  const clothesMat = new THREE.MeshStandardMaterial({
    color: options.clothesColor ?? (options.role === 'player' ? 0x0284c7 : 0x10b981),
    roughness: 0.65,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: options.role === 'chef' ? 0xf8fafc : 0x1e293b,
    roughness: 0.8,
  });

  // 1. Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.82, 0.42), clothesMat);
  torso.position.y = 0.92;
  torso.castShadow = true;
  group.add(torso);

  // Apron for staff & player
  if (options.role === 'player' || options.role === 'chef' || options.role === 'waiter') {
    const apronMat = new THREE.MeshStandardMaterial({
      color: options.role === 'chef' ? 0xd97706 : 0xf1f5f9,
      roughness: 0.75,
    });
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.66, 0.05), apronMat);
    apron.position.set(0, 0.86, 0.22);
    group.add(apron);
  }

  // 2. Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skinMat);
  head.position.y = 1.58;
  head.castShadow = true;
  group.add(head);

  // Hair or Hat
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  if (options.role === 'chef') {
    const toqueMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    const toque = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.42, 14), toqueMat);
    toque.position.y = 1.88;
    toque.castShadow = true;
    group.add(toque);
  } else if (options.role === 'waiter') {
    // Red check gamcha (traditional towel) around neck
    const gamchaMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.85 });
    const gamcha = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.08, 6, 14), gamchaMat);
    gamcha.position.set(0, 1.28, 0.05);
    gamcha.rotation.x = Math.PI / 2.3;
    group.add(gamcha);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), hairMat);
    hair.position.set(0, 1.64, -0.04);
    hair.scale.set(0.95, 0.6, 0.95);
    group.add(hair);
  } else {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), hairMat);
    hair.position.set(0, 1.64, -0.04);
    hair.scale.set(0.95, 0.6, 0.95);
    group.add(hair);

    if (options.role === 'player') {
      const capMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 12), capMat);
      cap.position.set(0, 1.74, 0);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.26), capMat);
      brim.position.set(0, 1.7, 0.27);
      group.add(cap);
      group.add(brim);
    }
  }

  // 3. Legs
  const legGeo = new THREE.BoxGeometry(0.23, 0.62, 0.24);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.19, 0.31, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.19, 0.31, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // 4. Arms
  const armGeo = new THREE.BoxGeometry(0.18, 0.58, 0.18);
  armGeo.translate(0, -0.22, 0);

  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.46, 1.28, 0);
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, skinMat);
  rightArm.position.set(0.46, 1.28, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  // 5. Stack Anchor
  const stackAnchor = new THREE.Group();
  stackAnchor.name = 'stackAnchor';
  stackAnchor.position.set(0, 0.98, 0.46);
  group.add(stackAnchor);

  // Contact shadow
  const shadowGeo = new THREE.CircleGeometry(0.48, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return {
    group,
    torso,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    head,
    stackAnchor,
  };
}

/**
 * Creates Fryer Cooking Station with colorful street awning and English/Bengali signage
 */
export function createFryerStationMesh(foodType: FoodType): {
  group: THREE.Group;
  warmerPoint: THREE.Vector3;
  oilMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = `station_${foodType}`;

  const def = FOOD_DEFINITIONS[foodType];

  // Stainless steel body
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.25,
    metalness: 0.75,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.05, 1.5), steelMat);
  base.position.y = 0.52;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Deep oil vat
  const vatMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.2,
    metalness: 0.8,
  });
  const vatRim = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.1, 1.05), vatMat);
  vatRim.position.set(-0.4, 1.05, 0);
  group.add(vatRim);

  // Glowing hot oil
  const oilMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0xb45309,
    emissiveIntensity: 0.4,
  });
  const oilMesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.08, 0.92), oilMat);
  oilMesh.position.set(-0.4, 1.08, 0);
  group.add(oilMesh);

  // Basket handle
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8), handleMat);
  handle.position.set(-0.4, 1.28, 0.55);
  handle.rotation.x = Math.PI / 4;
  group.add(handle);

  // Food pickup warmer counter
  const warmerMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.2,
    metalness: 0.85,
  });
  const warmerShelf = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 1.25), warmerMat);
  warmerShelf.position.set(0.55, 1.08, 0);
  group.add(warmerShelf);

  // Acrylic display sneeze guard
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
  });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.65, 1.2), glassMat);
  glass.position.set(0.55, 1.5, 0);
  group.add(glass);

  // Colorful striped street canopy / awning over station
  const canopyGroup = new THREE.Group();
  const awningMat1 = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 });
  const awningMat2 = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 });

  for (let i = 0; i < 6; i++) {
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.08, 1.6),
      i % 2 === 0 ? awningMat1 : awningMat2
    );
    strip.position.set(-0.9 + i * 0.36, 2.5, 0);
    strip.rotation.x = 0.15;
    canopyGroup.add(strip);
  }
  // Canopy support poles
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
  const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8), poleMat);
  pole1.position.set(-0.95, 1.25, 0.7);
  const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8), poleMat);
  pole2.position.set(0.95, 1.25, 0.7);
  canopyGroup.add(pole1);
  canopyGroup.add(pole2);
  group.add(canopyGroup);

  // Station Label Signboard
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 120);

  ctx.fillStyle = def.color;
  ctx.font = 'bold 52px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(def.nameBn, 256, 60);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${def.nameEn} Station`, 256, 105);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const signMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.4 });
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.08), signMat);
  signBoard.position.set(0, 1.35, 0.77);
  group.add(signBoard);

  return {
    group,
    warmerPoint: new THREE.Vector3(0.55, 1.18, 0),
    oilMesh,
  };
}

/**
 * Creates Cash Register Counter with iconic "বাকি চাহিয়া লজ্জা দিবেন না" sign!
 */
export function createCashRegisterMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'cash_register_counter';

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.4,
  });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.15, 1.25), woodMat);
  counter.position.y = 0.58;
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  // Granite countertop
  const topMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.2,
    metalness: 0.1,
  });
  const top = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.12, 1.45), topMat);
  top.position.y = 1.18;
  top.castShadow = true;
  group.add(top);

  // POS Machine
  const posMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
  const posBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.16, 0.48), posMat);
  posBase.position.set(-0.7, 1.3, 0);
  group.add(posBase);

  // POS Screen
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0284c7,
    emissiveIntensity: 0.5,
  });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.05), screenMat);
  screen.position.set(-0.7, 1.52, -0.05);
  screen.rotation.x = -Math.PI / 6;
  group.add(screen);

  // Brass Bell
  const bellMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.9,
    roughness: 0.2,
  });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), bellMat);
  bell.position.set(0.35, 1.3, 0.1);
  group.add(bell);

  // Taka Cash Tray
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.05, 0.45), trayMat);
  tray.position.set(1.0, 1.25, 0);
  group.add(tray);

  // NICHE DHAKA SIGN ON COUNTER: "বাকি চাহিয়া লজ্জা দিবেন না" (No credit! Cash only!)
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 160;
  const sCtx = signCanvas.getContext('2d')!;
  sCtx.fillStyle = '#b91c1c'; // Red background
  sCtx.fillRect(0, 0, 512, 160);
  sCtx.strokeStyle = '#fef08a';
  sCtx.lineWidth = 10;
  sCtx.strokeRect(6, 6, 500, 148);

  sCtx.fillStyle = '#ffffff';
  sCtx.font = 'bold 50px "Hind Siliguri", sans-serif';
  sCtx.textAlign = 'center';
  sCtx.fillText('বাকি চাহিয়া লজ্জা দিবেন না', 256, 75);

  sCtx.fillStyle = '#fef08a';
  sCtx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
  sCtx.fillText('CASH ONLY · NO CREDIT', 256, 130);

  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.7, 0.06),
    new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.3 })
  );
  signMesh.position.set(0, 0.6, 0.66);
  group.add(signMesh);

  return group;
}

/**
 * Creates Dine-In Table with English number label
 */
export function createDiningTableMesh(tableId: number): {
  group: THREE.Group;
  tableSurface: THREE.Vector3;
  chairs: THREE.Vector3[];
} {
  const group = new THREE.Group();
  group.name = `dining_table_${tableId}`;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.5 });
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.12, 22), woodMat);
  tableTop.position.y = 0.96;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  group.add(tableTop);

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.3,
    metalness: 0.8,
  });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.04, 8, 24), brassMat);
  rim.position.y = 0.96;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.9, 12), woodMat);
  pillar.position.y = 0.46;
  pillar.castShadow = true;
  group.add(pillar);

  const baseDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.08, 16), brassMat);
  baseDisc.position.y = 0.04;
  group.add(baseDisc);

  // Table number plaque: "Table 1"
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`T${tableId}`, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const plaque = new THREE.Mesh(
    new THREE.CircleGeometry(0.18, 16),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  plaque.position.set(0, 1.03, 0);
  plaque.rotation.x = -Math.PI / 2;
  group.add(plaque);

  const chairPositions: THREE.Vector3[] = [
    new THREE.Vector3(0, 0, 1.55),
    new THREE.Vector3(0, 0, -1.55),
    new THREE.Vector3(1.55, 0, 0),
    new THREE.Vector3(-1.55, 0, 0),
  ];

  chairPositions.forEach((pos) => {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 0.5, 12), woodMat);
    stool.position.set(pos.x, 0.25, pos.z);
    stool.castShadow = true;
    group.add(stool);

    const cushionMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12), cushionMat);
    cushion.position.set(pos.x, 0.52, pos.z);
    group.add(cushion);
  });

  return {
    group,
    tableSurface: new THREE.Vector3(0, 1.06, 0),
    chairs: chairPositions,
  };
}

/**
 * Creates Authentic Dhaka Cycle Rickshaw with "আল্লাহ ভরসা" Art
 */
export function createRickshawMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'dhaka_rickshaw';

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.4,
    metalness: 0.6,
  });

  const mainBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), frameMat);
  mainBar.position.set(0, 0.6, 0.2);
  mainBar.rotation.x = Math.PI / 4;
  group.add(mainBar);

  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8, roughness: 0.2 });

  const frontWheel = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 8, 20), wheelMat);
  frontWheel.position.set(0, 0.45, 1.4);
  frontWheel.castShadow = true;
  group.add(frontWheel);

  const frontHub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8), rimMat);
  frontHub.position.set(0, 0.45, 1.4);
  frontHub.rotation.z = Math.PI / 2;
  group.add(frontHub);

  const rearLeftWheel = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 8, 20), wheelMat);
  rearLeftWheel.position.set(-0.85, 0.45, -0.6);
  rearLeftWheel.castShadow = true;
  group.add(rearLeftWheel);

  const rearRightWheel = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 8, 20), wheelMat);
  rearRightWheel.position.set(0.85, 0.45, -0.6);
  rearRightWheel.castShadow = true;
  group.add(rearRightWheel);

  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 8), rimMat);
  axle.position.set(0, 0.45, -0.6);
  axle.rotation.z = Math.PI / 2;
  group.add(axle);

  const seatMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 0.6), seatMat);
  seat.position.set(0, 0.8, -0.5);
  seat.castShadow = true;
  group.add(seat);

  // Rickshaw Hood with authentic Rickshaw Art canvas: "আল্লাহ ভরসা"
  const artCanvas = document.createElement('canvas');
  artCanvas.width = 512;
  artCanvas.height = 256;
  const aCtx = artCanvas.getContext('2d')!;
  aCtx.fillStyle = '#facc15';
  aCtx.fillRect(0, 0, 512, 256);
  aCtx.strokeStyle = '#dc2626';
  aCtx.lineWidth = 12;
  aCtx.strokeRect(6, 6, 500, 244);

  aCtx.fillStyle = '#065f46';
  aCtx.font = 'bold 64px "Hind Siliguri", sans-serif';
  aCtx.textAlign = 'center';
  aCtx.fillText('আল্লাহ ভরসা', 256, 120);

  aCtx.fillStyle = '#dc2626';
  aCtx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  aCtx.fillText('DHAKA EXPRESS DELIVERY', 256, 195);

  const artTexture = new THREE.CanvasTexture(artCanvas);
  artTexture.colorSpace = THREE.SRGBColorSpace;
  const hoodMat = new THREE.MeshStandardMaterial({ map: artTexture, roughness: 0.5 });
  const hood = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 1.35, 12, 1, false, 0, Math.PI),
    hoodMat
  );
  hood.position.set(0, 1.45, -0.5);
  hood.rotation.z = Math.PI / 2;
  hood.castShadow = true;
  group.add(hood);

  const crateMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.5), crateMat);
  crate.position.set(0, 1.05, -0.5);
  group.add(crate);

  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), rimMat);
  handleBar.position.set(0, 1.05, 1.25);
  handleBar.rotation.z = Math.PI / 2;
  group.add(handleBar);

  const bell = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 })
  );
  bell.position.set(0.3, 1.1, 1.25);
  group.add(bell);

  return group;
}

/**
 * Creates Waste Station with "এখানে ময়লা ফেলুন" sign
 */
export function createTrashBinMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'trash_station';

  const binMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.36, 1.05, 14), binMat);
  body.position.y = 0.52;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.16, 14), binMat);
  lid.position.y = 1.08;
  group.add(lid);

  // Trash Sign: "এখানে ময়লা ফেলুন" / TRASH
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#15803d';
  ctx.font = 'bold 36px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('এখানে ময়লা ফেলুন', 128, 55);
  ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('DISPOSE TRASH', 128, 100);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.28, 0.02),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  label.position.set(0, 0.65, 0.42);
  group.add(label);

  return group;
}

/**
 * Creates ৳ Taka Banknote Bundle
 */
export function createCashNoteMesh(): THREE.Group {
  const group = new THREE.Group();
  const noteMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 });
  const note = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.26), noteMat);
  note.castShadow = true;
  group.add(note);

  const bandMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.065, 0.27), bandMat);
  group.add(band);

  return group;
}
