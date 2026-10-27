import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  FoodType,
  FOOD_DEFINITIONS,
  UpgradeStationPad,
  DiningTable,
  Customer,
  CashPile,
  MamaStaff,
  RickshawOrder,
  GameSaveState,
} from '../types/game';
import { sounds } from '../audio/soundManager';

const SAVE_STORAGE_KEY = 'dhaka_snack_ready_save_v1';

export function useGameEngine() {
  // Load initial state from LocalStorage or defaults
  const loadInitialState = (): GameSaveState => {
    try {
      const saved = localStorage.getItem(SAVE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return {
      money: 45, // Starter seed capital
      reputation: 5.0,
      totalServed: 0,
      playerSpeedLevel: 1,
      playerCapacityLevel: 1,
      unlockedStations: ['puri'],
      unlockedTables: [1],
      rickshawUnlocked: false,
      staff: {
        chefLevel: 0,
        waiterLevel: 0,
        cleanerLevel: 0,
      },
    };
  };

  const initial = loadInitialState();

  // Core Game State
  const [money, setMoney] = useState<number>(initial.money);
  const [totalServed, setTotalServed] = useState<number>(initial.totalServed);
  const [playerSpeedLevel, setPlayerSpeedLevel] = useState<number>(initial.playerSpeedLevel);
  const [playerCapacityLevel, setPlayerCapacityLevel] = useState<number>(initial.playerCapacityLevel);
  const [unlockedStations, setUnlockedStations] = useState<FoodType[]>(initial.unlockedStations);
  const [unlockedTables, setUnlockedTables] = useState<number[]>(initial.unlockedTables);
  const [rickshawUnlocked, setRickshawUnlocked] = useState<boolean>(initial.rickshawUnlocked);
  const [staff, setStaff] = useState(initial.staff);

  // Runtime dynamic states
  const [playerStack, setPlayerStack] = useState<FoodType[]>([]);
  const [playerPosition, setPlayerPosition] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [playerAngle, setPlayerAngle] = useState<number>(0);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [rushHourProgress, setRushHourProgress] = useState<number>(0);
  const [rushHourActive, setRushHourActive] = useState<boolean>(false);
  const [rickshawOrder, setRickshawOrder] = useState<RickshawOrder | null>(null);

  // Stock ready on warmers (max 8 per station)
  const [warmerStock, setWarmerStock] = useState<Record<FoodType, number>>({
    puri: 3,
    singara: 0,
    samosa: 0,
    jilapi: 0,
    cha: 0,
  });

  // Upgrades pads on the restaurant floor
  const [upgradePads, setUpgradePads] = useState<UpgradeStationPad[]>([
    {
      id: 'pad_singara',
      titleEn: 'Singara Fryer',
      titleBn: 'সিঙ্গারা ফ্রায়ার',
      cost: 80,
      paid: 0,
      type: 'FOOD_STATION',
      targetId: 'singara',
      position: { x: -4.5, z: -7 },
      radius: 1.6,
      isUnlocked: initial.unlockedStations.includes('singara'),
    },
    {
      id: 'pad_table_2',
      titleEn: 'Dining Table 2',
      titleBn: 'বসার টেবিল ২',
      cost: 140,
      paid: 0,
      type: 'TABLE',
      targetId: '2',
      position: { x: -9, z: 3 },
      radius: 1.6,
      isUnlocked: initial.unlockedTables.includes(2),
    },
    {
      id: 'pad_cha',
      titleEn: 'Dudh Cha Stall',
      titleBn: 'দুধ চা স্টল',
      cost: 180,
      paid: 0,
      type: 'FOOD_STATION',
      targetId: 'cha',
      position: { x: 14.5, z: -7 },
      radius: 1.6,
      isUnlocked: initial.unlockedStations.includes('cha'),
    },
    {
      id: 'pad_samosa',
      titleEn: 'Samosa Station',
      titleBn: 'সমুচা কাউন্টার',
      cost: 260,
      paid: 0,
      type: 'FOOD_STATION',
      targetId: 'samosa',
      position: { x: 4.5, z: -7 },
      radius: 1.6,
      isUnlocked: initial.unlockedStations.includes('samosa'),
    },
    {
      id: 'pad_rickshaw',
      titleEn: 'Rickshaw Delivery',
      titleBn: 'রিকশা টেকঅ্যাওয়ে',
      cost: 380,
      paid: 0,
      type: 'RICKSHAW',
      targetId: 'rickshaw',
      position: { x: 12.5, z: 2.2 },
      radius: 1.8,
      isUnlocked: initial.rickshawUnlocked,
    },
    {
      id: 'pad_table_3',
      titleEn: 'Dining Table 3',
      titleBn: 'বসার টেবিল ৩',
      cost: 420,
      paid: 0,
      type: 'TABLE',
      targetId: '3',
      position: { x: 8, z: -2 },
      radius: 1.6,
      isUnlocked: initial.unlockedTables.includes(3),
    },
    {
      id: 'pad_jilapi',
      titleEn: 'Hot Jilapi Pan',
      titleBn: 'গরম জিলাপি কড়াই',
      cost: 550,
      paid: 0,
      type: 'FOOD_STATION',
      targetId: 'jilapi',
      position: { x: 9.5, z: -7 },
      radius: 1.6,
      isUnlocked: initial.unlockedStations.includes('jilapi'),
    },
    {
      id: 'pad_table_4',
      titleEn: 'Dining Table 4',
      titleBn: 'বসার টেবিল ৪',
      cost: 650,
      paid: 0,
      type: 'TABLE',
      targetId: '4',
      position: { x: 8, z: 3 },
      radius: 1.6,
      isUnlocked: initial.unlockedTables.includes(4),
    },
    {
      id: 'pad_chef',
      titleEn: 'Hire Chef Mama',
      titleBn: 'বাবুর্চি মামা নিয়োগ',
      cost: 200,
      paid: 0,
      type: 'STAFF',
      targetId: 'chef',
      position: { x: 0, z: -10 },
      radius: 1.6,
      isUnlocked: initial.staff.chefLevel > 0,
    },
    {
      id: 'pad_waiter',
      titleEn: 'Hire Waiter Mama',
      titleBn: 'ওয়েটার মামা নিয়োগ',
      cost: 280,
      paid: 0,
      type: 'STAFF',
      targetId: 'waiter',
      position: { x: -3.5, z: 0 },
      radius: 1.6,
      isUnlocked: initial.staff.waiterLevel > 0,
    },
  ]);

  // Tables
  const [tables, setTables] = useState<DiningTable[]>([
    { id: 1, position: { x: -9, z: -2 }, isUnlocked: true, occupied: false, hasDirtyDishes: false, dishesCount: 0 },
    { id: 2, position: { x: -9, z: 3 }, isUnlocked: initial.unlockedTables.includes(2), occupied: false, hasDirtyDishes: false, dishesCount: 0 },
    { id: 3, position: { x: 8, z: -2 }, isUnlocked: initial.unlockedTables.includes(3), occupied: false, hasDirtyDishes: false, dishesCount: 0 },
    { id: 4, position: { x: 8, z: 3 }, isUnlocked: initial.unlockedTables.includes(4), occupied: false, hasDirtyDishes: false, dishesCount: 0 },
  ]);

  // Customers
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Cash piles dropped on floor / tables
  const [cashPiles, setCashPiles] = useState<CashPile[]>([]);

  // Hired staff entities
  const [staffEntities, setStaffEntities] = useState<MamaStaff[]>([]);

  // Refs for smooth animation loop
  const inputVectorRef = useRef<{ vx: number; vz: number }>({ vx: 0, vz: 0 });
  const playerPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const lastTransferTimeRef = useRef<number>(0);
  const lastPadTickTimeRef = useRef<number>(0);
  const lastCustomerSpawnTimeRef = useRef<number>(0);
  const lastFryerTickRef = useRef<number>(0);
  const lastRickshawCheckRef = useRef<number>(0);

  // Max stack capacity based on player level
  const maxStackCapacity = [4, 6, 8, 12, 16, 20][Math.min(playerCapacityLevel - 1, 5)];
  const moveSpeed = 5.2 + (playerSpeedLevel - 1) * 1.3;

  // Sync staff entities with staff levels
  useEffect(() => {
    const list: MamaStaff[] = [];
    if (staff.chefLevel > 0) {
      list.push({
        id: 'staff_chef',
        role: 'CHEF',
        nameBn: 'বাবুর্চি মামা',
        nameEn: 'Chef Mama',
        position: { x: -2, z: -9.5 },
        targetPosition: { x: -2, z: -9.5 },
        state: 'IDLE',
        stack: [],
        capacity: 4,
        speed: 4.5,
        level: staff.chefLevel,
      });
    }
    if (staff.waiterLevel > 0) {
      list.push({
        id: 'staff_waiter',
        role: 'WAITER',
        nameBn: 'সার্ভিস বয় মামা',
        nameEn: 'Waiter Mama',
        position: { x: -2, z: 2 },
        targetPosition: { x: -2, z: 2 },
        state: 'IDLE',
        stack: [],
        capacity: 4 + staff.waiterLevel * 2,
        speed: 5.5 + staff.waiterLevel * 0.8,
        level: staff.waiterLevel,
      });
    }
    setStaffEntities(list);
  }, [staff]);

  // Save game automatically
  useEffect(() => {
    const saveState: GameSaveState = {
      money,
      reputation: 5.0,
      totalServed,
      playerSpeedLevel,
      playerCapacityLevel,
      unlockedStations,
      unlockedTables,
      rickshawUnlocked,
      staff,
    };
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saveState));
    } catch {
      // Ignore
    }
  }, [
    money,
    totalServed,
    playerSpeedLevel,
    playerCapacityLevel,
    unlockedStations,
    unlockedTables,
    rickshawUnlocked,
    staff,
  ]);

  // Manual Trigger or Periodic Rush Hour
  const triggerRushHour = useCallback(() => {
    if (rushHourActive) return;
    setRushHourActive(true);
    setRushHourProgress(100);
    sounds.playUnlock();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#dc2626', '#facc15'],
    });

    const timer = setInterval(() => {
      setRushHourProgress((prev) => {
        if (prev <= 2) {
          clearInterval(timer);
          setRushHourActive(false);
          return 0;
        }
        return prev - 2;
      });
    }, 500); // 25 seconds total rush duration
  }, [rushHourActive]);

  // Handle movement inputs from joystick / keyboard
  const setInputVector = useCallback((vx: number, vz: number) => {
    inputVectorRef.current = { vx, vz };
  }, []);

  // Upgrade handler for Bottom Drawer UI
  const upgradePlayerSpeed = useCallback(() => {
    const cost = playerSpeedLevel * 100;
    if (money >= cost && playerSpeedLevel < 5) {
      setMoney((m) => m - cost);
      setPlayerSpeedLevel((lvl) => lvl + 1);
      sounds.playUnlock();
    }
  }, [money, playerSpeedLevel]);

  const upgradePlayerCapacity = useCallback(() => {
    const cost = playerCapacityLevel * 120;
    if (money >= cost && playerCapacityLevel < 6) {
      setMoney((m) => m - cost);
      setPlayerCapacityLevel((lvl) => lvl + 1);
      sounds.playUnlock();
    }
  }, [money, playerCapacityLevel]);

  const upgradeStaffLevel = useCallback(
    (role: 'chef' | 'waiter' | 'cleaner') => {
      const current =
        role === 'chef'
          ? staff.chefLevel
          : role === 'waiter'
          ? staff.waiterLevel
          : staff.cleanerLevel;
      const cost = (current + 1) * 150;
      if (money >= cost) {
        setMoney((m) => m - cost);
        setStaff((prev) => ({
          ...prev,
          [`${role}Level`]: current + 1,
        }));
        sounds.playUnlock();
      }
    },
    [money, staff]
  );

  const resetGame = useCallback(() => {
    localStorage.removeItem(SAVE_STORAGE_KEY);
    window.location.reload();
  }, []);

  // Main simulation tick loop (60 FPS)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const stationCoordinates: Record<FoodType, { x: number; z: number }> = {
      puri: { x: -9.5, z: -10 },
      singara: { x: -4.5, z: -10 },
      samosa: { x: 4.5, z: -10 },
      jilapi: { x: 9.5, z: -10 },
      cha: { x: 14.5, z: -10 },
    };

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // 1. Move Player
      const { vx, vz } = inputVectorRef.current;
      const length = Math.hypot(vx, vz);
      const isCurrentlyMoving = length > 0.05;
      setIsMoving(isCurrentlyMoving);

      if (isCurrentlyMoving) {
        const nx = vx / length;
        const nz = vz / length;
        const speed = moveSpeed;

        let newX = playerPosRef.current.x + nx * speed * dt;
        let newZ = playerPosRef.current.z + nz * speed * dt;

        // Boundaries: Keep player inside cafe layout
        newX = Math.max(-16.5, Math.min(16.5, newX));
        newZ = Math.max(-13.5, Math.min(8.2, newZ));

        // Avoid walking through the front counter
        if (newZ >= 3.8 && newZ <= 5.2 && Math.abs(newX) < 2.5) {
          // Push player back
          newZ = playerPosRef.current.z;
        }

        playerPosRef.current = { x: newX, z: newZ };
        setPlayerPosition({ x: newX, z: newZ });
        setPlayerAngle(Math.atan2(nx, nz));
      }

      const px = playerPosRef.current.x;
      const pz = playerPosRef.current.z;

      // 2. Fryer Production Cycle: Auto cook snacks when warmer < 8
      if (currentTime - lastFryerTickRef.current > 1800) {
        lastFryerTickRef.current = currentTime;
        const chefBonus = staff.chefLevel > 0 ? 1 : 0;
        setWarmerStock((prev) => {
          const next = { ...prev };
          unlockedStations.forEach((type) => {
            if (next[type] < 8) {
              next[type] = Math.min(8, next[type] + 1 + chefBonus);
              sounds.playFrySizzle();
            }
          });
          return next;
        });
      }

      // 3. Stacking items onto Player from Warmers
      if (currentTime - lastTransferTimeRef.current > 140) {
        unlockedStations.forEach((type) => {
          const sPos = stationCoordinates[type];
          const dist = Math.hypot(px - sPos.x, pz - sPos.z);
          // Warmer pickup zone
          if (dist < 2.0 && warmerStock[type] > 0) {
            setPlayerStack((stack) => {
              if (stack.length < maxStackCapacity) {
                lastTransferTimeRef.current = currentTime;
                sounds.playStackPop(stack.length + 1);
                // Deduct from warmer
                setWarmerStock((ws) => ({
                  ...ws,
                  [type]: Math.max(0, ws[type] - 1),
                }));
                return [...stack, type];
              }
              return stack;
            });
          }
        });
      }

      // 4. Serving Counter Customers
      const isNearCounter = pz >= 2.6 && pz <= 4.2 && Math.abs(px) < 3.2;
      if (isNearCounter && currentTime - lastTransferTimeRef.current > 140) {
        setCustomers((prevCustomers) => {
          let updated = false;
          const nextCustomers = prevCustomers.map((cust) => {
            if (cust.state === 'WAITING' && cust.type === 'COUNTER' && !updated) {
              const req = cust.order.required - cust.order.delivered;
              if (req > 0) {
                // Check if player has this item
                const itemIdx = playerStack.indexOf(cust.order.itemType);
                if (itemIdx !== -1) {
                  updated = true;
                  lastTransferTimeRef.current = currentTime;
                  sounds.playDeliver();

                  // Remove 1 item from player stack
                  setPlayerStack((st) => {
                    const c = [...st];
                    c.splice(itemIdx, 1);
                    return c;
                  });

                  const newDelivered = cust.order.delivered + 1;
                  if (newDelivered >= cust.order.required) {
                    // Order fulfilled! Drop cash and customer leaves
                    const def = FOOD_DEFINITIONS[cust.order.itemType];
                    const earnings = def.sellPrice * cust.order.required * (rushHourActive ? 2 : 1);
                    setCashPiles((cp) => [
                      ...cp,
                      {
                        id: `cash_${Date.now()}_${Math.random()}`,
                        amount: earnings,
                        position: { x: 0.8 + (Math.random() - 0.5) * 1.5, z: 4.2 },
                        collected: false,
                      },
                    ]);
                    setTotalServed((s) => s + 1);
                    return { ...cust, state: 'LEAVING' as const, order: { ...cust.order, delivered: newDelivered } };
                  }
                  return { ...cust, order: { ...cust.order, delivered: newDelivered } };
                }
              }
            }
            return cust;
          });
          return nextCustomers;
        });
      }

      // 5. Serving Dine-In Tables
      tables.forEach((table) => {
        if (!table.isUnlocked) return;
        const dist = Math.hypot(px - table.position.x, pz - table.position.z);
        if (dist < 2.2 && currentTime - lastTransferTimeRef.current > 140) {
          // Check if table customer needs food
          setCustomers((prevCustomers) => {
            let updated = false;
            return prevCustomers.map((cust) => {
              if (cust.tableId === table.id && cust.state === 'WAITING' && !updated) {
                const req = cust.order.required - cust.order.delivered;
                const itemIdx = playerStack.indexOf(cust.order.itemType);
                if (req > 0 && itemIdx !== -1) {
                  updated = true;
                  lastTransferTimeRef.current = currentTime;
                  sounds.playDeliver();

                  setPlayerStack((st) => {
                    const c = [...st];
                    c.splice(itemIdx, 1);
                    return c;
                  });

                  const newDelivered = cust.order.delivered + 1;
                  if (newDelivered >= cust.order.required) {
                    // Start eating!
                    return {
                      ...cust,
                      state: 'EATING' as const,
                      eatTimer: 3.5,
                      order: { ...cust.order, delivered: newDelivered },
                    };
                  }
                  return { ...cust, order: { ...cust.order, delivered: newDelivered } };
                }
              }
              return cust;
            });
          });
        }
      });

      // 6. Clearing Dirty Dishes from Tables to Trash Bin
      tables.forEach((table) => {
        if (table.hasDirtyDishes) {
          const dist = Math.hypot(px - table.position.x, pz - table.position.z);
          if (dist < 2.2) {
            // Clean table
            setTables((tbls) =>
              tbls.map((t) => (t.id === table.id ? { ...t, hasDirtyDishes: false, occupied: false } : t))
            );
            sounds.playDeliver();
          }
        }
      });

      // 7. Collecting Cash ৳ Bills
      cashPiles.forEach((cash) => {
        if (!cash.collected) {
          const dist = Math.hypot(px - cash.position.x, pz - cash.position.z);
          if (dist < 1.8) {
            cash.collected = true;
            setMoney((m) => m + cash.amount);
            sounds.playCash();
          }
        }
      });
      // Clean up collected piles
      setCashPiles((cp) => cp.filter((c) => !c.collected));

      // 8. Stepping on Standing Upgrade Pads
      if (currentTime - lastPadTickTimeRef.current > 100) {
        upgradePads.forEach((pad) => {
          if (!pad.isUnlocked) {
            const dist = Math.hypot(px - pad.position.x, pz - pad.position.z);
            if (dist < pad.radius && money > 0) {
              const remaining = pad.cost - pad.paid;
              const deduct = Math.min(money, Math.min(10, remaining));
              if (deduct > 0) {
                lastPadTickTimeRef.current = currentTime;
                sounds.playUpgradeTick();
                setMoney((m) => m - deduct);

                setUpgradePads((pads) =>
                  pads.map((p) => {
                    if (p.id === pad.id) {
                      const newPaid = p.paid + deduct;
                      if (newPaid >= p.cost) {
                        // Unlocked!
                        sounds.playUnlock();
                        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });

                        // Apply unlocked effect
                        if (p.type === 'FOOD_STATION') {
                          setUnlockedStations((st) => Array.from(new Set([...st, p.targetId as FoodType])));
                        } else if (p.type === 'TABLE') {
                          const tableId = parseInt(p.targetId, 10);
                          setUnlockedTables((tb) => Array.from(new Set([...tb, tableId])));
                          setTables((tb) =>
                            tb.map((t) => (t.id === tableId ? { ...t, isUnlocked: true } : t))
                          );
                        } else if (p.type === 'RICKSHAW') {
                          setRickshawUnlocked(true);
                        } else if (p.type === 'STAFF') {
                          if (p.targetId === 'chef') {
                            setStaff((s) => ({ ...s, chefLevel: 1 }));
                          } else if (p.targetId === 'waiter') {
                            setStaff((s) => ({ ...s, waiterLevel: 1 }));
                          }
                        }
                        return { ...p, paid: newPaid, isUnlocked: true };
                      }
                      return { ...p, paid: newPaid };
                    }
                    return p;
                  })
                );
              }
            }
          }
        });
      }

      // 9. Customer Eating & Lifecycle Update
      setCustomers((prevCustomers) => {
        return prevCustomers
          .map((cust) => {
            // Eating countdown
            if (cust.state === 'EATING') {
              const nextEatTimer = cust.eatTimer - dt;
              if (nextEatTimer <= 0) {
                // Done eating! Drops big cash tip & leaves dirty table
                sounds.playEatChomp();
                const def = FOOD_DEFINITIONS[cust.order.itemType];
                const tipAmount = Math.round(def.sellPrice * cust.order.required * 1.5);
                const table = tables.find((t) => t.id === cust.tableId);
                if (table) {
                  setCashPiles((cp) => [
                    ...cp,
                    {
                      id: `cash_tip_${Date.now()}_${Math.random()}`,
                      amount: tipAmount,
                      position: { x: table.position.x, z: table.position.z },
                      collected: false,
                    },
                  ]);
                  setTables((tb) =>
                    tb.map((t) => (t.id === table.id ? { ...t, hasDirtyDishes: true } : t))
                  );
                }
                setTotalServed((s) => s + 1);
                return { ...cust, state: 'LEAVING' as const };
              }
              return { ...cust, eatTimer: nextEatTimer };
            }

            // Move customers toward target
            if (cust.state === 'WALKING_IN') {
              const dx = cust.targetPosition.x - cust.position.x;
              const dz = cust.targetPosition.z - cust.position.z;
              const dist = Math.hypot(dx, dz);
              if (dist < 0.2) {
                return { ...cust, state: 'WAITING' as const };
              }
              return {
                ...cust,
                position: {
                  x: cust.position.x + (dx / dist) * 4.0 * dt,
                  z: cust.position.z + (dz / dist) * 4.0 * dt,
                },
              };
            }

            if (cust.state === 'LEAVING') {
              const dx = 0 - cust.position.x;
              const dz = 16 - cust.position.z; // walk out to sidewalk
              const dist = Math.hypot(dx, dz);
              if (dist < 0.4 || cust.position.z >= 15.5) {
                return null; // remove from scene
              }
              return {
                ...cust,
                position: {
                  x: cust.position.x + (dx / dist) * 4.2 * dt,
                  z: cust.position.z + (dz / dist) * 4.2 * dt,
                },
              };
            }

            return cust;
          })
          .filter(Boolean) as Customer[];
      });

      // 10. Customer Spawner
      const spawnInterval = rushHourActive ? 1600 : 3600;
      if (currentTime - lastCustomerSpawnTimeRef.current > spawnInterval) {
        lastCustomerSpawnTimeRef.current = currentTime;

        // Choose between Counter or Dine-In Table
        const freeTable = tables.find((t) => t.isUnlocked && !t.occupied && !t.hasDirtyDishes);
        const shouldDineIn = freeTable && Math.random() > 0.45;

        // Available snacks to order
        const availableItems = unlockedStations;
        const orderedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        const orderCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 items

        if (shouldDineIn && freeTable) {
          // Mark table as occupied
          setTables((tb) => tb.map((t) => (t.id === freeTable.id ? { ...t, occupied: true } : t)));
          setCustomers((custs) => [
            ...custs,
            {
              id: `cust_${Date.now()}_${Math.random()}`,
              skinTone: '#c68642',
              clothesColor: 0x059669,
              type: 'DINE_IN',
              state: 'WALKING_IN',
              position: { x: (Math.random() - 0.5) * 8, z: 14 },
              targetPosition: { x: freeTable.position.x, z: freeTable.position.z + 1.2 },
              order: { itemType: orderedItem, required: orderCount, delivered: 0 },
              tableId: freeTable.id,
              eatTimer: 3.5,
              maxEatTimer: 3.5,
              waitTimer: 0,
            },
          ]);
        } else {
          // Counter line
          const counterCount = customers.filter((c) => c.type === 'COUNTER' && c.state !== 'LEAVING').length;
          if (counterCount < 4) {
            const queueZ = 6.2 + counterCount * 1.5;
            setCustomers((custs) => [
              ...custs,
              {
                id: `cust_${Date.now()}_${Math.random()}`,
                skinTone: '#c68642',
                clothesColor: 0x0284c7,
                type: 'COUNTER',
                state: 'WALKING_IN',
                position: { x: 0, z: 14 },
                targetPosition: { x: (Math.random() - 0.5) * 1.2, z: queueZ },
                order: { itemType: orderedItem, required: orderCount, delivered: 0 },
                eatTimer: 0,
                maxEatTimer: 0,
                waitTimer: 0,
              },
            ]);
          }
        }
      }

      // 11. Rickshaw Delivery Arrival (Every 25 seconds if unlocked)
      if (rickshawUnlocked && currentTime - lastRickshawCheckRef.current > 24000) {
        lastRickshawCheckRef.current = currentTime;
        if (!rickshawOrder) {
          sounds.playRickshawBell();
          const items = [
            { itemType: unlockedStations[0], required: 3, delivered: 0 },
            ...(unlockedStations.length > 1
              ? [{ itemType: unlockedStations[1], required: 2, delivered: 0 }]
              : []),
          ];
          setRickshawOrder({
            id: `rickshaw_${Date.now()}`,
            items,
            payout: 160 + unlockedStations.length * 40,
            active: true,
            arrivalTime: currentTime,
          });
        }
      }

      // Rickshaw dropoff check
      if (rickshawOrder && rickshawOrder.active) {
        const dist = Math.hypot(px - 12.5, pz - 4.5);
        if (dist < 2.5 && currentTime - lastTransferTimeRef.current > 140) {
          // Check if player has any matching items
          for (const item of rickshawOrder.items) {
            if (item.delivered < item.required) {
              const idx = playerStack.indexOf(item.itemType);
              if (idx !== -1) {
                lastTransferTimeRef.current = currentTime;
                sounds.playDeliver();
                setPlayerStack((st) => {
                  const c = [...st];
                  c.splice(idx, 1);
                  return c;
                });
                item.delivered += 1;

                // Check if all complete
                const isAllDone = rickshawOrder.items.every((it) => it.delivered >= it.required);
                if (isAllDone) {
                  sounds.playCash();
                  sounds.playRickshawBell();
                  setMoney((m) => m + rickshawOrder.payout);
                  setRickshawOrder(null);
                  confetti({ particleCount: 60, spread: 70, origin: { x: 0.8, y: 0.6 } });
                }
                break;
              }
            }
          }
        }
      }

      // 12. Waiter Mama Automation (Runs from warmers to customers)
      if (staff.waiterLevel > 0) {
        setStaffEntities((staffs) =>
          staffs.map((st) => {
            if (st.role !== 'WAITER') return st;

            // Simple state machine: if empty, find warmer that has stock.
            // If has food, deliver to waiting customer or table!
            let newX = st.position.x;
            let newZ = st.position.z;

            if (st.stack.length === 0) {
              // Move towards first warmer with stock
              const targetType = unlockedStations.find((t) => warmerStock[t] > 0);
              if (targetType) {
                const sPos = stationCoordinates[targetType];
                const dx = sPos.x - st.position.x;
                const dz = sPos.z - st.position.z;
                const d = Math.hypot(dx, dz);
                if (d > 0.4) {
                  newX += (dx / d) * st.speed * dt;
                  newZ += (dz / d) * st.speed * dt;
                } else {
                  // Pickup 2 items
                  setWarmerStock((ws) => ({ ...ws, [targetType]: Math.max(0, ws[targetType] - 2) }));
                  sounds.playStackPop(2);
                  return { ...st, stack: [targetType, targetType], position: { x: newX, z: newZ } };
                }
              }
            } else {
              // Deliver to counter
              const dx = 0 - st.position.x;
              const dz = 3.5 - st.position.z;
              const d = Math.hypot(dx, dz);
              if (d > 0.4) {
                newX += (dx / d) * st.speed * dt;
                newZ += (dz / d) * st.speed * dt;
              } else {
                // Drop to customer
                const handed = st.stack[0];
                sounds.playDeliver();
                return { ...st, stack: st.stack.slice(1), position: { x: newX, z: newZ } };
              }
            }

            return { ...st, position: { x: newX, z: newZ } };
          })
        );
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    money,
    moveSpeed,
    maxStackCapacity,
    unlockedStations,
    unlockedTables,
    warmerStock,
    playerStack,
    customers,
    tables,
    cashPiles,
    upgradePads,
    rickshawUnlocked,
    rickshawOrder,
    rushHourActive,
    staff,
  ]);

  return {
    money,
    totalServed,
    playerSpeedLevel,
    playerCapacityLevel,
    maxStackCapacity,
    unlockedStations,
    unlockedTables,
    rickshawUnlocked,
    rickshawOrder,
    staff,
    playerStack,
    playerPosition,
    playerAngle,
    isMoving,
    warmerStock,
    upgradePads,
    tables,
    customers,
    cashPiles,
    staffEntities,
    rushHourActive,
    rushHourProgress,
    setInputVector,
    upgradePlayerSpeed,
    upgradePlayerCapacity,
    upgradeStaffLevel,
    triggerRushHour,
    resetGame,
  };
}
