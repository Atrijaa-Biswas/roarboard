import { useVenueStore } from '../../store/useVenueStore';

export default function Ticker() {
  const items = useVenueStore((state) => state.ticker);

  if (!items || items.length === 0) {
    return <div className="w-full bg-surface/80 backdrop-blur-sm h-[28px] z-50"></div>; // Placeholder while loading
  }

  return (
    <div className="w-full bg-surface/70 backdrop-blur-md h-[26px] overflow-hidden flex items-center group relative border-b border-borderPrimary">
      {/* Brand dot */}
      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accentBlue mx-3 animate-pulse"></span>
      <div 
        className="whitespace-nowrap flex gap-10 animate-[ticker_20s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:overflow-x-auto motion-reduce:w-full"
        aria-live="polite"
      >
        {/* Duplicate items for seamless loop */}
        {[...items, ...items, ...items].map((item, index) => (
          <span 
            key={`ticker-${index}`} 
            className="text-textSecondary font-semibold text-[10px] tracking-widest uppercase whitespace-nowrap"
          >
            <span className="text-accentBlue mr-2">◆</span>{item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
