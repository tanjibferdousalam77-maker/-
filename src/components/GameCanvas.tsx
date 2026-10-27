import { useEffect, useRef } from 'react';
import { RestaurantScene } from '../3d/RestaurantScene';
import { FoodType, UpgradeStationPad, DiningTable, Customer, CashPile, MamaStaff } from '../types/game';

interface GameCanvasProps {
  inputVector: { vx: number; vz: number };
  playerSpeed: number;
  playerStack: FoodType[];
  unlockedStations: FoodType[];
  tables: DiningTable[];
  rickshawUnlocked: boolean;
  upgradePads: UpgradeStationPad[];
  cashPiles: CashPile[];
  warmerStock: Record<FoodType, number>;
  customers: Customer[];
  staffEntities: MamaStaff[];
  onSyncPlayerPos: (x: number, z: number) => void;
}

export function GameCanvas({
  inputVector,
  playerSpeed,
  playerStack,
  unlockedStations,
  tables,
  rickshawUnlocked,
  upgradePads,
  cashPiles,
  warmerStock,
  customers,
  staffEntities,
  onSyncPlayerPos,
}: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RestaurantScene | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new RestaurantScene(mountRef.current);
    sceneRef.current = scene;

    // Sync loop for game engine interactions (15 times per second)
    const interval = setInterval(() => {
      if (sceneRef.current) {
        onSyncPlayerPos(sceneRef.current.playerPos.x, sceneRef.current.playerPos.y);
      }
    }, 66);

    return () => {
      clearInterval(interval);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [onSyncPlayerPos]);

  // Update movement inputs into Three.js physics directly
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setMovementInput(inputVector.vx, inputVector.vz);
  }, [inputVector]);

  // Update player speed
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setPlayerSpeed(playerSpeed);
  }, [playerSpeed]);

  // Sync cooking stations
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.syncStations(unlockedStations);
  }, [unlockedStations]);

  // Sync dining tables
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.syncTables(tables);
  }, [tables]);

  // Sync rickshaw delivery
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.syncRickshaw(rickshawUnlocked);
  }, [rickshawUnlocked]);

  // Sync upgrade pads
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.syncUpgradePads(upgradePads);
  }, [upgradePads]);

  // Sync cash piles
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.syncCash(cashPiles);
  }, [cashPiles]);

  // Sync warmer stock
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.syncWarmerStock(warmerStock);
  }, [warmerStock]);

  // Sync player stack
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.syncPlayerStack(playerStack);
  }, [playerStack]);

  // Sync customers
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.syncCustomers(customers);
  }, [customers]);

  // Sync hired staff
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.syncStaff(staffEntities);
  }, [staffEntities]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#181512] cursor-crosshair"
    />
  );
}
