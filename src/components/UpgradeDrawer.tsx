import { useState } from 'react';
import { ChevronUp, ChevronDown, Zap, ShoppingBag, UserCheck, Flame, RotateCcw } from 'lucide-react';

interface UpgradeDrawerProps {
  money: number;
  playerSpeedLevel: number;
  playerCapacityLevel: number;
  maxStackCapacity: number;
  staff: {
    chefLevel: number;
    waiterLevel: number;
    cleanerLevel: number;
  };
  onUpgradeSpeed: () => void;
  onUpgradeCapacity: () => void;
  onUpgradeStaff: (role: 'chef' | 'waiter' | 'cleaner') => void;
  onResetGame: () => void;
}

export function UpgradeDrawer({
  money,
  playerSpeedLevel,
  playerCapacityLevel,
  maxStackCapacity,
  staff,
  onUpgradeSpeed,
  onUpgradeCapacity,
  onUpgradeStaff,
  onResetGame,
}: UpgradeDrawerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  const speedCost = playerSpeedLevel * 100;
  const capacityCost = playerCapacityLevel * 120;
  const chefCost = (staff.chefLevel + 1) * 150;
  const waiterCost = (staff.waiterLevel + 1) * 160;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center w-[94vw] max-w-xl pointer-events-none select-none">
      {/* Toggle Tab */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-t-xl bg-slate-900/95 border-t border-x border-slate-700/80 text-amber-400 text-xs font-bold shadow-2xl backdrop-blur-md hover:text-amber-300 transition-colors"
      >
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        <span>{isOpen ? 'লুকান (Close)' : '⚡ দোকান আপগ্রেড ও কর্মী (Upgrades)'}</span>
      </button>

      {/* Drawer Body */}
      {isOpen && (
        <div className="pointer-events-auto w-full p-4 rounded-2xl rounded-t-none bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md text-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Player Speed */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">গতি (Speed)</span>
                </div>
                <div className="text-[11px] text-slate-400">লেভেল: {playerSpeedLevel}/5</div>
              </div>

              {playerSpeedLevel >= 5 ? (
                <div className="mt-2 text-center text-[11px] font-bold text-emerald-400 py-1 bg-emerald-950/40 rounded-lg">
                  ম্যাক্স
                </div>
              ) : (
                <button
                  onClick={onUpgradeSpeed}
                  disabled={money < speedCost}
                  className={`mt-2 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    money >= speedCost
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                      : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  ৳ {speedCost}
                </button>
              )}
            </div>

            {/* 2. Stack Capacity */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">ধারণক্ষমতা</span>
                </div>
                <div className="text-[11px] text-slate-400">{maxStackCapacity} টি নাস্তা</div>
              </div>

              {playerCapacityLevel >= 6 ? (
                <div className="mt-2 text-center text-[11px] font-bold text-emerald-400 py-1 bg-emerald-950/40 rounded-lg">
                  ম্যাক্স
                </div>
              ) : (
                <button
                  onClick={onUpgradeCapacity}
                  disabled={money < capacityCost}
                  className={`mt-2 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    money >= capacityCost
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md active:scale-95'
                      : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  ৳ {capacityCost}
                </button>
              )}
            </div>

            {/* 3. Chef Mama */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-rose-400 mb-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">বাবুর্চি মামা</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {staff.chefLevel === 0 ? 'নিয়োগ নেই' : `লেভেল: ${staff.chefLevel}`}
                </div>
              </div>

              <button
                onClick={() => onUpgradeStaff('chef')}
                disabled={money < chefCost}
                className={`mt-2 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  money >= chefCost
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-md active:scale-95'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                {staff.chefLevel === 0 ? `নিয়োগ ৳${chefCost}` : `আপগ্রেড ৳${chefCost}`}
              </button>
            </div>

            {/* 4. Waiter Mama */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">ওয়েটার মামা</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {staff.waiterLevel === 0 ? 'নিয়োগ নেই' : `লেভেল: ${staff.waiterLevel}`}
                </div>
              </div>

              <button
                onClick={() => onUpgradeStaff('waiter')}
                disabled={money < waiterCost}
                className={`mt-2 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  money >= waiterCost
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md active:scale-95'
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                {staff.waiterLevel === 0 ? `নিয়োগ ৳${waiterCost}` : `আপগ্রেড ৳${waiterCost}`}
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>টিপ: মেঝেতে দাঁড়ানো সবুজ বৃত্তগুলোতে দাঁড়ালেও আনলক হবে!</span>
            {showConfirmReset ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-400 text-[11px]">নিশ্চিত?</span>
                <button
                  onClick={onResetGame}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]"
                >
                  হ্যাঁ, রিসেট
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px]"
                >
                  না
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>নতুন করে শুরু</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
