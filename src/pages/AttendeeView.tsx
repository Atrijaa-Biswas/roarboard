import Navbar from '../components/layout/Navbar';
import KPIStrip from '../components/dashboard/KPIStrip';
import StadiumMap from '../components/dashboard/StadiumMap';
import GateBoard from '../components/dashboard/GateBoard';
import GeminiChat from '../components/ai/GeminiChat';
import { useTickerUpdates } from '../hooks/useTickerUpdates';
import { useVenueStore } from '../store/useVenueStore';
import { Sparkles, BellRing, ForkKnife } from 'lucide-react';
import { useAlertStore } from '../store/useAlertStore';
// No longer needed

export default function AttendeeView() {
  useTickerUpdates();
  const setIsChatOpen  = useVenueStore(state => state.setIsChatOpen);
  const isChatOpen     = useVenueStore(state => state.isChatOpen);
  const isFocusMode    = useVenueStore(state => state.isFocusMode);
  const unreadAlerts   = useAlertStore(state => state.alerts.filter(a => !a.isRead).length);
  const toggleNotifPanel = useAlertStore(state => state.toggleNotifPanel);
  
// Removed unused isFoodModalOpen state
  
  const stalls = [
    { id: 1, name: 'Gate A Burgers', near: 'Gate A', menu: ['Classic Burger $8', 'Cheese Fries $5', 'Soda $3'] },
    { id: 2, name: 'Taco Stand', near: 'Gate B', menu: ['Beef Taco $4', 'Quesadilla $6', 'Guac $3'] },
    { id: 3, name: 'Pizza Slice', near: 'Gate C', menu: ['Pepperoni Slice $5', 'Garlic Knots $4', 'Drink $2'] },
    { id: 4, name: 'Sushi Roll', near: 'Gate D', menu: ['California Roll $7', 'Miso Soup $4', 'Edamame $3'] },
    { id: 5, name: 'Wing Zone', near: 'Gate E', menu: ['6 Wings $9', 'Celery $2', 'Ranch $1'] },
    { id: 6, name: 'Falafel Cart', near: 'Gate F', menu: ['Falafel Pita $6', 'Hummus $4', 'Baklava $3'] },
  ];

  const toggleFoodModal = () => {
    const sheet = document.getElementById('food-stall-sheet');
    if (sheet) {
      if (sheet.classList.contains('translate-y-full')) {
        sheet.classList.remove('translate-y-full');
      } else {
        sheet.classList.add('translate-y-full');
      }
    }
  };

  const placeOrder = (stallName: string) => {
    useAlertStore.getState().addAlert({
      title: '🍔 Order Placed!',
      body: `Your order from ${stallName} is confirmed. Pickup ready in 10 min.`,
      severity: 'info',
      source: 'system' as const,
    });
    toggleFoodModal(); // Close modal
  };


  return (
    <div className="h-screen w-screen overflow-hidden bg-pureBlack text-textPrimary relative">

      {/* ── LAYER 0: Full-screen map background ────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <StadiumMap />
      </div>

      {/* ── LAYER 1: HUD — fades during Focus/Navigation Mode ──────────────── */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 z-10 ${isFocusMode ? 'opacity-0' : 'opacity-100'}`}>

        {/* Top cluster: Navbar + KPI strip (desktop) */}
        <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex flex-col gap-3 pointer-events-none">
          <Navbar />
          <div className="pointer-events-auto w-full max-w-7xl mx-auto hidden lg:block">
            <KPIStrip />
          </div>
        </div>

        {/* Left panel: Gate Board (desktop) */}
        <div className="absolute left-6 top-36 bottom-6 w-80 hidden lg:flex flex-col pointer-events-auto">
          <GateBoard />
        </div>

        {/* Mobile KPI strip */}
        <div className={`lg:hidden absolute top-[86px] left-0 w-full px-4 pointer-events-auto transition-opacity duration-500 ${isFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <KPIStrip />
        </div>
      </div>

      {/* ── LAYER 2: Chat — ALWAYS on top, never fades ─────────────────────── */}
      {/* Desktop: floating panel bottom-right, triggered by FAB */}
      <div className="absolute right-6 bottom-6 z-30 hidden lg:flex flex-col items-end gap-3 pointer-events-auto">
        {/* Chat Panel */}
        <GeminiChat />

        {/* Desktop FAB to open chat — always visible when chat is closed */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-accentBlue text-white rounded-full shadow-[0_0_25px_rgba(59,130,246,0.55)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none group"
            aria-label="Open AI Assistant"
          >
            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          </button>
        )}
      </div>

      {/* Mobile: Chat rendered globally (handles its own FAB + fullscreen sheet) */}
      <div className="lg:hidden pointer-events-auto">
        <GeminiChat />
      </div>

      {/* ── LAYER 3: Mobile Bottom Nav ─────────────────────────────────────── */}
      <div className="lg:hidden glass-panel fixed bottom-5 left-1/2 -translate-x-1/2 w-[88%] max-w-sm rounded-[2rem] z-50 flex items-center justify-between px-5 py-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.9)] pointer-events-auto">

        {/* Home */}
        <button
          onClick={() => window.location.reload()}
          className="text-textSecondary hover:text-white flex flex-col items-center gap-0.5 outline-none transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[9px] font-bold">Home</span>
        </button>

        {/* Gates sheet */}
        <button
          onClick={() => document.getElementById("mobile-gate-sheet")?.classList.toggle("translate-y-full")}
          className="text-textSecondary hover:text-accentEmerald flex flex-col items-center gap-0.5 outline-none transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-[9px] font-bold">Gates</span>
        </button>

        {/* Centre Food Stall Finder — matches other nav icons */}
        <button
          onClick={toggleFoodModal}
          className="text-textSecondary hover:text-accentEmerald flex flex-col items-center gap-0.5 outline-none transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.5 15.25a2.75 2.75 0 0 1-2.75-2.75v-4.5a2.75 2.75 0 0 1 2.74-2.75c1.25 0 2.67.75 2.74 2.75v4.5c0 1.5-1.25 2.75-2.74 2.75zm0 2.75a5.5 2.75 0 0 1-2.74-2.75v-4.5c0-1.5 1.25-2.75 2.74-2.75 1.25 0 2.67.75 2.74 2.75v4.5c0 1.5-1.25 2.75-2.74 2.75zM12.5 15.25a2.75 2.75 0 0 1-2.74-2.75v-4.5a2.75 2.75 0 0 1 2.74-2.75c1.25 0 2.67.75 2.74 2.75v4.5c0 1.5-1.25 2.75-2.74 2.75zm0 2.75a5.5 2.75 0 0 1-2.74-2.75v-4.5c0-1.5 1.25-2.75 2.74-2.75 1.25 0 2.67.75 2.74 2.75v4.5c0 1.5-1.25 2.75-2.74 2.75z" />
          </svg>
          <span className="text-[9px] font-bold">Food</span>
        </button>

        {/* Alerts bell */}
        <button
          onClick={toggleNotifPanel}
          className="text-textSecondary hover:text-accentWarning flex flex-col items-center gap-0.5 relative outline-none transition-colors"
        >
          <BellRing className="w-5 h-5" />
          <span className="text-[9px] font-bold">Alerts</span>
          {unreadAlerts > 0 && (
            <span className="absolute -top-1 right-0 min-w-[14px] h-3.5 bg-accentRose rounded-full text-[8px] font-black text-white flex items-center justify-center px-0.5">
              {unreadAlerts}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile Gate Sheet (swipe-up panel) ─────────────────────────────── */}
      <div
        id="mobile-gate-sheet"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 transform translate-y-full transition-transform duration-500 ease-in-out pointer-events-auto flex flex-col h-[68vh]"
      >
        <div className="glass-panel rounded-t-3xl border-b-0 h-full w-full p-4 pt-2 flex flex-col">
          <div
            className="w-12 h-1.5 bg-borderSecondary rounded-full mx-auto mb-4 cursor-pointer"
            onClick={() => document.getElementById("mobile-gate-sheet")?.classList.add("translate-y-full")}
          />
          <GateBoard />
        </div>
      </div>

      {/* ── Food Stall Finder Sheet ────────────────────────────────────────── */}
      <div
        id="food-stall-sheet"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 transform translate-y-full transition-transform duration-500 ease-in-out pointer-events-auto flex flex-col max-h-[70vh] overflow-hidden"
      >
        <div className="glass-panel rounded-t-3xl border-b-0 flex-1 w-full p-4 pt-2 flex flex-col overflow-y-auto">
          <div className="w-12 h-1.5 bg-borderSecondary rounded-full mx-auto mb-4 cursor-pointer self-start" 
               onClick={toggleFoodModal} />
          <h3 className="font-black text-lg text-white mb-4 tracking-tight flex items-center gap-2">
            <ForkKnife className="w-6 h-6 text-accentEmerald" />
            Nearby Food Stalls
          </h3>
          <div className="space-y-3">
            {stalls.map(stall => (
              <div key={stall.id} className="bg-surface/50 border border-borderSecondary/50 rounded-2xl p-4 hover:bg-surface/80 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-white text-base">{stall.name}</h4>
                  <span className="text-[10px] bg-accentEmerald/20 text-accentEmerald font-bold px-2 py-0.5 rounded-full">
                    Near {stall.near}
                  </span>
                </div>
                <ul className="text-sm text-textSecondary space-y-1 mb-3">
                  {stall.menu.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{item}</span>
                      <span className="font-bold text-white">{item.split('$')[1]}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => placeOrder(stall.name)}
                  className="w-full bg-accentEmerald hover:bg-accentEmerald/90 text-pureBlack font-bold py-2.5 px-4 rounded-xl text-sm shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  Place Order
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
