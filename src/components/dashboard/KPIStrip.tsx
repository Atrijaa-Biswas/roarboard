import { useVenueStore } from '../../store/useVenueStore';

const KPICard = ({ label, value, colorClass }: { label: string, value: string, colorClass?: string }) => (
  <div className="bg-surface border border-borderSecondary p-3 rounded-lg flex flex-col justify-center transition-transform hover:scale-[1.02]">
    <span className="text-[9px] uppercase tracking-[0.06em] text-textSecondary mb-1 font-semibold">{label}</span>
    <span className={`text-xl font-bold ${colorClass || 'text-textPrimary'}`}>{value}</span>
  </div>
);

export default function KPIStrip() {
  const sections = useVenueStore((state) => state.sections);
  const gates = useVenueStore((state) => state.gates);

  const totalFans = Object.values(sections || {}).reduce((acc, section) => acc + (section.currentCount || 0), 0);
  const totalCapacity = Object.values(sections || {}).reduce((acc, section) => acc + (section.capacity || 0), 0);
  const capacityPercent = totalCapacity > 0 ? Math.round((totalFans / totalCapacity) * 100) : 0;

  const totalWait = Object.values(gates || {}).reduce((acc, gate) => acc + (gate.waitMinutes || 0), 0);
  const avgWait = Object.keys(gates || {}).length > 0 ? Math.round(totalWait / Object.keys(gates || {}).length) : 0;

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 w-full">
      <KPICard label="Total Fans" value={totalFans.toLocaleString()} />
      <KPICard label="Capacity %" value={`${capacityPercent}%`} colorClass={capacityPercent > 80 ? "text-accentWarning" : capacityPercent > 95 ? "text-accentCoral" : ""} />
      <KPICard label="Avg Wait" value={`${avgWait}m`} />
      <KPICard label="Active Alerts" value="0" colorClass="text-accentCoral" />
    </section>
  );
}
