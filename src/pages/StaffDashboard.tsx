import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { Chart } from 'react-google-charts';
import { useVenueStore } from '../store/useVenueStore';
import { useAlertStore } from '../store/useAlertStore';
import { Bot, ThumbsDown, Megaphone, CheckCircle2 } from 'lucide-react';

// Mock chart data
const crowdData = [
  ["Time", "North", "South", "East", "West"],
  ["18:00", 20, 25, 10, 15],
  ["18:15", 35, 40, 25, 30],
  ["18:30", 55, 60, 45, 50],
  ["18:45", 80, 85, 70, 75],
  ["19:00", 95, 90, 85, 80]
];

const stallData = [
  ["Stall", "Queue Size", { role: "style" }],
  ["Burger King", 45, "#f43f5e"],
  ["Pizza Hut", 25, "#f59e0b"],
  ["Beer Stand 1", 60, "#f43f5e"],
  ["Merch Table", 15, "#10b981"]
];

const chartOptions = {
  backgroundColor: '#0f172a',
  colors: ['#10b981', '#f59e0b', '#f43f5e', '#f8fafc'],
  legend: { textStyle: { color: '#94a3b8' } },
  hAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: '#1e293b' } },
  vAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: '#1e293b' } },
  chartArea: { width: '85%', height: '70%' },
  fontName: 'Inter'
};

const barOptions = { ...chartOptions, legend: { position: 'none' } };

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'alerts'>('analytics');
  const [newAlertInput, setNewAlertInput] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'info' | 'warning' | 'critical'>('info');

  // AI Feedback Loop
  const [aiConfidence, setAiConfidence] = useState(92);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  const sections = useVenueStore((state) => state.sections);

  // Alert store wiring — global, affects public view instantly
  const alerts      = useAlertStore((state) => state.alerts);
  const addAlert    = useAlertStore((state) => state.addAlert);
  const resolveAlert = useAlertStore((state) => state.resolveAlert);

  const handleDismissAi = () => {
    setAiConfidence((prev) => Math.max(10, prev - 15));
    setSuggestionDismissed(true);
    addAlert({
      title: 'AI Suggestion Rejected',
      body: 'Staff dismissed the East 1 diversion recommendation. Model confidence reduced.',
      severity: 'info',
      source: 'staff',
    });
  };

  const handleDeployStaff = () => {
    addAlert({
      title: '✅ Staff Deployed – Concourse E',
      body: '2 supplemental crowd managers dispatched to East concourse. Situation monitored.',
      severity: 'info',
      source: 'staff',
    });
  };

  const handlePublish = () => {
    if (!newAlertInput.trim()) return;
    // This writes to the global store → attendee view sees it instantly
    addAlert({
      title: `📢 Staff Announcement`,
      body: newAlertInput.trim(),
      severity: alertSeverity,
      source: 'staff',
    });
    setNewAlertInput('');
  };


  return (
    <div className="min-h-screen flex flex-col w-full bg-pureBlack text-textPrimary">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-4 gap-6 w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">STAFF CONTROL ROOM</h2>
          <div className="flex gap-2 bg-surface p-1 rounded-lg border border-borderSecondary">
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'analytics' ? 'bg-borderSecondary text-textPrimary' : 'text-textSecondary hover:text-textPrimary'}`}
              onClick={() => setActiveTab('analytics')}
            >Analytics</button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'alerts' ? 'bg-borderSecondary text-textPrimary' : 'text-textSecondary hover:text-textPrimary'}`}
              onClick={() => setActiveTab('alerts')}
            >Alert Management</button>
          </div>
        </div>

        {/* AI Director Recommendation Engine */}
        <div className="bg-surface border border-accentWarning/30 shadow-[0_0_15px_-3px_rgba(239,159,39,0.1)] rounded-xl p-5 mb-2 relative overflow-hidden">
           <div className="flex justify-between items-start">
              <div className="flex gap-4">
                 <div className="w-12 h-12 bg-accentWarning/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Bot className="w-6 h-6 text-accentWarning" />
                 </div>
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-bold text-textPrimary text-lg tracking-tight">AI Director Insight</h3>
                       <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-borderSecondary text-textSecondary uppercase tracking-widest">{aiConfidence}% CONFIDENCE</span>
                    </div>
                    {!suggestionDismissed ? (
                        <p className="text-sm text-textSecondary max-w-2xl leading-relaxed">
                          Predictive modeling flags <span className="text-accentWarning font-bold">East 1</span> density accelerating rapidly ({sections['e1']?.rate || 0}/min). We recommend deploying 2 supplemental crowd staff to Concourse E immediately to prevent critical bottlenecks.
                        </p>
                    ) : (
                        <p className="text-sm text-textSecondary max-w-2xl leading-relaxed">
                          Suggestion dismissed by Staff. <span className="text-accentRose font-bold">Negative reward applied.</span> The AI matrix has dynamically lowered confidence weighting for this scenario signature.
                        </p>
                    )}
                 </div>
              </div>
              
              {!suggestionDismissed && (
                 <div className="flex flex-col gap-2">
                    <button onClick={handleDeployStaff} className="bg-accentWarning hover:bg-accentWarning/90 text-pureBlack font-bold py-2 px-6 rounded text-sm transition-colors flex items-center justify-center gap-2">
                       <Megaphone className="w-4 h-4" />
                       Deploy Staff
                    </button>
                    <button onClick={handleDismissAi} className="bg-transparent border border-borderSecondary hover:border-accentRose hover:text-accentRose text-textSecondary font-bold py-2 px-6 rounded text-sm transition-colors flex items-center justify-center gap-2 group">
                       <ThumbsDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                       Reject
                    </button>
                 </div>
              )}
           </div>
        </div>

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-borderSecondary rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-[0.06em] text-textSecondary mb-4 font-semibold">Crowd Density (Last 60m)</h3>
              <div className="h-[300px] w-full">
                <Chart
                  chartType="LineChart"
                  width="100%"
                  height="100%"
                  data={crowdData}
                  options={chartOptions}
                />
              </div>
            </div>

            <div className="bg-surface border border-borderSecondary rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-[0.06em] text-textSecondary mb-4 font-semibold">Live Stall Queues</h3>
              <div className="h-[300px] w-full">
                <Chart
                  chartType="BarChart"
                  width="100%"
                  height="100%"
                  data={stallData}
                  options={barOptions}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="bg-surface border border-borderSecondary rounded-xl p-6 flex flex-col gap-6">
            <div>
              <h3 className="text-xs uppercase tracking-[0.06em] text-textSecondary mb-4 font-semibold">Publish New Alert</h3>
              <div className="flex gap-4 flex-col md:flex-row">
                <input 
                  type="text" 
                  value={newAlertInput}
                  onChange={(e) => setNewAlertInput(e.target.value)}
                  placeholder="E.g. Crowd congestion near Gate B"
                  className="flex-1 bg-pureBlack border border-borderSecondary rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accentBlue transition-colors text-textPrimary placeholder:text-textSecondary"
                  onKeyDown={(e) => e.key === 'Enter' && handlePublish()}
                />
                <select value={alertSeverity} onChange={(e) => setAlertSeverity(e.target.value as any)} className="bg-pureBlack border border-borderSecondary rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accentBlue text-textPrimary">
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
                <button onClick={handlePublish} className="bg-accentBlue hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg transition-all focus:outline-none active:scale-[0.98] shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  PUBLISH ALL
                </button>
              </div>
            </div>

            <div className="border-t border-borderSecondary pt-6">
               <h3 className="text-xs uppercase tracking-[0.06em] text-textSecondary mb-4 font-semibold">Live Active Alerts</h3>
               <div className="bg-pureBlack border border-borderSecondary rounded-lg overflow-hidden">
                 {alerts.length === 0 ? (
                   <div className="p-8 text-center text-textSecondary text-sm flex flex-col items-center gap-2">
                     <CheckCircle2 className="w-8 h-8 text-accentEmerald" />
                     No active alerts — all clear!
                   </div>
                 ) : (
                   <table className="w-full text-left text-sm">
                     <thead className="bg-surface border-b border-borderSecondary text-textSecondary text-xs tracking-wider uppercase">
                       <tr>
                         <th className="p-4 font-medium">Time</th>
                         <th className="p-4 font-medium">Message</th>
                         <th className="p-4 font-medium">Severity</th>
                         <th className="p-4 font-medium text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-borderSecondary">
                       {alerts.map((alert) => {
                         const elapsed = Math.round((Date.now() - alert.createdAt) / 60000);
                         const elapsedStr = elapsed < 1 ? 'just now' : `${elapsed} min ago`;
                         const badgeClass =
                           alert.severity === 'critical' ? 'bg-accentRose/20 text-accentRose' :
                           alert.severity === 'warning'  ? 'bg-accentWarning/20 text-accentWarning' :
                                                          'bg-accentBlue/20 text-accentBlue';
                         return (
                           <tr key={alert.id} className="hover:bg-borderSecondary/20 transition-colors">
                             <td className="p-4 text-textSecondary whitespace-nowrap text-xs">{elapsedStr}</td>
                             <td className="p-4">
                               <p className="font-medium text-sm">{alert.title}</p>
                               <p className="text-textSecondary text-xs mt-0.5">{alert.body}</p>
                             </td>
                             <td className="p-4">
                               <span className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${badgeClass}`}>
                                 {alert.severity}
                               </span>
                             </td>
                             <td className="p-4 text-right">
                               <button
                                 onClick={() => resolveAlert(alert.id)}
                                 className="text-textSecondary hover:text-accentEmerald font-medium text-xs border border-borderSecondary hover:border-accentEmerald px-3 py-1 rounded transition-colors"
                               >
                                 Resolve
                               </button>
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 )}
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
