import { useState } from 'react';
import { useVenueStore } from '../../store/useVenueStore';

export default function GateBoard() {
  const gatesDict = useVenueStore((state) => state.gates);
  const [filter, setFilter] = useState<'all' | 'top3' | 'congested'>('all');
  
  // Sort alphabetically permanently to PREVENT UI jump/flicker during live simulation ticks!
  let sortedGates = Object.values(gatesDict).sort((a,b) => a.waitMinutes - b.waitMinutes);
  let renderGates = Object.values(gatesDict).sort((a, b) => a.name.localeCompare(b.name));

  if (filter === 'top3') renderGates = sortedGates.slice(0, 3);
  else if (filter === 'congested') renderGates = renderGates.filter(g => g.status === 'high' || g.waitMinutes >= 20);

  return (
    <div className="glass-panel rounded-3xl p-5 flex flex-col h-full lg:max-h-[70vh] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] filter drop-shadow-2xl">
      <h2 className="text-sm uppercase tracking-widest text-textPrimary mb-5 font-black flex items-center justify-between border-b border-borderSecondary pb-4">
        Gate Telemetry
        <div className="flex items-center gap-2">
           <span className="text-[9px] text-accentEmerald">LIVE</span>
           <span className="relative flex h-2 w-2">
             <span className="animate-pulseGlow absolute inline-flex h-full w-full rounded-full bg-accentEmerald opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-accentEmerald"></span>
           </span>
        </div>
      </h2>
      
      {/* Filtering Tabs */}
      <div className="flex gap-1 mb-5 bg-pureBlack p-1 rounded-xl shadow-inner border border-borderPrimary">
         <button onClick={() => setFilter('all')} className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-all ${filter === 'all' ? 'bg-surface text-textPrimary shadow-md' : 'text-textSecondary hover:text-textPrimary'}`}>All</button>
         <button onClick={() => setFilter('top3')} className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-all ${filter === 'top3' ? 'bg-surface text-accentEmerald shadow-md' : 'text-textSecondary hover:text-accentEmerald'}`}>Top 3</button>
         <button onClick={() => setFilter('congested')} className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg transition-all ${filter === 'congested' ? 'bg-surface text-accentRose shadow-md' : 'text-textSecondary hover:text-accentRose'}`}>Delay</button>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-4 flex-1 scrollbar-hide">
        {renderGates.map((gate) => {
          const rank = sortedGates.findIndex(g => g.name === gate.name) + 1;
          const isBest = rank === 1;

          const statusColor = 
            gate.status === 'low' ? 'bg-accentEmerald' :
            gate.status === 'medium' ? 'bg-accentWarning' : 
            'bg-accentRose';
            
          const statusShadow = 
            gate.status === 'low' ? 'shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
            gate.status === 'medium' ? 'shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 
            'shadow-[0_0_10px_rgba(244,63,94,0.3)]';

          const textColor = 
            gate.status === 'low' ? 'text-accentEmerald' :
            gate.status === 'medium' ? 'text-accentWarning' : 
            'text-accentRose';

          return (
            <div key={gate.name} className={`relative flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 ${isBest && filter === 'all' ? 'bg-accentEmerald/10 border-accentEmerald/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-surface border-borderSecondary/50 hover:border-borderSecondary'}`}>
              
              {/* Rank Badge */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${isBest ? 'bg-accentEmerald text-pureBlack shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-pureBlack border border-borderSecondary text-textSecondary'}`}>
                 #{rank}
              </div>

              {/* Core Data */}
              <div className="flex-1 flex flex-col justify-center min-w-0">
                 <div className="flex items-center gap-2">
                    <span className={`font-bold text-base whitespace-nowrap ${isBest ? 'text-white' : 'text-textPrimary'}`}>{gate.name}</span>
                    {gate.trend === 'increasing' ? <span className="text-accentRose font-bold text-[10px]">↑ +{Math.abs(gate.rate || 0).toFixed(1)}/m</span> : <span className="text-accentEmerald font-bold text-[10px]">↓ -{Math.abs(gate.rate || 0).toFixed(1)}/m</span>}
                 </div>
                 
                 {/* Progress Bar mapped out safely inside */}
                 <div className="w-full h-1 mt-2 bg-pureBlack rounded-full overflow-hidden">
                    <div className={`h-full ${statusColor} ${statusShadow} rounded-full transition-all duration-1000 ease-in-out`} style={{ width: `${Math.min((gate.waitMinutes / 30) * 100, 100)}%` }}></div>
                 </div>
              </div>

              {/* Huge Wait Time Number */}
              <div className="flex flex-col items-end justify-center min-w-[50px]">
                 <span className={`text-2xl font-black leading-none ${textColor}`}>{Math.round(gate.waitMinutes)}</span>
                 <span className="text-[9px] uppercase font-bold text-textSecondary tracking-wider">Mins</span>
              </div>
            </div>
          );
        })}
        {renderGates.length === 0 && <div className="text-sm font-medium text-textSecondary text-center py-8">No gates match this filter.</div>}
      </div>
    </div>
  );
}
