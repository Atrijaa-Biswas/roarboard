import { useState } from 'react';
import { useVenueStore } from '../../store/useVenueStore';

type Filter = 'all' | 'top3' | 'delay';

// Only ever show these 6 canonical gates in a fixed display order
const GATE_KEYS = ['gA', 'gB', 'gC', 'gD', 'gE', 'gF'] as const;

export default function GateBoard() {
  const gatesDict = useVenueStore(state => state.gates);
  const [filter, setFilter] = useState<Filter>('all');

  // Build canonical gate list (only the 6 known gates, ignore any extras)
  const allGates = GATE_KEYS
    .map(k => gatesDict[k])
    .filter(Boolean);

  // Sort all gates by wait time ascending (fastest first)
  const byWaitAsc = [...allGates].sort((a, b) => a.waitMinutes - b.waitMinutes);

  // --- Apply filter to get display list ---
  let displayGates = byWaitAsc; // default: wait-sorted

  if (filter === 'all') {
    // Alphabetical order for stability (no jumping on every simulation tick)
    displayGates = [...allGates].sort((a, b) => a.name.localeCompare(b.name));
  } else if (filter === 'top3') {
    // Strictly the 3 fastest by wait time
    displayGates = byWaitAsc.slice(0, 3);
  } else if (filter === 'delay') {
    // High congestion: status is 'high' OR wait time exceeds 20 min
    displayGates = byWaitAsc.filter(g => g.status === 'high' || g.waitMinutes >= 20);
  }

  // Helper: get this gate's rank among ALL 6 gates (1 = fastest)
  const getRank = (gateName: string) =>
    byWaitAsc.findIndex(g => g.name === gateName) + 1;

  // Fastest gate for footer
  const fastest = byWaitAsc[0];

  return (
    <div className="glass-panel rounded-3xl p-5 flex flex-col h-full lg:max-h-[70vh] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <h2 className="text-sm uppercase tracking-widest text-textPrimary mb-4 font-black flex items-center justify-between border-b border-borderSecondary pb-4">
        Gate Telemetry
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-accentEmerald font-bold">LIVE</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentEmerald opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accentEmerald" />
          </span>
        </div>
      </h2>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4 bg-pureBlack p-1 rounded-xl border border-borderPrimary">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-all ${
            filter === 'all' ? 'bg-surface text-textPrimary shadow-md' : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          All Gates
        </button>
        <button
          onClick={() => setFilter('top3')}
          className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-all ${
            filter === 'top3' ? 'bg-surface text-accentEmerald shadow-md' : 'text-textSecondary hover:text-accentEmerald'
          }`}
        >
          Top 3
        </button>
        <button
          onClick={() => setFilter('delay')}
          className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-all ${
            filter === 'delay' ? 'bg-surface text-accentRose shadow-md' : 'text-textSecondary hover:text-accentRose'
          }`}
        >
          Delayed
        </button>
      </div>

      {/* Gate list */}
      <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-2 flex-1 scrollbar-hide">
        {displayGates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-textSecondary text-sm gap-2 py-10">
            {filter === 'delay'
              ? <><span className="text-2xl">✅</span><span>No delayed gates — all clear!</span></>
              : <span>No gate data available.</span>
            }
          </div>
        ) : (
          displayGates.map(gate => {
            const rank = getRank(gate.name);
            const isBest = rank === 1;

            const statusColor =
              gate.status === 'low'    ? 'bg-accentEmerald' :
              gate.status === 'medium' ? 'bg-accentWarning'  :
                                         'bg-accentRose';
            const textColor =
              gate.status === 'low'    ? 'text-accentEmerald' :
              gate.status === 'medium' ? 'text-accentWarning'  :
                                         'text-accentRose';

            const trendUp = gate.trend === 'increasing';
            const barPct = Math.min(Math.round((gate.waitMinutes / 45) * 100), 100);

            return (
              <div
                key={gate.name}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${
                  isBest
                    ? 'bg-accentEmerald/10 border-accentEmerald/50 shadow-[0_0_18px_rgba(16,185,129,0.12)]'
                    : 'bg-surface border-borderSecondary/50 hover:border-borderSecondary'
                }`}
              >
                {/* Rank badge */}
                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-black text-xs ${
                  isBest
                    ? 'bg-accentEmerald text-pureBlack shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : 'bg-pureBlack border border-borderSecondary text-textSecondary'
                }`}>
                  #{rank}
                </div>

                {/* Name + trend + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`font-bold text-sm ${isBest ? 'text-white' : 'text-textPrimary'}`}>
                      {gate.name}
                    </span>
                    <span className={`text-[9px] font-bold ${trendUp ? 'text-accentRose' : 'text-accentEmerald'}`}>
                      {trendUp ? '↑' : '↓'} {Math.abs(gate.rate ?? 0).toFixed(1)}/m
                    </span>
                  </div>
                  <div className="w-full h-1 bg-pureBlack rounded-full overflow-hidden">
                    <div
                      className={`h-full ${statusColor} rounded-full transition-all duration-1000 ease-in-out`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>

                {/* Wait time */}
                <div className="flex flex-col items-end flex-shrink-0 min-w-[44px]">
                  <span className={`text-2xl font-black leading-none ${textColor}`}>
                    {Math.round(gate.waitMinutes)}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-textSecondary tracking-wider">min</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer context line */}
      <div className="mt-3 pt-3 border-t border-borderPrimary text-[10px] text-textSecondary text-center leading-relaxed">
        {filter === 'all'    && `6 gates · fastest: ${fastest?.name ?? '–'} (${Math.round(fastest?.waitMinutes ?? 0)} min)`}
        {filter === 'top3'   && `3 fastest gates by wait time`}
        {filter === 'delay'  && (displayGates.length > 0
          ? `${displayGates.length} gate${displayGates.length !== 1 ? 's' : ''} with elevated wait`
          : 'All gates operating normally'
        )}
      </div>
    </div>
  );
}
