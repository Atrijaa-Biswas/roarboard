import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle } from '../hooks/useAuth';
import { useUserStore } from '../store/useUserStore';
import { ShieldAlert, LogIn, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [error, setError] = useState<string | null>(null);

  // If already logged in as staff, jump right to dashboard
  if (user && user.role === 'staff') {
    navigate('/staff');
    return null;
  }

  const handleLogin = async () => {
    try {
      setError(null);
      await loginWithGoogle();
      navigate('/staff');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    }
  };

  return (
    <div className="min-h-screen bg-pureBlack flex items-center justify-center p-4">
      <div className="bg-surface border border-borderSecondary rounded-xl w-full max-w-md p-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-borderSecondary rounded-full flex flex-col items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-accentCoral" />
        </div>
        
        <h1 className="text-2xl font-black italic tracking-tighter text-textPrimary uppercase mb-2">
          Staff <span className="text-accentCoral">Access</span>
        </h1>
        <p className="text-textSecondary text-center mb-8 text-sm">
          Strictly authorised personnel only. Staff action logs are monitored.
        </p>

        {error && (
          <div className="mb-6 w-full p-3 bg-accentCoral/10 border border-accentCoral rounded text-accentCoral text-sm text-center">
            {error}
          </div>
        )}

        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-accentCoral hover:bg-[#C2502A] text-pureBlack font-bold uppercase tracking-wider py-4 px-6 rounded-lg transition-transform focus:outline-none focus:ring-2 focus:ring-borderSecondary active:scale-[0.98]"
        >
          <LogIn className="w-5 h-5" />
          Continue with Google
        </button>

        <button 
          onClick={() => navigate('/')}
          className="mt-6 flex flex-col items-center gap-1 text-sm text-textSecondary hover:text-textPrimary transition-colors outline-none"
        >
          <span>Return to Public View</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
