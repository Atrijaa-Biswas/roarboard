import { useVenueStore } from '../../store/useVenueStore';

export default function GateBoard() {
  const gatesDict = useVenueStore((state) => state.gates);
  // Sort gates by wait time ascending
  const gates = Object.values(gatesDict).sort((a, b) => a.waitMinutes - b.waitMinutes);

  return (
    <div className="bg-surface border border-borderSecondary rounded-xl p-4 flex flex-col h-full min-h-[300px]">
      <h2 className="text-xs uppercase tracking-[0.06em] text-textSecondary mb-4 font-semibold flex items-center justify-between">
        Live Gate Status
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentSuccess opacity-75 motion-reduce:animate-none"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accentSuccess"></span>
        </span>
      </h2>
      
      <div className="flex flex-col gap-3">
        {gates.map((gate) => {
          const statusColor = 
            gate.status === 'low' ? 'bg-accentSuccess' :
            gate.status === 'medium' ? 'bg-accentWarning' : 
            'bg-accentCoral';
            
          return (
            <div key={gate.name} className="flex flex-col gap-1 border-b border-borderSecondary pb-2 last:border-0 last:pb-0">
              <div className="flex justify-between items-end">
                <span className="font-bold text-textPrimary text-sm">{gate.name}</span>
                <span className="text-xs font-medium text-textSecondary">
                  <span className="text-textPrimary">{gate.waitMinutes}</span> min wait
                </span>
              </div>
              <div className="w-full h-1.5 bg-borderPrimary rounded-full overflow-hidden">
                <div 
                  className={`h-full ${statusColor} rounded-full transition-all duration-1000`} 
                  style={{ width: `${Math.min((gate.waitMinutes / 30) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
