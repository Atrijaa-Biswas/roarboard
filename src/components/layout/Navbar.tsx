import { Bell, Menu, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Ticker from './Ticker';
import { useUserStore } from '../../store/useUserStore';
import { logout } from '../../hooks/useAuth';

export default function Navbar() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  return (
    <header className="w-full relative z-40 bg-surface border-b border-borderSecondary">
      <Ticker />
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="md:hidden text-textSecondary hover:text-textPrimary p-1 -ml-1">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black italic tracking-tighter text-textPrimary uppercase">
            Roar<span className="text-accentCoral">Board</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-textSecondary hover:text-textPrimary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accentCoral rounded-md">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accentCoral rounded-full border border-surface"></span>
          </button>
          {user?.role === 'staff' ? (
            <button onClick={() => logout().then(() => navigate('/'))} className="p-2 text-textSecondary hover:text-accentWarning transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accentCoral rounded-md border border-borderSecondary hidden md:flex items-center gap-2">
              <span className="text-sm font-medium">Log out</span>
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="p-2 text-textSecondary hover:text-textPrimary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accentCoral rounded-md border border-borderSecondary hidden md:flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
