import Navbar from '../components/layout/Navbar';
import KPIStrip from '../components/dashboard/KPIStrip';
import StadiumMap from '../components/dashboard/StadiumMap';
import GateBoard from '../components/dashboard/GateBoard';
import GeminiChat from '../components/ai/GeminiChat';
import { useTickerUpdates } from '../hooks/useTickerUpdates';
import { useVenueStore } from '../store/useVenueStore';
import { Sparkles, BellRing } from 'lucide-react';
import { useAlertStore } from '../store/useAlertStore';

export default function AttendeeView() {
  useTickerUpdates();
  const setIsChatOpen  = useVenueStore(state => state.setIsChatOpen);
  const isChatOpen     = useVenueStore(state => state.isChatOpen);
  const isFocusMode    = useVenueStore(state => state.isFocusMode);
  const unreadAlerts   = useAlertStore(state => state.alerts.filter(a => !a.isRead).length);
  const toggleNotifPanel = useAlertStore(state => state.toggleNotifPanel);

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

        {/* Centre AI FAB — elevated */}
        <div className="relative -top-5">
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-accentBlue text-white rounded-full shadow-[0_0_25px_rgba(59,130,246,0.6)] flex items-center justify-center outline-none hover:scale-110 active:scale-95 transition-all"
            aria-label="Open AI"
          >
            <Sparkles className="w-6 h-6" />
          </button>
          <span className="absolute -top-1 -right-1 text-[8px] font-black bg-accentEmerald text-pureBlack rounded-full px-1 leading-4">AI</span>
        </div>

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
    </div>
  );
}
