import { useVenueStore } from '../../store/useVenueStore';
import { useAlertStore } from '../../store/useAlertStore';

interface KPICardProps {
  label: string;
  value: string;
  colorClass?: string;
  subtext?: string;
}

const KPICard = ({ label, value, colorClass, subtext }: KPICardProps) => (
  <div className="glass-panel px-4 py-2 rounded-full flex items-center justify-between gap-3 shadow-lg hover:shadow-xl transition-all hover:border-textSecondary/30 min-w-0">
    <span className="text-[10px] uppercase font-bold text-textSecondary tracking-wider whitespace-nowrap">{label}</span>
    <div className="flex flex-col items-end">
      <span className={`text-base font-black ${colorClass || 'text-white'} drop-shadow-sm leading-none`}>{value}</span>
      {subtext && <span className="text-[9px] text-textSecondary/60 leading-none mt-0.5">{subtext}</span>}
    </div>
  </div>
);

export default function KPIStrip() {
  const sections = useVenueStore((state) => state.sections);
  const gates    = useVenueStore((state) => state.gates);
  const alerts   = useAlertStore((state) => state.alerts);

  // Dynamic computations — never static
  const totalFans = Object.values(sections).reduce((acc, s) => acc + (s.currentCount ?? 0), 0);
  const totalCap  = Object.values(sections).reduce((acc, s) => acc + (s.capacity ?? 0), 0);
  const capacityPct = totalCap > 0 ? Math.round((totalFans / totalCap) * 100) : 0;

  const gateValues = Object.values(gates);
  const avgWait = gateValues.length > 0
    ? Math.round(gateValues.reduce((acc, g) => acc + g.waitMinutes, 0) / gateValues.length)
    : 0;

  const activeAlertCount = alerts.length;
  const criticalCount    = alerts.filter((a) => a.severity === 'critical').length;

  const capacityColor =
    capacityPct >= 95 ? 'text-accentRose' :
    capacityPct >= 80 ? 'text-accentWarning' :
    'text-accentEmerald';

  const waitColor =
    avgWait > 25 ? 'text-accentRose' :
    avgWait > 12 ? 'text-accentWarning' :
    'text-accentEmerald';

  return (
    <section className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full animate-slideUp">
      <KPICard
        label="Est. Fans"
        value={totalFans.toLocaleString()}
        subtext={`of ${totalCap.toLocaleString()}`}
      />
      <KPICard
        label="Capacity"
        value={`${capacityPct}%`}
        colorClass={capacityColor}
      />
      <KPICard
        label="Avg Wait"
        value={`${avgWait}m`}
        colorClass={waitColor}
      />
      <KPICard
        label="Alerts"
        value={String(activeAlertCount)}
        colorClass={criticalCount > 0 ? 'text-accentRose animate-pulse' : activeAlertCount > 0 ? 'text-accentWarning' : 'text-accentEmerald'}
        subtext={criticalCount > 0 ? `${criticalCount} critical` : undefined}
      />
    </section>
  );
}
