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

  // Smooth Player Physics
  public playerGroup!: THREE.Group;
  private playerTorso!: THREE.Mesh;
  private playerLeftLeg!: THREE.Mesh;
  private playerRightLeg!: THREE.Mesh;
  private playerLeftArm!: THREE.Mesh;
  private playerRightArm!: THREE.Mesh;
  private playerStackAnchor!: THREE.Group;
  private playerStackMeshes: THREE.Group[] = [];

  // Movement vectors
  private inputVector = new THREE.Vector2(0, 0);
  private currentVelocity = new THREE.Vector2(0, 0);
  public playerPos = new THREE.Vector2(0, 0);
  public playerAngle: number = 0;
  public playerSpeed: number = 6.2;
  private walkTime: number = 0;

  // Entities
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

  private flyingItems: {
    mesh: THREE.Group;
    start: THREE.Vector3;
    end: THREE.Vector3;
    peakY: number;
    progress: number;
    duration: number;
    onComplete?: () => void;
  }[] = [];

  private cashMeshes = new Map<string, THREE.Group>();
  private stationMeshes = new Map<
    FoodType,
    { group: THREE.Group; oilMesh: THREE.Mesh; warmerItems: THREE.Group[] }
  >();
  private tableMeshes = new Map<
    number,
    { group: THREE.Group; dirtyDishesGroup: THREE.Group }
  >();
  private upgradePadMeshes = new Map<
    string,
    { group: THREE.Group; ringMesh: THREE.Mesh; textTexture: THREE.CanvasTexture }
  >();

  private rickshawGroup: THREE.Group | null = null;
  private clock = new THREE.Clock();

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.init();
  }

  private init() {
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x181512);
    this.scene.fog = new THREE.Fog(0x181512, 36, 75);

    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback
    }

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
    this.camera.position.set(24, 28, 24);
    this.camera.lookAt(0, 0, 0);

    this.setupLighting();
    this.setupProfoundEnvironment();

    // Player
    const playerParts = createCharacterMesh({
      role: 'player',
      clothesColor: 0x0284c7,
      accessory: 'cap',
    });
    this.playerGroup = playerParts.group;
    this.playerTorso = playerParts.torso;
    this.playerLeftLeg = playerParts.leftLeg;
    this.playerRightLeg = playerParts.rightLeg;
    this.playerLeftArm = playerParts.leftArm;
    this.playerRightArm = playerParts.rightArm;
    this.playerStackAnchor = playerParts.stackAnchor;
    this.playerGroup.position.set(0, 0, 0);
    this.scene.add(this.playerGroup);

    // Front Register Counter
    const register = createCashRegisterMesh();
    register.position.set(0, 0, 4.5);
    this.scene.add(register);

    // Trash Bin
    const trashBin = createTrashBinMesh();
    trashBin.position.set(-6.5, 0, 4.5);
    this.scene.add(trashBin);

    this.clock.start();
    this.animate();

    window.addEventListener('resize', this.onWindowResize);
  }

  private setupLighting() {
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.7);
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

    const hemiLight = new THREE.HemisphereLight(0xfffaed, 0x1e293b, 0.85);
    hemiLight.position.set(0, 30, 0);
    this.scene.add(hemiLight);

    const warmAmbient = new THREE.AmbientLight(0xfef3c7, 0.45);
    this.scene.add(warmAmbient);
  }

  private setupProfoundEnvironment() {
    // Cafe Floor
    const floorGeo = new THREE.PlaneGeometry(36, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xdfd7cf,
      roughness: 0.6,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid pattern
    const grid = new THREE.GridHelper(36, 36, 0xb8aba0, 0xd0c4b8);
    grid.position.y = 0.01;
    this.scene.add(grid);

    // Street area
    const streetGeo = new THREE.PlaneGeometry(38, 12);
    const streetMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
    });
    const street = new THREE.Mesh(streetGeo, streetMat);
    street.rotation.x = -Math.PI / 2;
    street.position.set(0, -0.05, 14.5);
    street.receiveShadow = true;
    this.scene.add(street);

    // Road white dashed lines
    for (let x = -16; x <= 16; x += 4) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(2.0, 0.2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, -0.04, 14.5);
      this.scene.add(line);
    }

    // Sidewalk curb
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    const curb = new THREE.Mesh(new THREE.BoxGeometry(38, 0.2, 0.6), curbMat);
    curb.position.set(0, 0.05, 8.8);
    curb.castShadow = true;
    this.scene.add(curb);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(36, 3.4, 0.4), wallMat);
    backWall.position.set(0, 1.7, -15.8);
    backWall.castShadow = true;
    this.scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.4, 24.6), wallMat);
    leftWall.position.set(-17.8, 1.7, -3.5);
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.4, 24.6), wallMat);
    rightWall.position.set(17.8, 1.7, -3.5);
    this.scene.add(rightWall);

    // Main Cafe Signboard
    const signGroup = this.createRestaurantSignboard();
    signGroup.position.set(0, 3.0, -15.5);
    this.scene.add(signGroup);

    // Niche Dhaka Wall Sign 1: "চা খান, মাথা ঠান্ডা রাখুন"
    this.createChaSign(-11, 2.8, -15.5);

    // Niche Dhaka Wall Sign 2: "মামার স্পেশাল নাস্তা ও দুধ চা"
    this.createSpecialMamaSign(11, 2.8, -15.5);

    // Niche Dhaka Street Milestone Signboard: "ধানমন্ডি ৩২ ➔" & "শাহবাগ মোড় ➔"
    this.createDhakaRoadSign(14, 0, 9.5);

    // Street Lamp Posts with warm glowing cone lights
    this.createStreetLamp(-15, 8.5);
    this.createStreetLamp(15, 8.5);

    // Fairy lights
    this.createFestiveFairyLights();

    // Trees
    this.createStreetTree(-14, 12);
    this.createStreetTree(14, 12);
  }

  private createRestaurantSignboard(): THREE.Group {
    const group = new THREE.Group();
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0, '#78350f');
    grad.addColorStop(0.5, '#b45309');
    grad.addColorStop(1, '#78350f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 256);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 1004, 236);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DHAKA SNACK READY', 512, 95);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 50px "Hind Siliguri", sans-serif';
    ctx.fillText('গরম পুরি · ক্রিস্পি সিঙ্গারা · সমুচা · জিলাপি', 512, 185);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const signMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0.2,
    });
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(10.5, 2.5, 0.15), signMat);
    group.add(signMesh);
    return group;
  }

  // Niche sign: "চা খান, মাথা ঠান্ডা রাখুন" (Drink Cha, Keep a Cool Head)
  private createChaSign(x: number, y: number, z: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#065f46';
    ctx.fillRect(0, 0, 384, 160);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 376, 152);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('চা খান, মাথা ঠান্ডা রাখুন', 192, 70);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('HOT SPICED MILK CHA', 192, 125);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.5, 0.08),
      new THREE.MeshStandardMaterial({ map: tex })
    );
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
  }

  // Niche sign: "মামার স্পেশাল নাস্তা ও দুধ চা"
  private createSpecialMamaSign(x: number, y: number, z: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, 384, 160);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 376, 152);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('মামার স্পেশাল নাস্তা', 192, 65);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText("MAMA'S FAMOUS SNACKS", 192, 120);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.5, 0.08),
      new THREE.MeshStandardMaterial({ map: tex })
    );
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
  }

  // Niche Dhaka Road Signboard: "ধানমন্ডি ৩২" & "শাহবাগ মোড়"
  private createDhakaRoadSign(x: number, y: number, z: number) {
    const group = new THREE.Group();

    // Post
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
    );
    pole.position.y = 1.4;
    group.add(pole);

    // Green directional sign
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 192;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#047857';
    ctx.fillRect(0, 0, 384, 192);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 376, 184);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('➔ ধানমন্ডি ৩২ (Dhanmondi)', 20, 65);
    ctx.fillText('➔ শাহবাগ মোড় (Shahbagh)', 20, 140);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.2, 0.06),
      new THREE.MeshStandardMaterial({ map: tex })
    );
    board.position.set(0, 2.3, 0);
    board.rotation.y = -Math.PI / 4;
    group.add(board);

    group.position.set(x, y, z);
    this.scene.add(group);
  }

  private createStreetLamp(x: number, z: number) {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.2, 8), metalMat);
    post.position.y = 2.1;
    group.add(post);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), metalMat);
    arm.position.set(0.4, 4.1, 0);
    arm.rotation.z = Math.PI / 3;
    group.add(arm);

    // Lantern
    const lantern = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 0.4, 8),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.9,
      })
    );
    lantern.position.set(0.8, 3.8, 0);
    group.add(lantern);

    // Soft warm pointlight
    const light = new THREE.PointLight(0xfff1aa, 1.2, 12);
    light.position.set(0.8, 3.8, 0);
    group.add(light);

    group.position.set(x, 0, z);
    this.scene.add(group);
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
      const sag = Math.sin(((i + 14) / 28) * Math.PI) * 0.4;
      bulb.position.set(i, 3.5 - sag, -15.4);
      this.scene.add(bulb);
    }
  }

  private createStreetTree(x: number, z: number) {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.5, 8), trunkMat);
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    group.add(trunk);

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
   * Set Input vector directly for fluid 60FPS physics
   */
  public setMovementInput(vx: number, vz: number) {
    this.inputVector.set(vx, vz);
  }

  public setPlayerSpeed(speed: number) {
    this.playerSpeed = speed;
  }

  public syncStations(unlockedStations: FoodType[]) {
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

  public syncTables(tables: DiningTable[]) {
    tables.forEach((table) => {
      if (table.isUnlocked && !this.tableMeshes.has(table.id)) {
        const { group } = createDiningTableMesh(table.id);
        group.position.set(table.position.x, 0, table.position.z);
        this.scene.add(group);

        const dirtyDishesGroup = new THREE.Group();
        dirtyDishesGroup.position.set(0, 1.06, 0);
        dirtyDishesGroup.visible = false;
        group.add(dirtyDishesGroup);

        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.35, 0.05, 12),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
        );
        dirtyDishesGroup.add(plate);

        this.tableMeshes.set(table.id, { group, dirtyDishesGroup });
      }

      const tableEntry = this.tableMeshes.get(table.id);
      if (tableEntry) {
        tableEntry.dirtyDishesGroup.visible = table.hasDirtyDishes;
      }
    });
  }

  public syncRickshaw(isUnlocked: boolean) {
    if (isUnlocked && !this.rickshawGroup) {
      this.rickshawGroup = createRickshawMesh();
      this.rickshawGroup.position.set(13.5, 0, 4.5);
      this.rickshawGroup.rotation.y = -Math.PI / 2;
      this.scene.add(this.rickshawGroup);
    }
  }

  public syncUpgradePads(pads: UpgradeStationPad[]) {
    pads.forEach((pad) => {
      let entry = this.upgradePadMeshes.get(pad.id);
      if (!entry && !pad.isUnlocked) {
        const group = new THREE.Group();
        group.name = `upgrade_pad_${pad.id}`;
        group.position.set(pad.position.x, 0.02, pad.position.z);

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

        const remaining = pad.cost - pad.paid;
        const canvas = entry.textTexture.image as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, 512, 512);

        const progress = Math.min(pad.paid / pad.cost, 1);
        ctx.beginPath();
        ctx.arc(256, 256, 240, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 28;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // English Title (with food name in Bengali if station)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 50px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(pad.titleEn, 256, 185);

        // Taka Cost
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 68px "JetBrains Mono", monospace';
        ctx.fillText(`৳ ${remaining}`, 256, 265);

        ctx.fillStyle = '#a7f3d0';
        ctx.font = '600 36px "Hind Siliguri", sans-serif';
        ctx.fillText(pad.titleBn, 256, 335);

        entry.textTexture.needsUpdate = true;
      }
    });
  }

  public syncCash(cashPiles: CashPile[]) {
    const currentIds = new Set(cashPiles.map((c) => c.id));
    for (const [id, mesh] of this.cashMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.cashMeshes.delete(id);
      }
    }

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

  public syncWarmerStock(warmerStock: Record<FoodType, number>) {
    Object.entries(warmerStock).forEach(([typeStr, count]) => {
      const type = typeStr as FoodType;
      const station = this.stationMeshes.get(type);
      if (!station) return;

      while (station.warmerItems.length < count) {
        const foodMesh = createFoodMesh(type);
        const idx = station.warmerItems.length;
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        foodMesh.position.set(
          0.35 + col * 0.22,
          1.18 + row * 0.15,
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

  public syncPlayerStack(stack: FoodType[]) {
    while (this.playerStackMeshes.length < stack.length) {
      const idx = this.playerStackMeshes.length;
      const type = stack[idx];
      const foodMesh = createFoodMesh(type);
      foodMesh.position.set(0, idx * 0.22, 0);
      this.playerStackAnchor.add(foodMesh);
      this.playerStackMeshes.push(foodMesh);
    }

    while (this.playerStackMeshes.length > stack.length) {
      const item = this.playerStackMeshes.pop();
      if (item) this.playerStackAnchor.remove(item);
    }

    const isCarrying = stack.length > 0;
    const targetArmRotX = isCarrying ? -Math.PI / 2.5 : 0;
    this.playerLeftArm.rotation.x = targetArmRotX;
    this.playerRightArm.rotation.x = targetArmRotX;
  }

  public syncCustomers(
    customers: {
      id: string;
      position: { x: number; z: number };
      state: string;
      order: { itemType: FoodType; required: number; delivered: number };
    }[]
  ) {
    const currentIds = new Set(customers.map((c) => c.id));
    for (const [id, entry] of this.customerMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(entry.group);
        this.customerMeshes.delete(id);
      }
    }

    customers.forEach((c) => {
      let entry = this.customerMeshes.get(c.id);
      if (!entry) {
        const clothesColors = [0x059669, 0xd97706, 0x7c3aed, 0xdc2626, 0x0284c7];
        const color = clothesColors[Math.floor(Math.random() * clothesColors.length)];
        const parts = createCharacterMesh({
          role: 'customer',
          clothesColor: color,
        });

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

      // Order Bubble in clean English with Bengali Food Name
      const canvas = entry.speechCanvas;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 256, 160);

      if (c.state === 'WAITING') {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(8, 8, 240, 140, 24);
        ctx.fill();
        ctx.stroke();

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
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(8, 8, 240, 140, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 44px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('বাহ! খাসা!', 128, 75);

        ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Tasty!', 128, 120);

        entry.speechBubbleGroup.visible = true;
      } else {
        entry.speechBubbleGroup.visible = false;
      }
      entry.speechTexture.needsUpdate = true;
    });
  }

  public syncStaff(
    staffList: {
      id: string;
      role: 'CHEF' | 'WAITER' | 'CLEANER';
      position: { x: number; z: number };
      stack: FoodType[];
    }[]
  ) {
    const currentIds = new Set(staffList.map((s) => s.id));
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
          clothesColor: s.role === 'CHEF' ? 0xffffff : 0x15803d,
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

      const isCarrying = s.stack.length > 0;
      entry.leftArm.rotation.x = isCarrying ? -Math.PI / 2.5 : 0;
      entry.rightArm.rotation.x = isCarrying ? -Math.PI / 2.5 : 0;
    });
  }

  /**
   * High performance render and physics animation loop
   */
  private animate = () => {
    if (this.isDestroyed) return;

    this.frameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Silky Smooth Player Movement Physics
    const targetVx = this.inputVector.x * this.playerSpeed;
    const targetVz = this.inputVector.y * this.playerSpeed;

    // Smooth velocity interpolation (inertia & momentum)
    this.currentVelocity.x = THREE.MathUtils.damp(this.currentVelocity.x, targetVx, 18, delta);
    this.currentVelocity.y = THREE.MathUtils.damp(this.currentVelocity.y, targetVz, 18, delta);

    const speed = this.currentVelocity.length();
    const isMoving = speed > 0.2;

    if (isMoving) {
      this.playerPos.x += this.currentVelocity.x * delta;
      this.playerPos.y += this.currentVelocity.y * delta;

      // Soft layout boundaries
      this.playerPos.x = Math.max(-16.5, Math.min(16.5, this.playerPos.x));
      this.playerPos.y = Math.max(-13.5, Math.min(8.2, this.playerPos.y));

      // Avoid counter penetration
      if (this.playerPos.y >= 3.8 && this.playerPos.y <= 5.2 && Math.abs(this.playerPos.x) < 2.5) {
        this.playerPos.y = 3.75;
      }

      // Smooth rotational damping (turn smoothly, no sudden snaps!)
      const targetAngle = Math.atan2(this.currentVelocity.x, this.currentVelocity.y);
      let diff = targetAngle - this.playerAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.playerAngle += diff * (1 - Math.exp(-18 * delta));

      // Walking leg swing & torso banking
      this.walkTime += delta * 14 * (speed / this.playerSpeed);
      this.playerLeftLeg.rotation.x = Math.sin(this.walkTime) * 0.65;
      this.playerRightLeg.rotation.x = -Math.sin(this.walkTime) * 0.65;

      // Subtle torso lean into movement direction
      this.playerTorso.rotation.z = -this.currentVelocity.x * 0.02;

      // Stack wobble kinematics
      if (this.playerStackMeshes.length > 0) {
        const wobbleZ = Math.sin(this.walkTime * 0.8) * 0.07;
        const wobbleX = Math.cos(this.walkTime * 0.8) * 0.05;
        this.playerStackAnchor.rotation.set(wobbleX, 0, wobbleZ);
      }
    } else {
      this.playerLeftLeg.rotation.x = 0;
      this.playerRightLeg.rotation.x = 0;
      this.playerTorso.rotation.z = 0;
      if (this.playerStackMeshes.length > 0) {
        this.playerStackAnchor.rotation.set(0, 0, 0);
      }
    }

    this.playerGroup.position.set(this.playerPos.x, 0, this.playerPos.y);
    this.playerGroup.rotation.y = this.playerAngle;

    // 2. Camera smooth follow (2nd order exponential damping)
    this.cameraTarget.x = THREE.MathUtils.damp(this.cameraTarget.x, this.playerPos.x, 8, delta);
    this.cameraTarget.z = THREE.MathUtils.damp(this.cameraTarget.z, this.playerPos.y, 8, delta);
    this.camera.position.set(
      this.cameraTarget.x + 24,
      this.cameraTarget.y + 28,
      this.cameraTarget.z + 24
    );
    this.camera.lookAt(this.cameraTarget);

    // 3. Animate bubbling oil vats
    this.stationMeshes.forEach((station) => {
      station.oilMesh.position.y = 1.08 + Math.sin(elapsedTime * 6) * 0.02;
    });

    // 4. Animate Upgrade Pad outer rings
    this.upgradePadMeshes.forEach((pad) => {
      const scale = 1 + Math.sin(elapsedTime * 4) * 0.04;
      pad.ringMesh.scale.set(scale, scale, 1);
    });

    // 5. Render
    this.renderer.render(this.scene, this.camera);
  };

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
