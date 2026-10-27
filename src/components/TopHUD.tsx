import { useState } from 'react';
import { Volume2, VolumeX, Sparkles, HelpCircle, Utensils } from 'lucide-react';
import { sounds } from '../audio/soundManager';
import { FOOD_DEFINITIONS, FoodType } from '../types/game';

interface TopHUDProps {
  money: number;
  stackCount: number;
  maxStackCapacity: number;
  totalServed: number;
  rushHourActive: boolean;
  rushHourProgress: number;
  onTriggerRushHour: () => void;
  unlockedStations: FoodType[];
}

export function TopHUD({
  money,
  stackCount,
  maxStackCapacity,
  totalServed,
  rushHourActive,
  rushHourProgress,
  onTriggerRushHour,
  unlockedStations,
}: TopHUDProps) {
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const isStackFull = stackCount >= maxStackCapacity;

  return (
    <>
      <header className="fixed top-3 inset-x-3 md:inset-x-6 z-30 flex items-center justify-between gap-3 pointer-events-none select-none">
        {/* Left: Taka Balance & Stack Capacity */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Taka Balance */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 shadow-lg">
            <span className="text-xl font-bold text-emerald-400">৳</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase leading-none">
                Cash Balance
              </span>
              <span className="text-lg font-bold font-mono text-emerald-300 tabular-nums leading-tight">
                {money.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Carry Stack Capacity */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border shadow-lg transition-colors ${
              isStackFull
                ? 'bg-amber-950/85 border-amber-500/60 text-amber-300'
                : 'bg-slate-900/90 border-slate-700/60 text-slate-200'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase leading-none">
                Carrying
              </span>
              <span className="text-sm font-bold font-mono tabular-nums leading-tight">
                {stackCount} / {maxStackCapacity}
                {isStackFull && <span className="ml-1 text-[11px] text-amber-400">(FULL)</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Afternoon Rush Hour Boost Button */}
        <div className="hidden sm:flex items-center pointer-events-auto">
          {rushHourActive ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>Afternoon Rush Hour! (2x Tips)</span>
              <div className="w-14 h-1.5 bg-slate-900/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-950 rounded-full transition-all duration-300"
                  style={{ width: `${rushHourProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={onTriggerRushHour}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/85 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Afternoon Rush</span>
            </button>
          )}
        </div>

        {/* Right: Orders served, Guide, Sound toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Orders Served */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 text-slate-300 text-xs shadow-lg">
            <span className="text-slate-400">Orders:</span>
            <span className="font-bold font-mono text-white tabular-nums">{totalServed}</span>
          </div>

          {/* Guide Modal */}
          <button
            onClick={() => setShowGuide(true)}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white shadow-lg transition-colors active:scale-95"
            title="Menu & How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white shadow-lg transition-colors active:scale-95"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* English Guide & Bengali Food Menu Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-amber-400">Dhaka Snack Ready · Menu & Guide</h3>
                <p className="text-xs text-slate-400">Authentic Bengali Street Food Tycoon</p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 my-4 text-sm">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Traditional Street Snacks
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.values(FOOD_DEFINITIONS).map((food) => {
                    const isUnlocked = unlockedStations.includes(food.id);
                    return (
                      <div
                        key={food.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          isUnlocked
                            ? 'bg-slate-800/80 border-slate-700'
                            : 'bg-slate-950/60 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: food.color }}
                          />
                          <div>
                            <div className="font-bold text-white leading-tight">
                              {food.nameBn} <span className="text-xs font-normal text-slate-400">({food.nameEn})</span>
                            </div>
                            <div className="text-[11px] text-slate-400">{food.description}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-emerald-400 font-mono">৳{food.sellPrice}</span>
                          <div className="text-[10px] text-slate-500">
                            {isUnlocked ? 'Unlocked' : `Locked (৳${food.stationUnlockCost})`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  How to Play
                </h4>
                <ul className="text-xs space-y-1.5 text-slate-300 list-disc list-inside">
                  <li>
                    <strong className="text-amber-300">Move:</strong> Use the on-screen joystick or desktop{' '}
                    <strong>WASD / Arrow</strong> keys.
                  </li>
                  <li>
                    <strong className="text-amber-300">Stack Food:</strong> Walk up to fryers to collect hot{' '}
                    <strong>পুরি (Puri)</strong>, <strong>সিঙ্গারা (Singara)</strong>, and snacks.
                  </li>
                  <li>
                    <strong className="text-amber-300">Serve Customers:</strong> Run to the counter or dine-in
                    tables to deliver snacks, then walk over the cash bills on the floor to collect ৳ Taka!
                  </li>
                  <li>
                    <strong className="text-amber-300">Upgrade Pads:</strong> Stand inside the glowing circular floor
                    pads to automatically deposit ৳ Taka and unlock new fryers, tables, and rickshaw delivery!
                  </li>
                  <li>
                    <strong className="text-amber-300">Hire মামা Helpers:</strong> Hire{' '}
                    <strong>বাবুর্চি মামা (Chef Mama)</strong> and <strong>সার্ভিস বয় মামা (Waiter Mama)</strong> to
                    automate cooking and serving!
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm transition-colors"
            >
              Resume Game
            </button>
          </div>
        </div>
      )}
    </>
  );
}
