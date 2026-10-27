import { useEffect, useRef } from 'react';
import { RestaurantScene } from '../3d/RestaurantScene';
import { FoodType, UpgradeStationPad, DiningTable, Customer, CashPile, MamaStaff } from '../types/game';

interface GameCanvasProps {
  playerPosition: { x: number; z: number };
  playerAngle: number;
  isMoving: boolean;
  playerStack: FoodType[];
  unlockedStations: FoodType[];
  tables: DiningTable[];
  rickshawUnlocked: boolean;
  upgradePads: UpgradeStationPad[];
  cashPiles: CashPile[];
  warmerStock: Record<FoodType, number>;
  customers: Customer[];
  staffEntities: MamaStaff[];
  playerSpeedRatio: number;
}

export function GameCanvas({
  playerPosition,
  playerAngle,
  isMoving,
  playerStack,
  unlockedStations,
  tables,
  rickshawUnlocked,
  upgradePads,
  cashPiles,
  warmerStock,
  customers,
  staffEntities,
  playerSpeedRatio,
}: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<RestaurantScene | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new RestaurantScene(mountRef.current);
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Update Player position & walk state
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.updatePlayer(
      playerPosition.x,
      playerPosition.z,
      playerAngle,
      isMoving,
      playerSpeedRatio
    );
  }, [playerPosition, playerAngle, isMoving, playerSpeedRatio]);

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
