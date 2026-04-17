import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useVenueStore } from '../store/useVenueStore';
import { useAlertStore } from '../store/useAlertStore';
import { useStaffStore, type IncidentType, type IncidentStatus } from '../store/useStaffStore';
import { useUserStore } from '../store/useUserStore';
import { useFoodStore } from '../store/useFoodStore';
import { logout } from '../hooks/useAuth';
import {
  Activity, AlertTriangle, Users, Megaphone, ClipboardList,
  ScrollText, CheckCircle2, Bot, ThumbsDown, ChevronRight,
  Plus, RefreshCw, LogOut, Zap, TrendingUp, TrendingDown,
  Minus, Clock, Shield, Radio, ForkKnife,
} from 'lucide-react';

// ── Chart-less sparkline using SVG ───────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 80; const H = 30;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} className="overflow-visible opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const GATE_KEYS = ['gA', 'gB', 'gC', 'gD', 'gE', 'gF'] as const;
const SECTION_KEYS = ['n1', 's1', 'e1', 'w1'] as const;

const badgeColor = (sev: string) =>
  sev === 'critical' ? 'bg-accentRose/20 text-accentRose border border-accentRose/30' :
  sev === 'warning'  ? 'bg-accentWarning/20 text-accentWarning border border-accentWarning/30' :
                       'bg-accentBlue/20 text-accentBlue border border-accentBlue/30';

const statusColor = (s: string) =>
  s === 'active' ? 'bg-accentRose/20 text-accentRose' :
  s === 'in_progress' ? 'bg-accentWarning/20 text-accentWarning' :
                        'bg-accentEmerald/20 text-accentEmerald';

const logColor = (cat: string) =>
  cat === 'deploy'   ? 'text-accentBlue' :
  cat === 'alert'    ? 'text-accentWarning' :
  cat === 'incident' ? 'text-accentRose' :
  cat === 'resolve'  ? 'text-accentEmerald' :
  cat === 'announce' ? 'text-purple-400' :
                       'text-textSecondary';

const trendIcon = (t?: string) => {
  if (t === 'increasing') return <TrendingUp className="w-3.5 h-3.5 text-accentRose" />;
  if (t === 'decreasing') return <TrendingDown className="w-3.5 h-3.5 text-accentEmerald" />;
  return <Minus className="w-3.5 h-3.5 text-textSecondary" />;
};

function elapsed(ts: number) {
  const ms = Date.now() - ts;
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return `${Math.round(ms / 60000)}m ago`;
  return `${Math.round(ms / 3600000)}h ago`;
}

function minutesUntilCritical(waitMinutes: number, ratePerMin: number): number | null {
  if (ratePerMin <= 0) return null;
  const headroom = 40 - waitMinutes;
  if (headroom <= 0) return 0;
  return Math.round(headroom / ratePerMin);
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'gates' | 'crowds' | 'stalls' | 'alerts' | 'incidents' | 'log';
const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'overview',   label: 'Overview',    icon: Activity },
  { key: 'gates',      label: 'Gates',       icon: ChevronRight },
  { key: 'crowds',     label: 'Crowds',      icon: Users },
  { key: 'stalls',     label: 'Food Stalls', icon: ForkKnife },
  { key: 'alerts',     label: 'Alerts',      icon: Megaphone },
  { key: 'incidents',  label: 'Incidents',   icon: ClipboardList },
  { key: 'log',        label: 'System Log',  icon: ScrollText },
];

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-accentEmerald text-pureBlack font-bold text-sm px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-slideUp">
      <CheckCircle2 className="w-4 h-4" />
      {message}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function StaffDashboard() {
  const navigate = useNavigate();
  const user = useUserStore(s => s.user);

  const gates    = useVenueStore(s => s.gates);
  const sections = useVenueStore(s => s.sections);
  const deployStaffToZone = useVenueStore(s => s.deployStaffToZone);

  const { stalls, updateStallStatus } = useFoodStore();

  const alerts      = useAlertStore(s => s.alerts);
  const addAlert    = useAlertStore(s => s.addAlert);
  const resolveAlert = useAlertStore(s => s.resolveAlert);

  const incidents         = useStaffStore(s => s.incidents);
  const actionLog         = useStaffStore(s => s.actionLog);
  const staffDeployments  = useStaffStore(s => s.staffDeployments);
  const createIncident    = useStaffStore(s => s.createIncident);
  const updateIncidentStatus = useStaffStore(s => s.updateIncidentStatus);
  const logAction         = useStaffStore(s => s.logAction);
  const deployStaff       = useStaffStore(s => s.deployStaffToZone);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [toast, setToast] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState(92);
  const [aiDismissed, setAiDismissed] = useState(false);

  // Alert form state
  const [alertMsg, setAlertMsg] = useState('');
  const [alertSev, setAlertSev] = useState<'info' | 'warning' | 'critical'>('info');
  const [alertZone, setAlertZone] = useState('All Zones');

  // Incident form state
  const [showIncForm, setShowIncForm] = useState(false);
  const [incType, setIncType] = useState<IncidentType>('medical');
  const [incZone, setIncZone] = useState('Gate A');
  const [incDesc, setIncDesc] = useState('');
  const [incAssigned, setIncAssigned] = useState('Unassigned');

  const showToast = (msg: string) => setToast(msg);

  // ── Live global KPIs ────────────────────────────────────────────────────────
  const allGates = GATE_KEYS.map(k => gates[k]).filter(Boolean);
  const allSections = SECTION_KEYS.map(k => sections[k]).filter(Boolean);
  const totalFans = allSections.reduce((a, s) => a + s.currentCount, 0);
  const totalCap  = allSections.reduce((a, s) => a + s.capacity, 0);
  const capacityPct = totalCap > 0 ? Math.round((totalFans / totalCap) * 100) : 0;
  const avgWait = allGates.length > 0
    ? Math.round(allGates.reduce((a, g) => a + g.waitMinutes, 0) / allGates.length)
    : 0;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const activeIncidents = incidents.filter(i => i.status !== 'resolved').length;

  // ── Critical zones (top 3 by risk) ─────────────────────────────────────────
  const criticalZones = [
    ...allGates.map(g => ({
      name: g.name, key: GATE_KEYS[allGates.indexOf(g)],
      value: g.waitMinutes, unit: 'min wait',
      trend: g.trend, rate: g.rate ?? 0, conf: g.confidence ?? 0,
      isDanger: g.status === 'high',
    })),
    ...allSections.map(s => ({
      name: s.name, key: SECTION_KEYS[allSections.indexOf(s)],
      value: s.density, unit: '% density',
      trend: s.trend, rate: s.rate ?? 0, conf: s.confidence ?? 0,
      isDanger: s.density >= 85,
    })),
  ]
    .filter(z => z.isDanger || (z.trend === 'increasing' && z.rate > 1))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);

  // ── Predictive warnings ─────────────────────────────────────────────────────
  const predictiveWarnings = allGates
    .map(g => {
      const eta = minutesUntilCritical(g.waitMinutes, g.rate ?? 0);
      return eta !== null && eta <= 10 ? { name: g.name, eta, rate: g.rate ?? 0 } : null;
    })
    .filter(Boolean) as { name: string; eta: number; rate: number }[];

  // ── Deploy handler ──────────────────────────────────────────────────────────
  const handleDeploy = (zoneKey: string, zoneName: string, count = 2) => {
    deployStaff(zoneKey, count);
    deployStaffToZone(zoneKey, count); // mutates venue store → attendee sees change
    addAlert({ title: `✅ Staff Deployed — ${zoneName}`, body: `${count} crowd staff dispatched to ${zoneName}. Congestion response initiated.`, severity: 'info', source: 'staff' });
    logAction('deploy', `${count} staff dispatched to ${zoneName}.`);
    showToast(`${count} staff deployed to ${zoneName}`);
  };

  // ── Publish alert handler ───────────────────────────────────────────────────
  const handlePublish = () => {
    if (!alertMsg.trim()) return;
    const zone = alertZone !== 'All Zones' ? `[${alertZone}] ` : '';
    addAlert({ title: `📢 ${zone}Staff Announcement`, body: alertMsg.trim(), severity: alertSev, source: 'staff' });
    logAction('announce', `Broadcast to ${alertZone}: "${alertMsg.trim().slice(0, 60)}"`);
    showToast('Announcement published to attendees');
    setAlertMsg('');
  };

  // ── Create incident ─────────────────────────────────────────────────────────
  const handleCreateIncident = () => {
    if (!incDesc.trim()) return;
    createIncident({ type: incType, zone: incZone, description: incDesc.trim(), status: 'active', assignedTo: incAssigned });
    addAlert({ title: `🚨 Incident: ${incType.replace('_', ' ')} at ${incZone}`, body: incDesc.trim(), severity: incType === 'medical' || incType === 'fire' ? 'critical' : 'warning', source: 'staff' });
    showToast('Incident created and logged');
    setIncDesc('');
    setShowIncForm(false);
  };

  const nextStatus = (s: IncidentStatus): IncidentStatus =>
    s === 'active' ? 'in_progress' : s === 'in_progress' ? 'resolved' : 'active';

  // ── Section block component ─────────────────────────────────────────────────
  const SectionCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) => (
    <div className="bg-pureBlack border border-borderSecondary rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-textSecondary font-bold">{label}</span>
      <span className={`text-2xl font-black ${color ?? 'text-white'}`}>{value}</span>
      {sub && <span className="text-[11px] text-textSecondary">{sub}</span>}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen flex flex-col w-full bg-pureBlack text-textPrimary overflow-y-auto">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <Navbar />

      <main className="flex-1 flex flex-col p-4 gap-5 w-full max-w-7xl mx-auto pb-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Staff Control Room</h1>
            <p className="text-textSecondary text-xs mt-0.5">
              Live operations · {user?.email ?? 'Staff'}
              <span className={`ml-2 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${user?.role === 'staff' ? 'bg-accentEmerald/20 text-accentEmerald' : 'bg-accentWarning/20 text-accentWarning'}`}>
                {user?.role ?? 'unknown'}
              </span>
            </p>
          </div>
          <button
            onClick={() => logout().then(() => navigate('/'))}
            className="flex items-center gap-2 text-textSecondary hover:text-accentRose transition-colors text-sm font-bold md:hidden"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>

        {/* ── Live KPI strip ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <SectionCard label="Est. Fans" value={totalFans.toLocaleString()} sub={`of ${totalCap.toLocaleString()}`} />
          <SectionCard label="Capacity" value={`${capacityPct}%`} color={capacityPct >= 90 ? 'text-accentRose' : capacityPct >= 75 ? 'text-accentWarning' : 'text-accentEmerald'} />
          <SectionCard label="Avg Wait" value={`${avgWait}m`} color={avgWait > 25 ? 'text-accentRose' : avgWait > 12 ? 'text-accentWarning' : 'text-accentEmerald'} />
          <SectionCard label="Active Alerts" value={alerts.length} color={criticalAlerts > 0 ? 'text-accentRose' : alerts.length > 0 ? 'text-accentWarning' : 'text-accentEmerald'} sub={criticalAlerts > 0 ? `${criticalAlerts} critical` : undefined} />
          <SectionCard label="Incidents" value={activeIncidents} color={activeIncidents > 0 ? 'text-accentRose' : 'text-accentEmerald'} />
          <SectionCard label="Staff On-Site" value={Object.values(staffDeployments).reduce((a, b) => a + b, 0)} color="text-accentBlue" />
        </div>

        {/* ── AI Director (always visible) ────────────────────────────────── */}
        <div className="bg-surface border border-accentWarning/30 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex gap-3 flex-1">
              <div className="w-10 h-10 bg-accentWarning/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot className="w-5 h-5 text-accentWarning" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-sm">AI Director Insight</h3>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-borderSecondary text-textSecondary uppercase">{aiConfidence}% CONF</span>
                </div>
                {!aiDismissed ? (
                  <p className="text-xs text-textSecondary leading-relaxed max-w-xl">
                    {sections['e1']?.trend === 'increasing'
                      ? <>Predictive model flags <span className="text-accentWarning font-bold">East 1</span> accelerating at {sections['e1']?.rate ?? 0}/min (density: {sections['e1']?.density ?? 0}%). Critical threshold in ~{minutesUntilCritical(sections['e1']?.density ?? 0, sections['e1']?.rate ?? 0) ?? '?'} min. Deploy crowd staff now.</>
                      : predictiveWarnings.length > 0
                        ? <>{predictiveWarnings[0].name} projected to reach critical congestion in <span className="text-accentWarning font-bold">{predictiveWarnings[0].eta} min</span>. Rate: +{predictiveWarnings[0].rate}/min.</>
                        : 'All zones within acceptable parameters. Monitoring for anomalies.'
                    }
                  </p>
                ) : (
                  <p className="text-xs text-textSecondary">Suggestion dismissed. <span className="text-accentRose">Confidence reduced.</span> AI is adapting model weights.</p>
                )}
              </div>
            </div>
            {!aiDismissed && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { handleDeploy('e1', 'East 1', 3); setAiDismissed(true); logAction('ai', 'AI recommendation accepted: staff deployed to East 1.'); showToast('AI directive executed'); }}
                  className="bg-accentWarning hover:bg-accentWarning/90 text-pureBlack font-bold py-1.5 px-4 rounded text-xs transition-colors flex items-center gap-1"
                >
                  <Megaphone className="w-3.5 h-3.5" /> Execute
                </button>
                <button
                  onClick={() => { setAiConfidence(c => Math.max(10, c - 15)); setAiDismissed(true); logAction('ai', 'AI recommendation rejected by staff.'); }}
                  className="border border-borderSecondary hover:border-accentRose hover:text-accentRose text-textSecondary font-bold py-1.5 px-4 rounded text-xs transition-colors flex items-center gap-1"
                >
                  <ThumbsDown className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-surface p-1 rounded-xl border border-borderSecondary overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.key ? 'bg-pureBlack text-textPrimary shadow-md' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: OVERVIEW                                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Critical Zones */}
            <div className="bg-surface border border-borderSecondary rounded-xl p-4 flex flex-col gap-3">
              <h3 className="text-xs uppercase tracking-widest text-textSecondary font-bold flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-accentRose" /> Critical Zones
              </h3>
              {criticalZones.length === 0 ? (
                <div className="py-6 text-center text-textSecondary text-sm">✅ No critical zones</div>
              ) : criticalZones.map((z, i) => (
                <div key={i} className="flex items-center gap-3 bg-pureBlack rounded-xl p-3 border border-borderSecondary">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{z.name}</span>
                      {trendIcon(z.trend)}
                      <span className="text-[10px] text-accentRose font-bold">+{z.rate}/m</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-lg font-black text-accentRose">{z.value}</span>
                      <span className="text-[10px] text-textSecondary">{z.unit}</span>
                      <span className="text-[10px] text-textSecondary/60">{z.conf}% conf</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => handleDeploy(z.key, z.name)} className="bg-accentBlue/20 hover:bg-accentBlue/40 text-accentBlue border border-accentBlue/30 text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all">
                      Deploy
                    </button>
                    <button
                      onClick={() => { addAlert({ title: `⚠️ ${z.name} Alert`, body: `${z.name} is at ${z.value} ${z.unit} and increasing at ${z.rate}/min. Attendees advised to avoid.`, severity: 'warning', source: 'staff' }); showToast(`Alert sent for ${z.name}`); }}
                      className="bg-accentWarning/20 hover:bg-accentWarning/40 text-accentWarning border border-accentWarning/30 text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all"
                    >
                      Alert
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Predictive Warnings */}
            <div className="bg-surface border border-borderSecondary rounded-xl p-4 flex flex-col gap-3">
              <h3 className="text-xs uppercase tracking-widest text-textSecondary font-bold flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-accentWarning" /> Predictive Warnings
              </h3>
              {predictiveWarnings.length === 0 ? (
                <div className="py-6 text-center text-textSecondary text-sm">✅ No imminent congestion predicted</div>
              ) : predictiveWarnings.map((w, i) => (
                <div key={i} className="flex items-center gap-3 bg-accentWarning/5 border border-accentWarning/30 rounded-xl p-3">
                  <AlertTriangle className="w-5 h-5 text-accentWarning flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{w.name}</p>
                    <p className="text-xs text-textSecondary">
                      Will reach critical congestion in <span className="text-accentWarning font-bold">{w.eta} min</span> · Rate: +{w.rate}/min
                    </p>
                  </div>
                  <button onClick={() => handleDeploy(GATE_KEYS.find(k => gates[k]?.name === w.name) ?? '', w.name)} className="text-[10px] font-bold bg-accentWarning text-pureBlack px-3 py-1.5 rounded-lg">
                    Deploy
                  </button>
                </div>
              ))}

              {/* Recent actions summary */}
              <div className="mt-2 pt-3 border-t border-borderPrimary">
                <p className="text-[10px] uppercase tracking-widest text-textSecondary font-bold mb-2">Recent Actions</p>
                {actionLog.slice(0, 4).map(e => (
                  <div key={e.id} className="flex items-start gap-2 py-1.5 border-b border-borderPrimary/50 last:border-0">
                    <span className={`text-[10px] font-bold flex-shrink-0 mt-0.5 ${logColor(e.category)}`}>{e.category.toUpperCase()}</span>
                    <span className="text-xs text-textSecondary flex-1">{e.message}</span>
                    <span className="text-[10px] text-textSecondary/50 flex-shrink-0">{elapsed(e.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: GATES                                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'gates' && (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-xl border border-borderSecondary">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-borderSecondary">
                  <tr className="text-textSecondary text-xs uppercase tracking-wider">
                    <th className="p-4 text-left font-medium">Gate</th>
                    <th className="p-4 text-left font-medium">Wait</th>
                    <th className="p-4 text-left font-medium">Status</th>
                    <th className="p-4 text-left font-medium">Trend</th>
                    <th className="p-4 text-left font-medium">Rate</th>
                    <th className="p-4 text-left font-medium">Staff</th>
                    <th className="p-4 text-left font-medium">Sparkline</th>
                    <th className="p-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSecondary bg-pureBlack">
                  {GATE_KEYS.map(key => {
                    const g = gates[key];
                    if (!g) return null;
                    const sc = staffDeployments[key] ?? 0;
                    const histVals = (g.history ?? []).map(h => h.val);
                    return (
                      <tr key={key} className={`hover:bg-surface/50 transition-colors ${g.status === 'high' ? 'bg-accentRose/5' : ''}`}>
                        <td className="p-4 font-bold text-white">{g.name}</td>
                        <td className="p-4">
                          <span className={`text-xl font-black ${g.status === 'high' ? 'text-accentRose' : g.status === 'medium' ? 'text-accentWarning' : 'text-accentEmerald'}`}>
                            {Math.round(g.waitMinutes)}m
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${badgeColor(g.status === 'high' ? 'critical' : g.status === 'medium' ? 'warning' : 'info')}`}>
                            {g.status}
                          </span>
                        </td>
                        <td className="p-4">{trendIcon(g.trend)}</td>
                        <td className="p-4 text-xs text-textSecondary">{g.rate != null ? `${g.rate > 0 ? '+' : ''}${g.rate}/m` : '–'}</td>
                        <td className="p-4 text-xs text-accentBlue font-bold">{sc}</td>
                        <td className="p-4">
                          <Sparkline data={histVals.length > 1 ? histVals : [g.waitMinutes, g.waitMinutes]} color={g.status === 'high' ? '#f43f5e' : g.status === 'medium' ? '#f59e0b' : '#10b981'} />
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => handleDeploy(key, g.name, 2)} className="text-[10px] font-bold px-3 py-1.5 bg-accentBlue/20 hover:bg-accentBlue/40 text-accentBlue border border-accentBlue/30 rounded-lg transition-all flex items-center gap-1">
                              <Users className="w-3 h-3" /> +2 Staff
                            </button>
                            <button
                              onClick={() => { addAlert({ title: `Gate Alert: ${g.name}`, body: `${g.name} wait time is ${Math.round(g.waitMinutes)} min. Attendees advised to use alternative gates.`, severity: g.status === 'high' ? 'critical' : 'warning', source: 'staff' }); showToast(`Alert sent for ${g.name}`); }}
                              className="text-[10px] font-bold px-3 py-1.5 bg-accentWarning/20 hover:bg-accentWarning/40 text-accentWarning border border-accentWarning/30 rounded-lg transition-all"
                            >
                              Alert
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: CROWDS                                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'crowds' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SECTION_KEYS.map(key => {
              const s = sections[key];
              if (!s) return null;
              const densityColor = s.density >= 90 ? 'bg-accentRose' : s.density >= 70 ? 'bg-accentWarning' : 'bg-accentEmerald';
              const textColor = s.density >= 90 ? 'text-accentRose' : s.density >= 70 ? 'text-accentWarning' : 'text-accentEmerald';
              const sc = staffDeployments[key] ?? 0;
              const histVals = (s.history ?? []).map(h => h.val);
              return (
                <div key={key} className={`bg-surface border rounded-xl p-4 flex flex-col gap-3 ${s.density >= 90 ? 'border-accentRose/50' : 'border-borderSecondary'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white">{s.name}</h4>
                      <p className="text-textSecondary text-xs">{s.currentCount.toLocaleString()} / {s.capacity.toLocaleString()} capacity</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {trendIcon(s.trend)}
                      <span className={`text-2xl font-black ${textColor}`}>{s.density}%</span>
                    </div>
                  </div>

                  {/* Density bar */}
                  <div className="w-full h-2 bg-pureBlack rounded-full overflow-hidden">
                    <div className={`h-full ${densityColor} rounded-full transition-all duration-700`} style={{ width: `${s.density}%` }} />
                  </div>

                  <div className="flex gap-3 text-xs text-textSecondary">
                    <span>Rate: {s.rate != null ? `${s.rate > 0 ? '+' : ''}${s.rate}/m` : '–'}</span>
                    <span>Conf: {s.confidence ?? 0}%</span>
                    <span className="text-accentBlue">Staff: {sc}</span>
                    {histVals.length > 1 && <Sparkline data={histVals} color={s.density >= 90 ? '#f43f5e' : '#f59e0b'} />}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleDeploy(key, s.name, 3)} className="flex-1 text-[10px] font-bold py-2 bg-accentBlue/20 hover:bg-accentBlue/40 text-accentBlue border border-accentBlue/30 rounded-lg transition-all flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" /> Deploy +3 Staff
                    </button>
                    <button
                      onClick={() => { addAlert({ title: `Crowd Alert: ${s.name}`, body: `${s.name} is at ${s.density}% capacity. Attendees advised to move to West 1.`, severity: s.density >= 90 ? 'critical' : 'warning', source: 'staff' }); showToast(`Crowd alert sent for ${s.name}`); }}
                      className="flex-1 text-[10px] font-bold py-2 bg-accentWarning/20 hover:bg-accentWarning/40 text-accentWarning border border-accentWarning/30 rounded-lg transition-all"
                    >
                      Send Alert
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: STALLS                                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'stalls' && (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-xl border border-borderSecondary">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-borderSecondary">
                  <tr className="text-textSecondary text-xs uppercase tracking-wider">
                    <th className="p-4 text-left font-medium">Stall</th>
                    <th className="p-4 text-left font-medium">Location</th>
                    <th className="p-4 text-left font-medium">Status</th>
                    <th className="p-4 text-left font-medium">Open Time</th>
                    <th className="p-4 text-left font-medium">Close Time</th>
                    <th className="p-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSecondary bg-pureBlack">
                  {Object.values(stalls).map(stall => (
                    <tr key={stall.id} className="hover:bg-surface/50 transition-colors">
                      <td className="p-4 font-bold text-white">
                        {stall.name}
                        <div className="text-xs text-textSecondary font-normal">{stall.category}</div>
                      </td>
                      <td className="p-4 text-textSecondary">{stall.near}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stall.isOpen ? 'bg-accentEmerald/20 text-accentEmerald' : 'bg-accentRose/20 text-accentRose'}`}>
                          {stall.isOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                      </td>
                      <td className="p-4">
                        <input
                          type="time"
                          value={(() => {
                            // Convert standard "10:00 AM" back to "10:00" for input
                            const m = stall.openTime.match(/(\d+):(\d+) (AM|PM)/);
                            if (!m) return '';
                            let [_, h, min, ampm] = m;
                            if (ampm === 'PM' && h !== '12') h = (parseInt(h) + 12).toString();
                            if (ampm === 'AM' && h === '12') h = '00';
                            return `${h.padStart(2, '0')}:${min}`;
                          })()}
                          onChange={(e) => {
                            const [h, m] = e.target.value.split(':');
                            const hour = parseInt(h);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const formattedH = hour % 12 === 0 ? 12 : hour % 12;
                            updateStallStatus(stall.id, { openTime: `${formattedH}:${m} ${ampm}` });
                            logAction('sys', `Updated open time for ${stall.name}`);
                          }}
                          className="bg-transparent border border-borderSecondary rounded px-2 py-1 text-white text-xs focus:outline-none"
                        />
                      </td>
                      <td className="p-4">
                         <input
                          type="time"
                          value={(() => {
                            const m = stall.closeTime.match(/(\d+):(\d+) (AM|PM)/);
                            if (!m) return '';
                            let [_, h, min, ampm] = m;
                            if (ampm === 'PM' && h !== '12') h = (parseInt(h) + 12).toString();
                            if (ampm === 'AM' && h === '12') h = '00';
                            return `${h.padStart(2, '0')}:${min}`;
                          })()}
                          onChange={(e) => {
                            const [h, m] = e.target.value.split(':');
                            const hour = parseInt(h);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const formattedH = hour % 12 === 0 ? 12 : hour % 12;
                            updateStallStatus(stall.id, { closeTime: `${formattedH}:${m} ${ampm}` });
                            logAction('sys', `Updated close time for ${stall.name}`);
                          }}
                          className="bg-transparent border border-borderSecondary rounded px-2 py-1 text-white text-xs focus:outline-none"
                        />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            updateStallStatus(stall.id, { isOpen: !stall.isOpen });
                            logAction('toggle', `${stall.name} marked as ${!stall.isOpen ? 'OPEN' : 'CLOSED'}`);
                            showToast(`${stall.name} ${!stall.isOpen ? 'opened' : 'closed'}`);
                          }}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                            stall.isOpen 
                              ? 'bg-accentRose/20 hover:bg-accentRose/40 text-accentRose border border-accentRose/30'
                              : 'bg-accentEmerald/20 hover:bg-accentEmerald/40 text-accentEmerald border border-accentEmerald/30'
                          }`}
                        >
                          {stall.isOpen ? 'Force Close' : 'Open Stall'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: ALERTS                                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'alerts' && (
          <div className="flex flex-col gap-5">
            {/* Compose */}
            <div className="bg-surface border border-borderSecondary rounded-xl p-5 flex flex-col gap-3">
              <h3 className="text-xs uppercase tracking-widest text-textSecondary font-bold">📢 Broadcast Message</h3>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  value={alertMsg}
                  onChange={e => setAlertMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePublish()}
                  placeholder="E.g. Gate C is congested — please use Gate B or D"
                  className="flex-1 min-w-[200px] bg-pureBlack border border-borderSecondary rounded-lg px-4 py-2 text-sm text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-accentBlue transition-colors"
                />
                <select value={alertZone} onChange={e => setAlertZone(e.target.value)} className="bg-pureBlack border border-borderSecondary rounded-lg px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accentBlue">
                  <option>All Zones</option>
                  <option>Gate A</option><option>Gate B</option><option>Gate C</option>
                  <option>Gate D</option><option>Gate E</option><option>Gate F</option>
                  <option>North 1</option><option>South 1</option><option>East 1</option><option>West 1</option>
                </select>
                <select value={alertSev} onChange={e => setAlertSev(e.target.value as any)} className="bg-pureBlack border border-borderSecondary rounded-lg px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accentBlue">
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
                <button onClick={handlePublish} className="bg-accentBlue hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg transition-all text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Publish
                </button>
              </div>
            </div>

            {/* Live alerts */}
            <div className="bg-surface border border-borderSecondary rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-borderSecondary">
                <h3 className="text-xs uppercase tracking-widest text-textSecondary font-bold">Live Active Alerts ({alerts.length})</h3>
                {alerts.length > 0 && <button onClick={() => { alerts.forEach(a => resolveAlert(a.id)); logAction('resolve', `All ${alerts.length} alerts resolved by staff.`); showToast('All alerts cleared'); }} className="text-[10px] font-bold text-textSecondary hover:text-accentEmerald transition-colors">Clear All</button>}
              </div>
              {alerts.length === 0 ? (
                <div className="p-10 text-center text-textSecondary flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-accentEmerald" />
                  No active alerts — all clear!
                </div>
              ) : (
                <div className="divide-y divide-borderSecondary">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-4 p-4 hover:bg-borderSecondary/20 transition-colors">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 mt-0.5 ${badgeColor(alert.severity)}`}>{alert.severity}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-textPrimary">{alert.title}</p>
                        <p className="text-textSecondary text-xs mt-0.5">{alert.body}</p>
                        <p className="text-textSecondary/50 text-[10px] mt-1">{elapsed(alert.createdAt)} · {alert.source}</p>
                      </div>
                      <button onClick={() => { resolveAlert(alert.id); logAction('resolve', `Alert resolved: "${alert.title}"`); showToast('Alert resolved'); }} className="text-textSecondary hover:text-accentEmerald text-xs font-bold border border-borderSecondary hover:border-accentEmerald px-3 py-1.5 rounded-lg transition-all flex-shrink-0">
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: INCIDENTS                                                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'incidents' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <p className="text-textSecondary text-xs">{incidents.filter(i => i.status !== 'resolved').length} active · {incidents.filter(i => i.status === 'resolved').length} resolved</p>
              <button onClick={() => setShowIncForm(!showIncForm)} className="flex items-center gap-1.5 bg-accentRose text-white font-bold text-xs px-4 py-2 rounded-lg transition-all hover:bg-accentRose/90 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                <Plus className="w-3.5 h-3.5" /> New Incident
              </button>
            </div>

            {/* Incident creation form */}
            {showIncForm && (
              <div className="bg-surface border border-accentRose/40 rounded-xl p-5 flex flex-col gap-3 animate-slideUp">
                <h3 className="text-xs uppercase tracking-widest text-accentRose font-bold">Create Incident Report</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select value={incType} onChange={e => setIncType(e.target.value as IncidentType)} className="bg-pureBlack border border-borderSecondary rounded-lg px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accentRose">
                    <option value="medical">🏥 Medical</option>
                    <option value="crowd_surge">🌊 Crowd Surge</option>
                    <option value="technical">⚙️ Technical</option>
                    <option value="security">🛡️ Security</option>
                    <option value="fire">🔥 Fire/Evacuation</option>
                  </select>
                  <select value={incZone} onChange={e => setIncZone(e.target.value)} className="bg-pureBlack border border-borderSecondary rounded-lg px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-accentRose">
                    {['Gate A','Gate B','Gate C','Gate D','Gate E','Gate F','North 1','South 1','East 1','West 1'].map(z => <option key={z}>{z}</option>)}
                  </select>
                  <input type="text" value={incAssigned} onChange={e => setIncAssigned(e.target.value)} placeholder="Assigned to (name/ID)" className="bg-pureBlack border border-borderSecondary rounded-lg px-3 py-2 text-sm text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-accentRose" />
                </div>
                <textarea value={incDesc} onChange={e => setIncDesc(e.target.value)} placeholder="Describe the incident..." rows={2} className="w-full bg-pureBlack border border-borderSecondary rounded-lg px-3 py-2 text-sm text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-accentRose resize-none" />
                <div className="flex gap-2">
                  <button onClick={handleCreateIncident} className="bg-accentRose hover:bg-accentRose/90 text-white font-bold px-5 py-2 rounded-lg text-sm transition-all">Create Incident</button>
                  <button onClick={() => setShowIncForm(false)} className="text-textSecondary hover:text-white px-4 py-2 rounded-lg text-sm border border-borderSecondary transition-all">Cancel</button>
                </div>
              </div>
            )}

            {/* Incident list */}
            <div className="flex flex-col gap-3">
              {incidents.length === 0 ? (
                <div className="bg-surface border border-borderSecondary rounded-xl p-10 text-center text-textSecondary flex flex-col items-center gap-2">
                  <Shield className="w-8 h-8 text-accentEmerald" />
                  No incidents logged
                </div>
              ) : incidents.map(inc => (
                <div key={inc.id} className={`bg-surface border rounded-xl p-4 flex flex-col gap-3 ${inc.status === 'active' ? 'border-accentRose/40' : inc.status === 'in_progress' ? 'border-accentWarning/40' : 'border-borderSecondary opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(inc.status)}`}>{inc.status.replace('_', ' ')}</span>
                        <span className="text-xs font-bold text-white capitalize">{inc.type.replace('_', ' ')}</span>
                        <span className="text-textSecondary text-xs">@ {inc.zone}</span>
                      </div>
                      <p className="text-sm text-textSecondary">{inc.description}</p>
                      <p className="text-[10px] text-textSecondary/50 mt-1">Created {elapsed(inc.createdAt)} · Assigned: <span className="text-accentBlue">{inc.assignedTo}</span></p>
                    </div>
                    {inc.status !== 'resolved' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => { updateIncidentStatus(inc.id, nextStatus(inc.status)); showToast(`Incident updated to ${nextStatus(inc.status).replace('_',' ')}`); }} className="text-[10px] font-bold px-3 py-1.5 bg-accentBlue/20 hover:bg-accentBlue/40 text-accentBlue border border-accentBlue/30 rounded-lg transition-all flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> {nextStatus(inc.status).replace('_', ' ')}
                        </button>
                        <button onClick={() => { handleDeploy(GATE_KEYS.find(k => gates[k]?.name === inc.zone) ?? inc.zone, inc.zone); }} className="text-[10px] font-bold px-3 py-1.5 bg-surface hover:bg-borderSecondary text-textSecondary border border-borderSecondary rounded-lg transition-all">
                          Deploy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: SYSTEM LOG                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'log' && (
          <div className="bg-surface border border-borderSecondary rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-borderSecondary">
              <h3 className="text-xs uppercase tracking-widest text-textSecondary font-bold flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Real-Time System Log ({actionLog.length} entries)
              </h3>
            </div>
            <div className="divide-y divide-borderPrimary max-h-[60vh] overflow-y-auto">
              {actionLog.length === 0 ? (
                <div className="p-8 text-center text-textSecondary text-sm">No actions logged yet.</div>
              ) : actionLog.map(entry => (
                <div key={entry.id} className="flex items-start gap-4 px-4 py-3 hover:bg-borderSecondary/20 transition-colors">
                  <span className={`text-[10px] font-black uppercase w-16 flex-shrink-0 mt-0.5 ${logColor(entry.category)}`}>{entry.category}</span>
                  <span className="text-xs text-textPrimary flex-1">{entry.message}</span>
                  <span className="text-[10px] text-textSecondary/50 flex-shrink-0">{elapsed(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
