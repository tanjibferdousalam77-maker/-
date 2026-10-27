export type FoodType = 'puri' | 'singara' | 'samosa' | 'jilapi' | 'cha';

export interface FoodDefinition {
  id: FoodType;
  nameBn: string;
  nameEn: string;
  description: string;
  cookDuration: number; // in seconds
  sellPrice: number; // in ৳ Taka
  color: string;
  stationUnlockCost: number; // 0 for puri (starting)
  level: number;
}

export const FOOD_DEFINITIONS: Record<FoodType, FoodDefinition> = {
  puri: {
    id: 'puri',
    nameBn: 'পুরি',
    nameEn: 'Puri',
    description: 'Crispy, puffed golden deep-fried bread served piping hot.',
    cookDuration: 2.2,
    sellPrice: 15,
    color: '#f59e0b',
    stationUnlockCost: 0,
    level: 1,
  },
  singara: {
    id: 'singara',
    nameBn: 'সিঙ্গারা',
    nameEn: 'Singara',
    description: 'Flaky pastry packed with spiced potato, peanuts & cauliflower.',
    cookDuration: 2.8,
    sellPrice: 25,
    color: '#d97706',
    stationUnlockCost: 80,
    level: 1,
  },
  samosa: {
    id: 'samosa',
    nameBn: 'সমুচা',
    nameEn: 'Samosa',
    description: 'Crispy thin triangular snack with minced meat and onions.',
    cookDuration: 3.2,
    sellPrice: 35,
    color: '#b45309',
    stationUnlockCost: 250,
    level: 1,
  },
  jilapi: {
    id: 'jilapi',
    nameBn: 'জিলাপি',
    nameEn: 'Jilapi',
    description: 'Hot syrupy saffron pretzel spirals fried to perfection.',
    cookDuration: 3.8,
    sellPrice: 50,
    color: '#ea580c',
    stationUnlockCost: 550,
    level: 1,
  },
  cha: {
    id: 'cha',
    nameBn: 'দুধ চা',
    nameEn: 'Dudh Cha',
    description: 'Strong Bangladeshi spiced milk tea boiled in a brass kettle.',
    cookDuration: 2.5,
    sellPrice: 20,
    color: '#78350f',
    stationUnlockCost: 180,
    level: 1,
  },
};

export interface UpgradeStationPad {
  id: string;
  titleEn: string;
  titleBn: string;
  cost: number;
  paid: number;
  type: 'FOOD_STATION' | 'TABLE' | 'STAFF' | 'RICKSHAW';
  targetId: string;
  position: { x: number; z: number };
  radius: number;
  isUnlocked: boolean;
  requiredParentId?: string;
}

export interface Customer {
  id: string;
  skinTone: string;
  clothesColor: number;
  type: 'COUNTER' | 'DINE_IN';
  state: 'WALKING_IN' | 'WAITING' | 'EATING' | 'LEAVING';
  position: { x: number; z: number };
  targetPosition: { x: number; z: number };
  order: {
    itemType: FoodType;
    required: number;
    delivered: number;
  };
  tableId?: number;
  chairIndex?: number;
  eatTimer: number;
  maxEatTimer: number;
  waitTimer: number;
}

export interface DiningTable {
  id: number;
  position: { x: number; z: number };
  isUnlocked: boolean;
  occupied: boolean;
  customerId?: string;
  hasDirtyDishes: boolean;
  dishesCount: number;
}

export interface MamaStaff {
  id: string;
  role: 'CHEF' | 'WAITER' | 'CLEANER';
  nameBn: string;
  nameEn: string;
  position: { x: number; z: number };
  targetPosition: { x: number; z: number };
  state: 'IDLE' | 'MOVING_TO_WARMER' | 'MOVING_TO_COUNTER' | 'MOVING_TO_TABLE' | 'CLEANING';
  stack: FoodType[];
  capacity: number;
  speed: number;
  level: number;
}

export interface CashPile {
  id: string;
  amount: number;
  position: { x: number; z: number };
  collected: boolean;
}

export interface RickshawOrder {
  id: string;
  items: { itemType: FoodType; required: number; delivered: number }[];
  payout: number;
  active: boolean;
  arrivalTime: number;
}

export interface GameSaveState {
  money: number;
  reputation: number;
  totalServed: number;
  playerSpeedLevel: number;
  playerCapacityLevel: number;
  unlockedStations: FoodType[];
  unlockedTables: number[]; // Table IDs unlocked
  rickshawUnlocked: boolean;
  staff: {
    chefLevel: number;
    waiterLevel: number;
    cleanerLevel: number;
  };
}
