import { useRef, useEffect } from 'react';
import { Bell, Menu, User, Trophy, X, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Ticker from './Ticker';
import { useUserStore } from '../../store/useUserStore';
import { logout } from '../../hooks/useAuth';
import { useVenueStore } from '../../store/useVenueStore';
import { useAlertStore } from '../../store/useAlertStore';

export default function Navbar() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const userPrefs = useVenueStore((state) => state.userPrefs);

  const alerts = useAlertStore((state) => state.alerts);
  const isNotifPanelOpen = useAlertStore((state) => state.isNotifPanelOpen);
  const toggleNotifPanel = useAlertStore((state) => state.toggleNotifPanel);
  const markAllRead = useAlertStore((state) => state.markAllRead);
  const markRead = useAlertStore((state) => state.markRead);
  const resolveAlert = useAlertStore((state) => state.resolveAlert);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        useAlertStore.getState().setNotifPanelOpen(false);
      }
    };
    if (isNotifPanelOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isNotifPanelOpen]);

  const severityColor = (s: string) =>
    s === 'critical' ? 'border-l-accentRose bg-accentRose/5' :
    s === 'warning'  ? 'border-l-accentWarning bg-accentWarning/5' :
                       'border-l-accentBlue bg-accentBlue/5';

  const severityBadge = (s: string) =>
    s === 'critical' ? 'bg-accentRose/20 text-accentRose' :
    s === 'warning'  ? 'bg-accentWarning/20 text-accentWarning' :
                       'bg-accentBlue/20 text-accentBlue';

  return (
    <header className="w-full relative z-40 flex flex-col items-center gap-2 pointer-events-none">
      <div className="w-full max-w-7xl mx-auto flex justify-center pointer-events-auto">
        {/* Floating Capsule Anchor */}
        <div className="glass-panel w-full sm:w-auto min-w-[300px] h-14 px-5 rounded-full flex items-center justify-between gap-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] border-t border-white/5">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-textSecondary hover:text-textPrimary p-1 -ml-2 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black italic tracking-tighter text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              Roar<span className="text-accentBlue">Board</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Points Counter */}
            {user?.role !== 'staff' && (
              <div
                className="flex items-center gap-1.5 px-3 py-1 bg-accentBlue/10 text-accentBlue border border-accentBlue/20 rounded-full text-xs font-bold shadow-inner cursor-help transition-all"
                title="Points earned by following optimal routing paths!"
              >
                <Trophy className="w-3 h-3 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" />
                {userPrefs?.points ?? 0}
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={toggleNotifPanel}
                className="relative text-textSecondary hover:text-white transition-colors outline-none"
                aria-label="Open notifications"
              >
                <Bell className={`w-5 h-5 ${isNotifPanelOpen ? 'text-accentBlue' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-accentRose rounded-full border border-pureBlack text-[9px] font-black text-white flex items-center justify-center px-0.5 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {isNotifPanelOpen && (
                <div className="absolute right-0 top-10 w-80 sm:w-96 glass-panel rounded-2xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] z-[200] animate-slideUp">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-accentBlue" />
                      <span className="font-bold text-sm text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-accentRose/20 text-accentRose text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] text-textSecondary hover:text-accentBlue flex items-center gap-1 transition-colors"
                        >
                          <CheckCheck className="w-3 h-3" />
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => useAlertStore.getState().setNotifPanelOpen(false)}
                        className="text-textSecondary hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Alert List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                    {alerts.length === 0 ? (
                      <div className="px-4 py-8 text-center text-textSecondary text-sm">
                        No notifications
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div
                          key={alert.id}
                          onClick={() => markRead(alert.id)}
                          className={`px-4 py-3 cursor-pointer transition-all border-l-2 ${severityColor(alert.severity)} ${!alert.isRead ? 'opacity-100' : 'opacity-50'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${severityBadge(alert.severity)}`}>
                                  {alert.severity}
                                </span>
                                {!alert.isRead && <span className="w-1.5 h-1.5 rounded-full bg-accentBlue flex-shrink-0"></span>}
                              </div>
                              <p className="text-xs font-bold text-textPrimary leading-snug">{alert.title}</p>
                              <p className="text-[11px] text-textSecondary mt-0.5 leading-relaxed">{alert.body}</p>
                              <p className="text-[10px] text-textSecondary/60 mt-1">
                                {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); resolveAlert(alert.id); }}
                              className="text-textSecondary hover:text-accentRose transition-colors flex-shrink-0 mt-0.5"
                              title="Dismiss"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {user?.role === 'staff' ? (
              <button onClick={() => logout().then(() => navigate('/'))} className="text-textSecondary hover:text-accentRose transition-colors outline-none hidden md:flex items-center gap-2">
                <span className="text-sm font-bold">Log out</span>
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="bg-surface border border-borderSecondary px-3 py-1.5 rounded-full text-textSecondary hover:text-white hover:border-textSecondary transition-all outline-none hidden md:flex items-center gap-1.5 shadow-sm">
                <User className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Log In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Integrated Ticker */}
      <div className="w-full max-w-2xl mx-auto pointer-events-auto">
        <Ticker />
      </div>
    </header>
  );
}
