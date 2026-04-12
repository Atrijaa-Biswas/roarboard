import { useVenueStore } from '../../store/useVenueStore';

export default function Ticker() {
  const items = useVenueStore((state) => state.ticker);

  if (!items || items.length === 0) {
    return <div className="w-full bg-accentCoral h-[28px] z-50"></div>; // Placeholder while loading
  }

  return (
    <div className="w-full bg-accentCoral h-[28px] overflow-hidden flex items-center group relative z-50">
      <div 
        className="whitespace-nowrap flex gap-8 px-4 animate-[ticker_20s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:overflow-x-auto motion-reduce:w-full"
        aria-live="polite"
      >
        {/* Duplicate items for seamless loop */}
        {[...items, ...items, ...items].map((item, index) => (
          <span 
            key={`ticker-${index}`} 
            className="text-pureBlack font-bold text-xs tracking-[0.06em] uppercase whitespace-nowrap"
          >
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
