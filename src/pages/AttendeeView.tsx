import Navbar from '../components/layout/Navbar';
import KPIStrip from '../components/dashboard/KPIStrip';
import StadiumMap from '../components/dashboard/StadiumMap';
import GateBoard from '../components/dashboard/GateBoard';
import GeminiChat from '../components/ai/GeminiChat';
import { useRealtimeCrowd } from '../hooks/useRealtimeCrowd';
import { useGateWaits } from '../hooks/useGateWaits';
import { useTickerUpdates } from '../hooks/useTickerUpdates';

export default function AttendeeView() {
  useRealtimeCrowd();
  useGateWaits();
  useTickerUpdates();

  return (
    <div className="min-h-screen flex flex-col w-full overflow-hidden bg-pureBlack text-textPrimary">
      <Navbar />
      
      <main className="flex-1 flex flex-col p-4 gap-4 md:gap-6 overflow-y-auto w-full max-w-7xl mx-auto">
        <KPIStrip />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full flex-1 min-h-0">
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <StadiumMap />
          </div>
          
          <div className="flex flex-col min-h-0 gap-4 md:gap-6">
            <GateBoard />
            <div className="hidden lg:block">
              <GeminiChat />
            </div>
          </div>
        </div>
      </main>
      
      {/* Mobile standalone chat (provides the FAB and full-screen modal) */}
      <div className="lg:hidden">
        <GeminiChat />
      </div>
      
      {/* Mobile Botton Nav */}
      <div className="md:hidden h-16 border-t border-borderSecondary bg-surface fixed bottom-0 left-0 w-full z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        <button onClick={() => window.scrollTo(0, 0)} className="text-[10px] text-accentCoral flex flex-col items-center outline-none">
           <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
           Home
        </button>
        <button onClick={() => alert("Tap the Map above!")} className="text-[10px] text-textSecondary hover:text-textPrimary flex flex-col items-center outline-none">
           <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
           Map
        </button>
        <button onClick={() => {document.querySelector('button[aria-label="Open AI Assistant"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}))}} className="text-[10px] text-textSecondary hover:text-textPrimary flex flex-col items-center outline-none">
           <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
           AI
        </button>
        <button onClick={() => alert("Ordering coming soon!")} className="text-[10px] text-textSecondary hover:text-textPrimary flex flex-col items-center outline-none">
           <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
           Order
        </button>
        <button onClick={() => alert("No Active Push Notifications.")} className="text-[10px] text-textSecondary hover:text-textPrimary flex flex-col items-center relative outline-none">
           <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
           Alerts
           <span className="absolute top-0 right-1 w-2 h-2 bg-accentCoral rounded-full"></span>
        </button>
      </div>
      
      {/* Spacer for mobile nav */}
      <div className="h-16 md:hidden w-full flex-shrink-0"></div>
    </div>
  );
}
