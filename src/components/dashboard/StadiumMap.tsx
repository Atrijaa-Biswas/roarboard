import { useVenueStore } from '../../store/useVenueStore';

export default function StadiumMap() {
  const sections = useVenueStore((state) => state.sections);

  const getDensityColor = (sectionId: string) => {
    const defaultColor = '#1D9E75';
    if (!sections || !sections[sectionId]) return defaultColor;
    const density = sections[sectionId].density;
    if (density < 40) return '#1D9E75';
    if (density < 70) return '#EF9F27';
    return '#D85A30';
  };

  const getLabel = (sectionId: string, baseLabel: string) => {
    if (!sections || !sections[sectionId]) return `${baseLabel} - Data Unavailable`;
    return `${baseLabel} - ${sections[sectionId].density}% Full`;
  };

  return (
    <div className="bg-surface border border-borderSecondary rounded-xl p-4 flex flex-col h-full min-h-[300px]">
      <h2 className="text-xs uppercase tracking-[0.06em] text-textSecondary mb-2 font-semibold">
        Venue Heatmap
      </h2>
      
      <div className="flex-1 w-full bg-borderPrimary rounded-lg relative overflow-hidden flex items-center justify-center p-4">
        {/* Mock Stadium Shape */}
        <svg viewBox="0 0 400 300" className="w-full h-full max-w-sm drop-shadow-lg transition-all duration-1000">
          <defs>
            <radialGradient id="pitch" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a2e1f" />
              <stop offset="100%" stopColor="#0d1f11" />
            </radialGradient>
          </defs>
          
          {/* Pitch */}
          <ellipse cx="200" cy="150" rx="100" ry="60" fill="url(#pitch)" stroke="#1D9E75" strokeWidth="2" opacity="0.8" />
          <rect x="180" y="110" width="40" height="80" fill="none" stroke="#1D9E75" opacity="0.5" />
          <circle cx="200" cy="150" r="20" fill="none" stroke="#1D9E75" opacity="0.5" />
          
          {/* Outer Ring 1 - Stands */}
          {/* North */}
          <path d="M 90 70 A 150 100 0 0 1 310 70 L 340 40 A 180 120 0 0 0 60 40 Z" fill={getDensityColor('n1')} stroke="#0a0a0a" strokeWidth="2" className="transition-colors duration-1000 cursor-pointer hover:brightness-125 focus:brightness-125 outline-none" tabIndex={0} aria-label={getLabel('n1', 'North Stand')} />
          <text x="200" y="55" fill="#0a0a0a" fontSize="12" fontWeight="bold" textAnchor="middle" pointerEvents="none">NORTH</text>

          {/* South */}
          <path d="M 90 230 A 150 100 0 0 0 310 230 L 340 260 A 180 120 0 0 1 60 260 Z" fill={getDensityColor('s1')} stroke="#0a0a0a" strokeWidth="2" className="transition-colors duration-1000 cursor-pointer hover:brightness-125 focus:brightness-125 outline-none" tabIndex={0} aria-label={getLabel('s1', 'South Stand')} />
          <text x="200" y="255" fill="#0a0a0a" fontSize="12" fontWeight="bold" textAnchor="middle" pointerEvents="none">SOUTH</text>

          {/* East */}
          <path d="M 315 75 A 150 100 0 0 1 315 225 L 345 255 A 180 120 0 0 0 345 45 Z" fill={getDensityColor('e1')} stroke="#0a0a0a" strokeWidth="2" className="transition-colors duration-1000 cursor-pointer hover:brightness-125 focus:brightness-125 outline-none" tabIndex={0} aria-label={getLabel('e1', 'East Stand')} />
          <text x="335" y="155" fill="#0a0a0a" fontSize="12" fontWeight="bold" textAnchor="middle" transform="rotate(90 335,150)" pointerEvents="none">EAST</text>

          {/* West */}
          <path d="M 85 75 A 150 100 0 0 0 85 225 L 55 255 A 180 120 0 0 1 55 45 Z" fill={getDensityColor('w1')} stroke="#0a0a0a" strokeWidth="2" className="transition-colors duration-1000 cursor-pointer hover:brightness-125 focus:brightness-125 outline-none" tabIndex={0} aria-label={getLabel('w1', 'West Stand')} />
          <text x="65" y="155" fill="#0a0a0a" fontSize="12" fontWeight="bold" textAnchor="middle" transform="rotate(-90 65,150)" pointerEvents="none">WEST</text>
        </svg>
        
        {/* Legend */}
        <div className="absolute bottom-2 right-2 flex gap-2 bg-surface/80 backdrop-blur px-2 py-1 rounded border border-borderSecondary text-[10px] font-medium text-textSecondary">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accentSuccess"></span> {"< 40%"}</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accentWarning"></span> {"< 70%"}</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accentCoral"></span> {"High"}</div>
        </div>
      </div>
    </div>
  );
}
