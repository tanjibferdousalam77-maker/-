import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  FoodType,
  FOOD_DEFINITIONS,
  UpgradeStationPad,
  DiningTable,
  CashPile,
} from '../types/game';
import {
  createFoodMesh,
  createCharacterMesh,
  createFryerStationMesh,
  createCashRegisterMesh,
  createDiningTableMesh,
  createRickshawMesh,
  createTrashBinMesh,
  createCashNoteMesh,
} from './models';
import { sounds } from '../audio/soundManager';

export interface SceneCallbacks {
  onCollectCash: (amount: number) => void;
  onUpgradePadStep: (padId: string, deltaTaka: number) => void;
}

export class RestaurantScene {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private isDestroyed: boolean = false;

  // Camera damping target
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Entities
  public playerGroup!: THREE.Group;
  private playerLeftLeg!: THREE.Mesh;
  private playerRightLeg!: THREE.Mesh;
  private playerLeftArm!: THREE.Mesh;
  private playerRightArm!: THREE.Mesh;
  private playerStackAnchor!: THREE.Group;
  private playerStackMeshes: THREE.Group[] = [];

  // Staff meshes map: staffId -> { group, legs, arms, stackAnchor, stackMeshes }
  private staffMeshes = new Map<
    string,
    {
      group: THREE.Group;
      leftLeg: THREE.Mesh;
      rightLeg: THREE.Mesh;
      leftArm: THREE.Mesh;
      rightArm: THREE.Mesh;
      stackAnchor: THREE.Group;
      stackMeshes: THREE.Group[];
    }
  >();

  // Customer meshes map: customerId -> { group, leftLeg, rightLeg, speechBubble, orderMesh }
  private customerMeshes = new Map<
    string,
    {
      group: THREE.Group;
      leftLeg: THREE.Mesh;
      rightLeg: THREE.Mesh;
      speechBubbleGroup: THREE.Group;
      speechCanvas: HTMLCanvasElement;
      speechTexture: THREE.CanvasTexture;
    }
  >();

  // Flying items (food flying into stack or to customers)
  private flyingItems: {
    mesh: THREE.Group;
    start: THREE.Vector3;
    end: THREE.Vector3;
    peakY: number;
    progress: number;
    duration: number;
    onComplete?: () => void;
  }[] = [];

  // Cash notes map
  private cashMeshes = new Map<string, THREE.Group>();

  // Stations map: foodType -> group
  private stationMeshes = new Map<
    FoodType,
    { group: THREE.Group; oilMesh: THREE.Mesh; warmerItems: THREE.Group[] }
  >();

  // Table meshes map: tableId -> group
  private tableMeshes = new Map<
    number,
    { group: THREE.Group; dirtyDishesGroup: THREE.Group }
  >();

  // Upgrade pads mesh map
  private upgradePadMeshes = new Map<
    string,
    { group: THREE.Group; ringMesh: THREE.Mesh; textTexture: THREE.CanvasTexture }
  >();

  // Rickshaw
  private rickshawGroup: THREE.Group | null = null;
  private trashBinGroup!: THREE.Group;

  // Time & animations
  private clock = new THREE.Clock();

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.init();
  }

  private init() {
    // 1. Software WebGL Probe
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // 3. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x181512); // Warm Dhaka night ambient
    this.scene.fog = new THREE.Fog(0x181512, 35, 70);

    // Studio Environment Reflections
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback
    }

    // 4. Isometric Orthographic Camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const frustumSize = 18;
    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    // True isometric angle: 45° azimuth, ~35.264° elevation
    this.camera.position.set(24, 28, 24);
    this.camera.lookAt(0, 0, 0);

    // 5. Lighting
    this.setupLighting();

    // 6. Base Restaurant Environment
    this.setupRestaurantEnvironment();

    // 7. Player Mesh
    const playerParts = createCharacterMesh({
      role: 'player',
      clothesColor: 0x0284c7, // Vibrant Dhaka blue polo
      accessory: 'cap',
    });
    this.playerGroup = playerParts.group;
    this.playerLeftLeg = playerParts.leftLeg;
    this.playerRightLeg = playerParts.rightLeg;
    this.playerLeftArm = playerParts.leftArm;
    this.playerRightArm = playerParts.rightArm;
    this.playerStackAnchor = playerParts.stackAnchor;
    this.playerGroup.position.set(0, 0, 0);
    this.scene.add(this.playerGroup);

    // 8. Order Counter & Register
    const register = createCashRegisterMesh();
    register.position.set(0, 0, 4.5);
    this.scene.add(register);

    // 9. Trash Bin
    this.trashBinGroup = createTrashBinMesh();
    this.trashBinGroup.position.set(-6.5, 0, 4.5);
    this.scene.add(this.trashBinGroup);

    // 10. Start Animation Loop
    this.clock.start();
    this.animate();

    // Resize listener
    window.addEventListener('resize', this.onWindowResize);
  }

  private setupLighting() {
    // Warm key light
    const keyLight = new THREE.DirectionalLight(0xfff5eb, 1.6);
    keyLight.position.set(20, 35, 15);
    keyLight.castShadow = !this.isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 10;
      keyLight.shadow.camera.far = 70;
      const d = 22;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    // Cool fill light (Hemisphere)
    const hemiLight = new THREE.HemisphereLight(0xfffaed, 0x334155, 0.85);
    hemiLight.position.set(0, 30, 0);
    this.scene.add(hemiLight);

    // Warm ambient accent for appetizing food glow
    const ambient = new THREE.AmbientLight(0xfef3c7, 0.4);
    this.scene.add(ambient);
  }

  private setupRestaurantEnvironment() {
    // Main Cafe Floor
    const floorGeo = new THREE.PlaneGeometry(36, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xdfd7cf, // warm Bengali clay tiles
      roughness: 0.65,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Tile grid lines on floor
    const grid = new THREE.GridHelper(36, 36, 0xb8aba0, 0xd0c4b8);
    grid.position.y = 0.01;
    this.scene.add(grid);

    // Outdoor street / sidewalk area (Positive Z side where customers enter and Rickshaw stops)
    const streetGeo = new THREE.PlaneGeometry(38, 12);
    const streetMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // dark asphalt street
      roughness: 0.85,
    });
    const street = new THREE.Mesh(streetGeo, streetMat);
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, -0.05, 14.5);
    street.receiveShadow = true;
    this.scene.add(street);

    // Sidewalk curb
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    const curb = new THREE.Mesh(new THREE.BoxGeometry(38, 0.2, 0.6), curbMat);
    curb.position.set(0, 0.05, 8.8);
    curb.castShadow = true;
    this.scene.add(curb);

    // Decorative Cafe Walls (Back wall & side partition, low height so view is never occluded)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.8,
    });
    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(36, 3.2, 0.4), wallMat);
    backWall.position.set(0, 1.6, -15.8);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 24.6), wallMat);
    leftWall.position.set(-17.8, 1.6, -3.5);
    leftWall.castShadow = true;
    this.scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 24.6), wallMat);
    rightWall.position.set(17.8, 1.6, -3.5);
    rightWall.castShadow = true;
    this.scene.add(rightWall);

    // Bengali Cafe Neon / Wooden Sign on back wall: "ঢাকা স্ন্যাকস রেডি"
    const signGroup = this.createRestaurantSignboard();
    signGroup.position.set(0, 2.8, -15.5);
    this.scene.add(signGroup);

    // Festive string fairy lights hanging across back wall
    this.createFestiveFairyLights();

    // Outdoor Street Trees along sidewalk
    this.createStreetTree(-14, 12);
    this.createStreetTree(14, 12);
  }

  private createRestaurantSignboard(): THREE.Group {
    const group = new THREE.Group();
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Background gradient wood/brass
    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0, '#78350f');
    grad.addColorStop(0.5, '#b45309');
    grad.addColorStop(1, '#78350f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 256);

    // Gold border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 1004, 236);

    // Bengali Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 84px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ঢাকা স্ন্যাকস রেডি · DHAKA SNACK READY', 512, 100);

    // Subtitle
    ctx.fillStyle = '#fef08a';
    ctx.font = '600 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('গরম পুরি · ক্রিস্পি সিঙ্গারা · সমুচা · জিলাপি', 512, 185);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const signMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0.2,
    });
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 2.4, 0.15), signMat);
    group.add(signMesh);
    return group;
  }

  private createFestiveFairyLights() {
    const lightColors = [0xef4444, 0xf59e0b, 0x10b981, 0x3b82f6, 0xec4899];
    for (let i = -14; i <= 14; i += 2.2) {
      const color = lightColors[Math.abs(Math.floor(i)) % lightColors.length];
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.8,
          roughness: 0.2,
        })
      );
      // Slight catenary sag
      const sag = Math.sin(((i + 14) / 28) * Math.PI) * 0.4;
      bulb.position.set(i, 3.4 - sag, -15.4);
      this.scene.add(bulb);
    }
  }

  private createStreetTree(x: number, z: number) {
    const group = new THREE.Group();
    // Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.5, 8), trunkMat);
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    group.add(trunk);

    // Foliage
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const leaf1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.2, 7), leafMat);
    leaf1.position.y = 2.8;
    leaf1.castShadow = true;
    group.add(leaf1);

    const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.8, 7), leafMat);
    leaf2.position.y = 3.9;
    leaf2.castShadow = true;
    group.add(leaf2);

    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  // Window resize handler
  private onWindowResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;
    const frustumSize = 18;

    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  /**
   * Sync Cooking Stations with state
   */
  public syncStations(unlockedStations: FoodType[]) {
    // Pre-defined station layout positions
    const stationPositions: Record<FoodType, { x: number; z: number }> = {
      puri: { x: -9.5, z: -10 },
      singara: { x: -4.5, z: -10 },
      samosa: { x: 4.5, z: -10 },
      jilapi: { x: 9.5, z: -10 },
      cha: { x: 14.5, z: -10 },
    };

    unlockedStations.forEach((type) => {
      if (!this.stationMeshes.has(type)) {
        const { group, oilMesh } = createFryerStationMesh(type);
        const pos = stationPositions[type];
        group.position.set(pos.x, 0, pos.z);
        this.scene.add(group);
        this.stationMeshes.set(type, { group, oilMesh, warmerItems: [] });
      }
    });
  }

  /**
   * Sync Dining Tables with state
   */
  public syncTables(tables: DiningTable[]) {
    tables.forEach((table) => {
      if (table.isUnlocked && !this.tableMeshes.has(table.id)) {
        const { group } = createDiningTableMesh(table.id);
        group.position.set(table.position.x, 0, table.position.z);
        this.scene.add(group);

        const dirtyDishesGroup = new THREE.Group();
        dirtyDishesGroup.position.set(0, 1.05, 0);
        dirtyDishesGroup.visible = false;
        group.add(dirtyDishesGroup);

        // Add dirty plate tray
        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.35, 0.05, 12),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
        );
        dirtyDishesGroup.add(plate);

        this.tableMeshes.set(table.id, { group, dirtyDishesGroup });
      }

      // Update dirty dishes visibility
      const tableEntry = this.tableMeshes.get(table.id);
      if (tableEntry) {
        tableEntry.dirtyDishesGroup.visible = table.hasDirtyDishes;
      }
    });
  }

  /**
   * Sync Rickshaw Delivery Station
   */
  public syncRickshaw(isUnlocked: boolean) {
    if (isUnlocked && !this.rickshawGroup) {
      this.rickshawGroup = createRickshawMesh();
      // Parked outside at delivery window
      this.rickshawGroup.position.set(13.5, 0, 4.5);
      this.rickshawGroup.rotation.y = -Math.PI / 2;
      this.scene.add(this.rickshawGroup);
    }
  }

  /**
   * Sync Upgrade Pads on Floor
   */
  public syncUpgradePads(pads: UpgradeStationPad[]) {
    pads.forEach((pad) => {
      let entry = this.upgradePadMeshes.get(pad.id);
      if (!entry && !pad.isUnlocked) {
        const group = new THREE.Group();
        group.name = `upgrade_pad_${pad.id}`;
        group.position.set(pad.position.x, 0.02, pad.position.z);

        // Outer glow ring
        const ringGeo = new THREE.RingGeometry(pad.radius * 0.85, pad.radius, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        group.add(ringMesh);

        // Inner circle
        const innerGeo = new THREE.CircleGeometry(pad.radius * 0.84, 32);
        const innerMat = new THREE.MeshBasicMaterial({
          color: 0x064e3b,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        innerMesh.rotation.x = -Math.PI / 2;
        group.add(innerMesh);

        // Canvas for pad label (e.g. "Table 2 · ৳ 150")
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const textTexture = new THREE.CanvasTexture(canvas);
        textTexture.colorSpace = THREE.SRGBColorSpace;

        const textMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(pad.radius * 1.6, pad.radius * 1.6),
          new THREE.MeshBasicMaterial({
            map: textTexture,
            transparent: true,
            side: THREE.DoubleSide,
          })
        );
        textMesh.rotation.x = -Math.PI / 2;
        textMesh.position.y = 0.01;
        group.add(textMesh);

        this.scene.add(group);
        entry = { group, ringMesh, textTexture };
        this.upgradePadMeshes.set(pad.id, entry);
      }

      if (entry) {
        if (pad.isUnlocked) {
          this.scene.remove(entry.group);
          this.upgradePadMeshes.delete(pad.id);
          return;
        }

        // Redraw canvas text with remaining cost
        const remaining = pad.cost - pad.paid;
        const canvas = entry.textTexture.image as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, 512, 512);

        // Background progress fill
        const progress = Math.min(pad.paid / pad.cost, 1);
        ctx.beginPath();
        ctx.arc(256, 256, 240, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 28;
        ctx.stroke();

        // Texts
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 54px "Hind Siliguri", "Plus Jakarta Sans"';
        ctx.fillText(pad.titleBn, 256, 190);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 64px "JetBrains Mono", monospace';
        ctx.fillText(`৳ ${remaining}`, 256, 270);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 36px "Plus Jakarta Sans"';
        ctx.fillText(pad.titleEn, 256, 340);

        entry.textTexture.needsUpdate = true;
      }
    });
  }

  /**
   * Sync Cash Notes dropped on floor
   */
  public syncCash(cashPiles: CashPile[]) {
    const currentIds = new Set(cashPiles.map((c) => c.id));

    // Remove collected notes
    for (const [id, mesh] of this.cashMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.cashMeshes.delete(id);
      }
    }

    // Add new notes
    cashPiles.forEach((cash) => {
      if (!this.cashMeshes.has(cash.id) && !cash.collected) {
        const mesh = createCashNoteMesh();
        mesh.position.set(cash.position.x, 0.05, cash.position.z);
        mesh.rotation.y = Math.random() * Math.PI;
        this.scene.add(mesh);
        this.cashMeshes.set(cash.id, mesh);
      }
    });
  }

  /**
   * Sync Warmers: Show visual items sitting on warmer counters
   */
  public syncWarmerStock(warmerStock: Record<FoodType, number>) {
    Object.entries(warmerStock).forEach(([typeStr, count]) => {
      const type = typeStr as FoodType;
      const station = this.stationMeshes.get(type);
      if (!station) return;

      // Adjust mesh count on warmer
      while (station.warmerItems.length < count) {
        const foodMesh = createFoodMesh(type);
        const idx = station.warmerItems.length;
        // Arrange in a neat 2x3 or vertical stack
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        foodMesh.position.set(
          0.3 + col * 0.22,
          1.15 + row * 0.15,
          -0.25 + (idx % 2) * 0.4
        );
        station.group.add(foodMesh);
        station.warmerItems.push(foodMesh);
      }

      while (station.warmerItems.length > count) {
        const item = station.warmerItems.pop();
        if (item) station.group.remove(item);
      }
    });
  }

  /**
   * Sync Player Stack: Attach items to the player's carry stack with wobble kinematics
   */
  public syncPlayerStack(stack: FoodType[]) {
    while (this.playerStackMeshes.length < stack.length) {
      const idx = this.playerStackMeshes.length;
      const type = stack[idx];
      const foodMesh = createFoodMesh(type);
      // Stack vertically
      foodMesh.position.set(0, idx * 0.22, 0);
      this.playerStackAnchor.add(foodMesh);
      this.playerStackMeshes.push(foodMesh);
    }

    while (this.playerStackMeshes.length > stack.length) {
      const item = this.playerStackMeshes.pop();
      if (item) this.playerStackAnchor.remove(item);
    }

    // Extended arms when carrying food!
    const isCarrying = stack.length > 0;
    const targetArmRotX = isCarrying ? -Math.PI / 2.5 : 0;
    this.playerLeftArm.rotation.x = targetArmRotX;
    this.playerRightArm.rotation.x = targetArmRotX;
  }

  /**
   * Spawn a flying item animation (e.g. from warmer to player, or from player to counter)
   */
  public triggerFlyingFood(
    type: FoodType,
    from: THREE.Vector3,
    to: THREE.Vector3,
    onComplete?: () => void
  ) {
    const mesh = createFoodMesh(type);
    mesh.position.copy(from);
    this.scene.add(mesh);

    this.flyingItems.push({
      mesh,
      start: from.clone(),
      end: to.clone(),
      peakY: Math.max(from.y, to.y) + 1.2,
      progress: 0,
      duration: 0.28,
      onComplete: () => {
        this.scene.remove(mesh);
        onComplete?.();
      },
    });
  }

  /**
   * Sync Customers in the scene
   */
  public syncCustomers(customers: {
    id: string;
    position: { x: number; z: number };
    state: string;
    order: { itemType: FoodType; required: number; delivered: number };
  }[]) {
    const currentIds = new Set(customers.map((c) => c.id));

    // Remove departed
    for (const [id, entry] of this.customerMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(entry.group);
        this.customerMeshes.delete(id);
      }
    }

    // Add or update
    customers.forEach((c) => {
      let entry = this.customerMeshes.get(c.id);
      if (!entry) {
        const clothesColors = [0x059669, 0xd97706, 0x7c3aed, 0xdc2626, 0x0284c7];
        const color = clothesColors[Math.floor(Math.random() * clothesColors.length)];
        const parts = createCharacterMesh({
          role: 'customer',
          clothesColor: color,
        });

        // Create Order Speech Bubble above head
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 160;
        const speechTexture = new THREE.CanvasTexture(canvas);
        speechTexture.colorSpace = THREE.SRGBColorSpace;

        const speechBubbleGroup = new THREE.Group();
        const bubblePlane = new THREE.Mesh(
          new THREE.PlaneGeometry(1.4, 0.9),
          new THREE.MeshBasicMaterial({
            map: speechTexture,
            transparent: true,
            side: THREE.DoubleSide,
          })
        );
        bubblePlane.position.set(0, 2.3, 0);
        // Face isometric camera
        bubblePlane.rotation.x = -Math.PI / 4;
        bubblePlane.rotation.y = Math.PI / 4;
        speechBubbleGroup.add(bubblePlane);

        parts.group.add(speechBubbleGroup);
        this.scene.add(parts.group);

        entry = {
          group: parts.group,
          leftLeg: parts.leftLeg,
          rightLeg: parts.rightLeg,
          speechBubbleGroup,
          speechCanvas: canvas,
          speechTexture,
        };
        this.customerMeshes.set(c.id, entry);
      }

      // Update position
      const dx = c.position.x - entry.group.position.x;
      const dz = c.position.z - entry.group.position.z;
      const isMoving = Math.hypot(dx, dz) > 0.05;

      entry.group.position.set(c.position.x, 0, c.position.z);
      if (isMoving) {
        entry.group.rotation.y = Math.atan2(dx, dz);
        const t = this.clock.getElapsedTime() * 10;
        entry.leftLeg.rotation.x = Math.sin(t) * 0.6;
        entry.rightLeg.rotation.x = -Math.sin(t) * 0.6;
      } else {
        entry.leftLeg.rotation.x = 0;
        entry.rightLeg.rotation.x = 0;
      }

      // Update Order Speech Bubble
      const canvas = entry.speechCanvas;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 256, 160);

      if (c.state === 'WAITING') {
        // Draw Speech Bubble rounded box
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(8, 8, 240, 140, 24);
        ctx.fill();
        ctx.stroke();

        // Food Name & Remaining
        const remaining = c.order.required - c.order.delivered;
        const def = FOOD_DEFINITIONS[c.order.itemType];
        ctx.fillStyle = def.color;
        ctx.font = 'bold 44px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${def.nameBn} x${remaining}`, 128, 70);

        ctx.fillStyle = '#475569';
        ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`৳ ${def.sellPrice * remaining}`, 128, 120);

        entry.speechBubbleGroup.visible = true;
      } else if (c.state === 'EATING') {
        // Eating bubble: "Nom Nom!" / "মজাদার!"
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(8, 8, 240, 140, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 48px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('মজাদার!', 128, 75);

        ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Delicious!', 128, 120);

        entry.speechBubbleGroup.visible = true;
      } else {
        entry.speechBubbleGroup.visible = false;
      }
      entry.speechTexture.needsUpdate = true;
    });
  }

  /**
   * Sync Hired Staff (Mama Workers)
   */
  public syncStaff(staffList: {
    id: string;
    role: 'CHEF' | 'WAITER' | 'CLEANER';
    position: { x: number; z: number };
    stack: FoodType[];
  }[]) {
    const currentIds = new Set(staffList.map((s) => s.id));

    // Remove retired staff
    for (const [id, entry] of this.staffMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(entry.group);
        this.staffMeshes.delete(id);
      }
    }

    staffList.forEach((s) => {
      let entry = this.staffMeshes.get(s.id);
      if (!entry) {
        const parts = createCharacterMesh({
          role: s.role === 'CHEF' ? 'chef' : 'waiter',
          clothesColor: s.role === 'CHEF' ? 0xffffff : 0x15803d, // Green for waiter mama
        });
        this.scene.add(parts.group);

        entry = {
          group: parts.group,
          leftLeg: parts.leftLeg,
          rightLeg: parts.rightLeg,
          leftArm: parts.leftArm,
          rightArm: parts.rightArm,
          stackAnchor: parts.stackAnchor,
          stackMeshes: [],
        };
        this.staffMeshes.set(s.id, entry);
      }

      // Update position & walk cycle
      const dx = s.position.x - entry.group.position.x;
      const dz = s.position.z - entry.group.position.z;
      const isMoving = Math.hypot(dx, dz) > 0.05;

      entry.group.position.set(s.position.x, 0, s.position.z);
      if (isMoving) {
        entry.group.rotation.y = Math.atan2(dx, dz);
        const t = this.clock.getElapsedTime() * 12;
        entry.leftLeg.rotation.x = Math.sin(t) * 0.6;
        entry.rightLeg.rotation.x = -Math.sin(t) * 0.6;
      } else {
        entry.leftLeg.rotation.x = 0;
        entry.rightLeg.rotation.x = 0;
      }

      // Sync carry stack
      while (entry.stackMeshes.length < s.stack.length) {
        const idx = entry.stackMeshes.length;
        const foodMesh = createFoodMesh(s.stack[idx]);
        foodMesh.position.set(0, idx * 0.22, 0);
        entry.stackAnchor.add(foodMesh);
        entry.stackMeshes.push(foodMesh);
      }
      while (entry.stackMeshes.length > s.stack.length) {
        const item = entry.stackMeshes.pop();
        if (item) entry.stackAnchor.remove(item);
      }

      // Arm pose
      const isCarrying = s.stack.length > 0;
      entry.leftArm.rotation.x = isCarrying ? -Math.PI / 2.5 : 0;
      entry.rightArm.rotation.x = isCarrying ? -Math.PI / 2.5 : 0;
    });
  }

  /**
   * Update Player position, rotation, and walk cycle
   */
  public updatePlayer(
    x: number,
    z: number,
    moveAngle: number | null,
    isMoving: boolean,
    speedRatio: number = 1
  ) {
    this.playerGroup.position.set(x, 0, z);

    if (moveAngle !== null) {
      this.playerGroup.rotation.y = moveAngle;
    }

    const t = this.clock.getElapsedTime();
    if (isMoving) {
      const walkFreq = t * 14 * speedRatio;
      this.playerLeftLeg.rotation.x = Math.sin(walkFreq) * 0.65;
      this.playerRightLeg.rotation.x = -Math.sin(walkFreq) * 0.65;

      // Stack wobble kinematics!
      if (this.playerStackMeshes.length > 0) {
        const wobbleZ = Math.sin(t * 12) * 0.08;
        const wobbleX = Math.cos(t * 10) * 0.06;
        this.playerStackAnchor.rotation.set(wobbleX, 0, wobbleZ);
      }
    } else {
      this.playerLeftLeg.rotation.x = 0;
      this.playerRightLeg.rotation.x = 0;
      if (this.playerStackMeshes.length > 0) {
        this.playerStackAnchor.rotation.set(0, 0, 0);
      }
    }

    // Camera follow player with smooth exponential damping
    this.cameraTarget.lerp(new THREE.Vector3(x, 0, z), 0.08);
    this.camera.position.set(
      this.cameraTarget.x + 24,
      this.cameraTarget.y + 28,
      this.cameraTarget.z + 24
    );
    this.camera.lookAt(this.cameraTarget);
  }

  /**
   * Animation & Render Loop
   */
  private animate = () => {
    if (this.isDestroyed) return;

    this.frameId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Animate bubbling oil vats in active fryers
    this.stationMeshes.forEach((station) => {
      station.oilMesh.position.y = 1.05 + Math.sin(elapsedTime * 6) * 0.02;
    });

    // 2. Animate Upgrade Pad outer rings pulsing gently
    this.upgradePadMeshes.forEach((pad) => {
      const scale = 1 + Math.sin(elapsedTime * 4) * 0.04;
      pad.ringMesh.scale.set(scale, scale, 1);
    });

    // 3. Animate flying items
    for (let i = this.flyingItems.length - 1; i >= 0; i--) {
      const item = this.flyingItems[i];
      item.progress += delta / item.duration;
      if (item.progress >= 1) {
        item.mesh.position.copy(item.end);
        item.onComplete?.();
        this.flyingItems.splice(i, 1);
      } else {
        const p = item.progress;
        // Parabolic arc interpolation
        const currentX = THREE.MathUtils.lerp(item.start.x, item.end.x, p);
        const currentZ = THREE.MathUtils.lerp(item.start.z, item.end.z, p);
        const arcY = 4 * item.peakY * p * (1 - p) + (1 - p) * item.start.y + p * item.end.y;
        item.mesh.position.set(currentX, arcY, currentZ);
        item.mesh.rotation.y += delta * 12;
      }
    }

    // 4. Render
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Cleanup and dispose WebGL resources
   */
  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onWindowResize);

    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
  }
}
