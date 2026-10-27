import { useGameEngine } from './hooks/useGameEngine';
import { GameCanvas } from './components/GameCanvas';
import { VirtualJoystick } from './components/VirtualJoystick';
import { TopHUD } from './components/TopHUD';
import { UpgradeDrawer } from './components/UpgradeDrawer';
import { RickshawNotification } from './components/RickshawNotification';

export default function App() {
  const {
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
  } = useGameEngine();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#181512] font-['Plus_Jakarta_Sans','Hind_Siliguri',sans-serif]">
      {/* 1. 3D Isometric Viewport */}
      <GameCanvas
        playerPosition={playerPosition}
        playerAngle={playerAngle}
        isMoving={isMoving}
        playerStack={playerStack}
        unlockedStations={unlockedStations}
        tables={tables}
        rickshawUnlocked={rickshawUnlocked}
        upgradePads={upgradePads}
        cashPiles={cashPiles}
        warmerStock={warmerStock}
        customers={customers}
        staffEntities={staffEntities}
        playerSpeedRatio={1 + (playerSpeedLevel - 1) * 0.25}
      />

      {/* 2. Top HUD Overlay */}
      <TopHUD
        money={money}
        stackCount={playerStack.length}
        maxStackCapacity={maxStackCapacity}
        totalServed={totalServed}
        rushHourActive={rushHourActive}
        rushHourProgress={rushHourProgress}
        onTriggerRushHour={triggerRushHour}
        unlockedStations={unlockedStations}
      />

      {/* 3. Rickshaw Delivery Notification */}
      <RickshawNotification order={rickshawOrder} />

      {/* 4. Virtual Joystick (Touch + Mouse Drag) */}
      <VirtualJoystick onMove={setInputVector} />

      {/* 5. Desktop Keyboard Helper Badge (Bottom Right) */}
      <div className="hidden lg:flex fixed bottom-4 right-4 z-20 flex-col items-end gap-1 px-3 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400 pointer-events-none select-none">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[10px]">
            W
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[10px]">
            A
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[10px]">
            S
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[10px]">
            D
          </kbd>
          <span>বা এরো কি দিয়ে চালান</span>
        </div>
        <span className="text-[10px] text-slate-500">মেঝেতে দাঁড়িয়ে নতুন জিনিস আনলক করুন</span>
      </div>

      {/* 6. Collapsible Bottom Upgrade Dock */}
      <UpgradeDrawer
        money={money}
        playerSpeedLevel={playerSpeedLevel}
        playerCapacityLevel={playerCapacityLevel}
        maxStackCapacity={maxStackCapacity}
        staff={staff}
        onUpgradeSpeed={upgradePlayerSpeed}
        onUpgradeCapacity={upgradePlayerCapacity}
        onUpgradeStaff={upgradeStaffLevel}
        onResetGame={resetGame}
      />
    </div>
  );
}
