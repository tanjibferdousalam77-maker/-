import { RickshawOrder, FOOD_DEFINITIONS } from '../types/game';

interface RickshawNotificationProps {
  order: RickshawOrder | null;
}

export function RickshawNotification({ order }: RickshawNotificationProps) {
  if (!order || !order.active) return null;

  return (
    <div className="fixed top-16 right-3 md:right-6 z-30 pointer-events-none select-none max-w-xs animate-bounce">
      <div className="p-3 rounded-2xl bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/80 shadow-2xl text-slate-100 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
            <span className="text-base">🛺</span>
            <span>Rickshaw Delivery Arrived!</span>
          </div>
          <span className="font-mono text-emerald-400 font-bold text-xs">
            +৳{order.payout}
          </span>
        </div>

        <div className="text-[11px] text-slate-300">
          Deliver snacks to the takeaway window:
        </div>

        <div className="flex flex-wrap gap-1.5">
          {order.items.map((item, idx) => {
            const def = FOOD_DEFINITIONS[item.itemType];
            const isDone = item.delivered >= item.required;
            return (
              <div
                key={idx}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                  isDone
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 line-through'
                    : 'bg-slate-800 border-slate-600 text-amber-200'
                }`}
              >
                <span>{def.nameBn}</span>
                <span>
                  {item.delivered}/{item.required}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
