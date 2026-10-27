import * as THREE from 'three';
import { FoodType, FOOD_DEFINITIONS } from '../types/game';

// Shared materials and geometries for memory efficiency and high performance
const materialsCache = new Map<string, THREE.Material>();

function getMaterial(key: string, creator: () => THREE.Material): THREE.Material {
  if (!materialsCache.has(key)) {
    materialsCache.set(key, creator());
  }
  return materialsCache.get(key)!;
}

/**
 * Creates distinct, delicious-looking procedural 3D food items
 */
export function createFoodMesh(type: FoodType): THREE.Group {
  const group = new THREE.Group();
  group.name = `food_${type}`;

  switch (type) {
    case 'puri': {
      // Golden, puffed irregular disc
      const puriMat = getMaterial('food_puri', () =>
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          roughness: 0.6,
          metalness: 0.05,
        })
      );
      // Main puffed disc
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 16), puriMat);
      body.scale.set(1, 1, 0.9);
      group.add(body);

      // Top puff blister
      const blisterMat = getMaterial('food_puri_blister', () =>
        new THREE.MeshStandardMaterial({
          color: 0xd97706,
          roughness: 0.5,
        })
      );
      const blister = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), blisterMat);
      blister.position.set(0.08, 0.06, 0.05);
      blister.scale.set(1.2, 0.5, 1);
      group.add(blister);
      break;
    }

    case 'singara': {
      // Crispy tetrahedral pyramid (3-sided cone)
      const singaraMat = getMaterial('food_singara', () =>
        new THREE.MeshStandardMaterial({
          color: 0xd97706,
          roughness: 0.55,
          metalness: 0.05,
        })
      );
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.45, 3), singaraMat);
      cone.rotation.y = Math.PI / 6;
      group.add(cone);

      // Crispy folded base rim
      const foldMat = getMaterial('food_singara_fold', () =>
        new THREE.MeshStandardMaterial({
          color: 0xb45309,
          roughness: 0.6,
        })
      );
      const baseRim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 3), foldMat);
      baseRim.position.y = -0.18;
      baseRim.rotation.y = Math.PI / 6;
      group.add(baseRim);
      break;
    }

    case 'samosa': {
      // Crispy triangular folded prism
      const samosaMat = getMaterial('food_samosa', () =>
        new THREE.MeshStandardMaterial({
          color: 0xb45309,
          roughness: 0.5,
          metalness: 0.05,
        })
      );
      const tri = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.28, 3), samosaMat);
      tri.rotation.x = Math.PI / 2;
      tri.scale.set(1, 1.2, 0.4);
      group.add(tri);

      // Pinched edges
      const edge = new THREE.Mesh(
        new THREE.TorusGeometry(0.25, 0.04, 6, 3),
        getMaterial('food_samosa_edge', () =>
          new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 })
        )
      );
      edge.rotation.x = Math.PI / 2;
      group.add(edge);
      break;
    }

    case 'jilapi': {
      // Glossy syrupy saffron concentric coils
      const jilapiMat = getMaterial('food_jilapi', () =>
        new THREE.MeshStandardMaterial({
          color: 0xf97316,
          roughness: 0.15,
          metalness: 0.1,
        })
      );
      // Outer pretzel loop
      const loop1 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 8, 16), jilapiMat);
      loop1.rotation.x = Math.PI / 2;
      group.add(loop1);

      // Inner spiral coil
      const loop2 = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.065, 8, 16), jilapiMat);
      loop2.position.set(0.08, 0.03, 0);
      loop2.rotation.x = Math.PI / 2;
      group.add(loop2);

      // Connecting bridge
      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8), jilapiMat);
      bridge.rotation.z = Math.PI / 3;
      bridge.rotation.x = Math.PI / 2;
      group.add(bridge);
      break;
    }

    case 'cha': {
      // Terracotta clay cup (matir bhaar) with spiced milk tea
      const cupMat = getMaterial('food_cup', () =>
        new THREE.MeshStandardMaterial({
          color: 0x9a3412, // earthy terracotta
          roughness: 0.85,
        })
      );
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.15, 0.38, 12), cupMat);
      group.add(cup);

      // Tea liquid surface
      const teaMat = getMaterial('food_tea', () =>
        new THREE.MeshStandardMaterial({
          color: 0x78350f, // rich milk tea
          roughness: 0.2,
        })
      );
      const liquid = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), teaMat);
      liquid.position.y = 0.17;
      liquid.rotation.x = -Math.PI / 2;
      group.add(liquid);
      break;
    }
  }

  // Shadow casting
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return group;
}

/**
 * Creates 3-10 part low-poly character model with bobbing legs and carry arms
 */
export function createCharacterMesh(options: {
  role: 'player' | 'customer' | 'chef' | 'waiter' | 'cleaner';
  clothesColor?: number;
  skinColor?: number;
  accessory?: 'hat' | 'cap' | 'gamcha' | 'hair';
}): {
  group: THREE.Group;
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
    color: options.skinColor || 0xc68642, // warm South Asian skin tone
    roughness: 0.6,
  });

  const clothesMat = new THREE.MeshStandardMaterial({
    color: options.clothesColor ?? (options.role === 'player' ? 0x0284c7 : 0x10b981),
    roughness: 0.7,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: options.role === 'chef' ? 0xffffff : 0x1e293b,
    roughness: 0.8,
  });

  // 1. Torso / Shirt
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.8, 0.4), clothesMat);
  torso.position.y = 0.9;
  torso.castShadow = true;
  group.add(torso);

  // Apron for staff & player
  if (options.role === 'player' || options.role === 'chef' || options.role === 'waiter') {
    const apronMat = new THREE.MeshStandardMaterial({
      color: options.role === 'chef' ? 0xd97706 : 0xf1f5f9,
      roughness: 0.8,
    });
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.05), apronMat);
    apron.position.set(0, 0.85, 0.21);
    group.add(apron);
  }

  // 2. Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), skinMat);
  head.position.y = 1.55;
  head.castShadow = true;
  group.add(head);

  // Hair or Hat
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  if (options.role === 'chef') {
    // Chef Hat (Toque)
    const toqueMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const toque = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.4, 12), toqueMat);
    toque.position.y = 1.85;
    toque.castShadow = true;
    group.add(toque);
  } else if (options.role === 'waiter') {
    // Gamcha (Traditional Bengali red/plaid towel draped around neck)
    const gamchaMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.9 });
    const gamcha = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 6, 12), gamchaMat);
    gamcha.position.set(0, 1.25, 0.05);
    gamcha.rotation.x = Math.PI / 2.3;
    group.add(gamcha);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), hairMat);
    hair.position.set(0, 1.62, -0.04);
    hair.scale.set(0.95, 0.6, 0.95);
    group.add(hair);
  } else {
    // Casual hair or manager cap
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), hairMat);
    hair.position.set(0, 1.62, -0.04);
    hair.scale.set(0.95, 0.6, 0.95);
    group.add(hair);

    if (options.role === 'player') {
      // Visor / Cap
      const capMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 10), capMat);
      cap.position.set(0, 1.72, 0);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.25), capMat);
      brim.position.set(0, 1.68, 0.26);
      group.add(cap);
      group.add(brim);
    }
  }

  // 3. Legs
  const legGeo = new THREE.BoxGeometry(0.22, 0.6, 0.24);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.18, 0.3, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.18, 0.3, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // 4. Arms (Pivoted at shoulders)
  const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
  armGeo.translate(0, -0.2, 0); // pivot at shoulder

  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.45, 1.25, 0);
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, skinMat);
  rightArm.position.set(0.45, 1.25, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  // 5. Stack Anchor (Where food piles up in front of the character's hands)
  const stackAnchor = new THREE.Group();
  stackAnchor.name = 'stackAnchor';
  stackAnchor.position.set(0, 0.95, 0.45);
  group.add(stackAnchor);

  // Soft contact shadow circle beneath feet
  const shadowGeo = new THREE.CircleGeometry(0.45, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return {
    group,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    head,
    stackAnchor,
  };
}

/**
 * Creates Fryer Cooking Station with hot oil vat, burner, and display warmer shelf
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
    roughness: 0.3,
    metalness: 0.7,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.4), steelMat);
  base.position.y = 0.5;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Fryer oil vat recessed top
  const vatMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.2,
    metalness: 0.8,
  });
  const vatRim = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 1.0), vatMat);
  vatRim.position.set(-0.35, 1.02, 0);
  group.add(vatRim);

  // Bubbling hot oil
  const oilMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.1,
    metalness: 0.2,
    emissive: 0xb45309,
    emissiveIntensity: 0.3,
  });
  const oilMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.85), oilMat);
  oilMesh.position.set(-0.35, 1.05, 0);
  group.add(oilMesh);

  // Wire fry basket handle
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), handleMat);
  handle.position.set(-0.35, 1.25, 0.5);
  handle.rotation.x = Math.PI / 4;
  group.add(handle);

  // Food pickup warmer counter (Right half of the station)
  const warmerMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.2,
    metalness: 0.8,
  });
  const warmerShelf = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 1.2), warmerMat);
  warmerShelf.position.set(0.5, 1.05, 0);
  group.add(warmerShelf);

  // Acrylic sneeze guard / glass warmer hood
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
  });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.6, 1.15), glassMat);
  glass.position.set(0.5, 1.45, 0);
  group.add(glass);

  // Station Label Signboard
  const signBoardMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
  });
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.06), signBoardMat);
  signBoard.position.set(0, 1.2, 0.72);
  group.add(signBoard);

  // Color-coded badge stripe
  const stripeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(def.color),
    emissive: new THREE.Color(def.color),
    emissiveIntensity: 0.4,
  });
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), stripeMat);
  stripe.position.set(0, 1.3, 0.73);
  group.add(stripe);

  return {
    group,
    warmerPoint: new THREE.Vector3(0.5, 1.15, 0),
    oilMesh,
  };
}

/**
 * Creates Order & Cash Register Counter
 */
export function createCashRegisterMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'cash_register_counter';

  // Wooden counter base
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x451a03, // deep rich mahogany wood
    roughness: 0.4,
  });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 1.2), woodMat);
  counter.position.y = 0.55;
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  // Polished granite/marble countertop
  const topMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.2,
    metalness: 0.1,
  });
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 1.4), topMat);
  top.position.y = 1.15;
  top.castShadow = true;
  group.add(top);

  // Register POS machine
  const posMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
  const posBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.45), posMat);
  posBase.position.set(-0.6, 1.28, 0);
  group.add(posBase);

  // POS Touch Screen
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0284c7,
    emissiveIntensity: 0.5,
  });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.05), screenMat);
  screen.position.set(-0.6, 1.5, -0.05);
  screen.rotation.x = -Math.PI / 6;
  group.add(screen);

  // Brass Bell
  const bellMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.9,
    roughness: 0.2,
  });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), bellMat);
  bell.position.set(0.3, 1.28, 0.1);
  group.add(bell);

  // Bangladeshi Taka Tip Tray
  const trayMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.4,
  });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), trayMat);
  tray.position.set(0.9, 1.22, 0);
  group.add(tray);

  return group;
}

/**
 * Creates Dine-In Table with stools and tray spot
 */
export function createDiningTableMesh(tableId: number): {
  group: THREE.Group;
  tableSurface: THREE.Vector3;
  chairs: THREE.Vector3[];
} {
  const group = new THREE.Group();
  group.name = `dining_table_${tableId}`;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3d2e,
    roughness: 0.5,
  });

  // Table top round
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 20), woodMat);
  tableTop.position.y = 0.95;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  group.add(tableTop);

  // Table brass rim
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.3,
    metalness: 0.8,
  });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.04, 8, 24), brassMat);
  rim.position.y = 0.95;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  // Central wooden pillar & base
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 12), woodMat);
  pillar.position.y = 0.45;
  pillar.castShadow = true;
  group.add(pillar);

  const baseDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.7, 0.08, 16), brassMat);
  baseDisc.position.y = 0.04;
  group.add(baseDisc);

  // Center Condiment / Napkin holder
  const holder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 })
  );
  holder.position.y = 1.08;
  group.add(holder);

  // Stools surrounding the table
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

    // Stool cushion
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12), cushionMat);
    cushion.position.set(pos.x, 0.52, pos.z);
    group.add(cushion);
  });

  return {
    group,
    tableSurface: new THREE.Vector3(0, 1.05, 0),
    chairs: chairPositions,
  };
}

/**
 * Creates Authentic Dhaka Cycle Rickshaw with colorful painted hood
 */
export function createRickshawMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'dhaka_rickshaw';

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a, // vibrant green frame
    roughness: 0.4,
    metalness: 0.6,
  });

  // Cycle body frame tubes
  const mainBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), frameMat);
  mainBar.position.set(0, 0.6, 0.2);
  mainBar.rotation.x = Math.PI / 4;
  group.add(mainBar);

  // Front wheel
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

  // Rear twin wheels
  const rearLeftWheel = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 8, 20), wheelMat);
  rearLeftWheel.position.set(-0.85, 0.45, -0.6);
  rearLeftWheel.castShadow = true;
  group.add(rearLeftWheel);

  const rearRightWheel = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 8, 20), wheelMat);
  rearRightWheel.position.set(0.85, 0.45, -0.6);
  rearRightWheel.castShadow = true;
  group.add(rearRightWheel);

  // Rear axle
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 8), rimMat);
  axle.position.set(0, 0.45, -0.6);
  axle.rotation.z = Math.PI / 2;
  group.add(axle);

  // Passenger seat bench
  const seatMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 0.6), seatMat);
  seat.position.set(0, 0.8, -0.5);
  seat.castShadow = true;
  group.add(seat);

  // Decorative colorful foldable Hood / Canopy (Authentic Dhaka Rickshaw Art)
  const hoodMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15, // bright yellow with floral flair
    roughness: 0.5,
  });
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.35, 12, 1, false, 0, Math.PI), hoodMat);
  hood.position.set(0, 1.45, -0.5);
  hood.rotation.z = Math.PI / 2;
  hood.castShadow = true;
  group.add(hood);

  // Rickshaw Delivery Wooden Crate on seat
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.5), crateMat);
  crate.position.set(0, 1.05, -0.5);
  group.add(crate);

  // Handlebars & Bell
  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), rimMat);
  handleBar.position.set(0, 1.05, 1.25);
  handleBar.rotation.z = Math.PI / 2;
  group.add(handleBar);

  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 }));
  bell.position.set(0.3, 1.1, 1.25);
  group.add(bell);

  return group;
}

/**
 * Creates Clean Waste Receptacle
 */
export function createTrashBinMesh(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'trash_station';

  const binMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // green eco waste bin
    roughness: 0.5,
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.35, 1.0, 14), binMat);
  body.position.y = 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.15, 14), binMat);
  lid.position.y = 1.05;
  group.add(lid);

  // Label
  const label = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.25, 0.02),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  label.position.set(0, 0.6, 0.4);
  group.add(label);

  return group;
}

/**
 * Creates ৳ Taka Currency Banknote bundle
 */
export function createCashNoteMesh(): THREE.Group {
  const group = new THREE.Group();
  const noteMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, // Bangladesh 500/1000 ৳ Taka green/teal
    roughness: 0.5,
  });

  const note = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.25), noteMat);
  note.castShadow = true;
  group.add(note);

  // Currency band
  const bandMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.065, 0.26), bandMat);
  group.add(band);

  return group;
}
