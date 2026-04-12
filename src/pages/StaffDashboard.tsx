import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { Chart } from 'react-google-charts';

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
  ["Burger King", 45, "#D85A30"],
  ["Pizza Hut", 25, "#EF9F27"],
  ["Beer Stand 1", 60, "#D85A30"],
  ["Merch Table", 15, "#1D9E75"]
];

const chartOptions = {
  backgroundColor: '#161b22',
  colors: ['#1D9E75', '#EF9F27', '#D85A30', '#e6edf3'],
  legend: { textStyle: { color: '#8b949e' } },
  hAxis: { textStyle: { color: '#8b949e' }, gridlines: { color: '#30363d' } },
  vAxis: { textStyle: { color: '#8b949e' }, gridlines: { color: '#30363d' } },
  chartArea: { width: '85%', height: '70%' },
  fontName: 'Inter'
};

const barOptions = {
  ...chartOptions,
  legend: { position: 'none' }
};

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'alerts'>('analytics');
  const [newAlertInput, setNewAlertInput] = useState('');

  const handlePublish = () => {
    if (!newAlertInput.trim()) return;
    alert(`[Broadcast Simulated]: ${newAlertInput}`);
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
                  className="flex-1 bg-pureBlack border border-borderSecondary rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accentCoral transition-colors text-textPrimary placeholder:text-textSecondary"
                  onKeyDown={(e) => e.key === 'Enter' && handlePublish()}
                />
                <select className="bg-pureBlack border border-borderSecondary rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accentCoral text-textPrimary">
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
                <button onClick={handlePublish} className="bg-accentCoral hover:bg-[#C2502A] text-pureBlack font-bold px-6 py-2 rounded-lg transition-transform focus:outline-none active:scale-[0.98]">
                  PUBLISH ALL
                </button>
              </div>
            </div>

            <div className="border-t border-borderSecondary pt-6">
               <h3 className="text-xs uppercase tracking-[0.06em] text-textSecondary mb-4 font-semibold">Live Active Alerts</h3>
               <div className="bg-pureBlack border border-borderSecondary rounded-lg overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-[#11151a] border-b border-borderSecondary text-textSecondary text-xs tracking-wider uppercase">
                     <tr>
                       <th className="p-4 font-medium">Time</th>
                       <th className="p-4 font-medium">Message</th>
                       <th className="p-4 font-medium">Severity</th>
                       <th className="p-4 font-medium text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-borderSecondary">
                     <tr className="hover:bg-borderSecondary/30 transition-colors">
                       <td className="p-4 text-textSecondary whitespace-nowrap">2 mins ago</td>
                       <td className="p-4 font-medium">Wet floor reported near Gate C escalators</td>
                       <td className="p-4"><span className="inline-block px-2 py-1 bg-accentWarning/20 text-accentWarning text-xs font-bold rounded-full">Warning</span></td>
                       <td className="p-4 text-right">
                         <button className="text-textSecondary hover:text-accentSuccess font-medium text-xs border border-borderSecondary hover:border-accentSuccess px-3 py-1 rounded transition-colors">Resolve</button>
                       </td>
                     </tr>
                     <tr className="hover:bg-borderSecondary/30 transition-colors">
                       <td className="p-4 text-textSecondary whitespace-nowrap">15 mins ago</td>
                       <td className="p-4 font-medium">Merch Stand 2 operating at peak capacity</td>
                       <td className="p-4"><span className="inline-block px-2 py-1 bg-[#1D9E75]/20 text-[#1D9E75] text-xs font-bold rounded-full">Info</span></td>
                       <td className="p-4 text-right">
                         <button className="text-textSecondary hover:text-accentSuccess font-medium text-xs border border-borderSecondary hover:border-accentSuccess px-3 py-1 rounded transition-colors">Resolve</button>
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
