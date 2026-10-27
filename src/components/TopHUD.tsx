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
        {/* Left: Brand & Currency Balance */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Taka Balance Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-emerald-500/40 shadow-lg">
            <span className="text-xl font-bold text-emerald-400">৳</span>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium leading-none">ব্যালেন্স</span>
              <span className="text-lg font-bold font-mono text-emerald-300 tabular-nums leading-tight">
                {money.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Carry Stack Capacity */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border shadow-lg transition-colors ${
              isStackFull
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                : 'bg-slate-900/85 border-slate-700/60 text-slate-200'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium leading-none">হাতে নাস্তা</span>
              <span className="text-sm font-bold font-mono tabular-nums leading-tight">
                {stackCount} / {maxStackCapacity}
                {isStackFull && <span className="ml-1 text-[11px] text-amber-400">(ফুল!)</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Afternoon Rush Hour Boost Button */}
        <div className="hidden sm:flex items-center pointer-events-auto">
          {rushHourActive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/90 text-slate-950 font-bold text-xs shadow-lg animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>বিকেলের নাস্তার ভিড়! (২x টিপস সক্রিয়)</span>
              <div className="w-12 h-1.5 bg-slate-900/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-950 rounded-full transition-all duration-300"
                  style={{ width: `${rushHourProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={onTriggerRushHour}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>বিকেলের ভিড় শুরু করুন</span>
            </button>
          )}
        </div>

        {/* Right: Served stats, sound, guide modal */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Total Served Counter */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-slate-300 text-xs shadow-lg">
            <span className="text-slate-400">অর্ডার:</span>
            <span className="font-bold font-mono text-white tabular-nums">{totalServed}</span>
          </div>

          {/* Guide / Food Menu Info Button */}
          <button
            onClick={() => setShowGuide(true)}
            className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white shadow-lg transition-colors active:scale-95"
            title="মেনু ও গাইড (Menu & Guide)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Sound Mute Button */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white shadow-lg transition-colors active:scale-95"
            title={isMuted ? 'শব্দ চালু করুন (Unmute)' : 'শব্দ বন্ধ করুন (Mute)'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Guide & Food Menu Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-amber-400 font-['Hind_Siliguri']">
                  ঢাকা স্ন্যাকস রেডি · গাইড ও মেনু
                </h3>
                <p className="text-xs text-slate-400">Dhaka Street Snack Tycoon Guide</p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                ✕ বন্ধ
              </button>
            </div>

            <div className="space-y-4 my-4 text-sm">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  খাবারের মেনু (Snack Items)
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
                            {isUnlocked ? 'আনলকড' : `লক (৳${food.stationUnlockCost})`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  খেলার নিয়ম (How to Play)
                </h4>
                <ul className="text-xs space-y-1.5 text-slate-300 list-disc list-inside">
                  <li>
                    <strong className="text-amber-300">হাঁটা ও নিয়ন্ত্রণ:</strong> স্ক্রিনের জয়স্টিক বা কিবোর্ডের
                    <strong> WASD / Arrow</strong> বাটন দিয়ে ক্যারেক্টার চালান।
                  </li>
                  <li>
                    <strong className="text-amber-300">নাস্তা সংগ্রহ:</strong> ফ্রায়ারের পাশে দাঁড়ালে গরম পুরি, সিঙ্গারা
                    হাতে স্তূপাকার হয়ে উঠবে।
                  </li>
                  <li>
                    <strong className="text-amber-300">গ্রাহক সেবা:</strong> সামনের কাউন্টারে বা বসার টেবিলে গিয়ে
                    অর্ডার অনুযায়ী নাস্তা দিন এবং মাটিতে পড়া ৳ টাকা তুলে নিন।
                  </li>
                  <li>
                    <strong className="text-amber-300">আপগ্রেড প্যাড:</strong> মেঝেতে থাকা সবুজ বৃত্তের ওপর দাঁড়ালে
                    স্বয়ংক্রিয়ভাবে টাকা জমা হয়ে নতুন ফ্রায়ার, টেবিল ও রিকশা ডেলিভারি চালু হবে!
                  </li>
                  <li>
                    <strong className="text-amber-300">মামা নিয়োগ:</strong> বাবুর্চি ও ওয়েটার মামা নিয়োগ দিলে তারা আপনার
                    হয়ে দ্রুত রান্না ও পরিবেশন করবে।
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm transition-colors"
            >
              খেলা শুরু করুন! (Play Now)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
