import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle } from '../hooks/useAuth';
import { useUserStore } from '../store/useUserStore';
import { Shield, LogIn, ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in as staff, jump right to dashboard
  if (user && user.role === 'staff') {
    navigate('/staff');
    return null;
  }

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      navigate('/staff');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pureBlack flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accentBlue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accentEmerald/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="glass-panel rounded-3xl w-full max-w-sm p-8 flex flex-col items-center relative z-10 animate-slideUp">
        {/* Icon badge */}
        <div className="w-16 h-16 bg-accentBlue/10 border border-accentBlue/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
          <Shield className="w-8 h-8 text-accentBlue" />
        </div>

        <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase mb-1">
          Staff <span className="text-accentBlue">Access</span>
        </h1>
        <p className="text-textSecondary text-center mb-8 text-sm leading-relaxed">
          Strictly authorised personnel only.<br />All actions are monitored and logged.
        </p>

        {error && (
          <div className="mb-6 w-full p-3 bg-accentRose/10 border border-accentRose/40 rounded-xl text-accentRose text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-accentBlue hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider py-4 px-6 rounded-2xl transition-all focus:outline-none active:scale-[0.98] shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
        >
          <LogIn className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Authenticating...' : 'Continue with Google'}
        </button>

        <button
          onClick={() => navigate('/')}
          className="mt-5 flex items-center gap-2 text-sm text-textSecondary hover:text-white transition-colors outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Public View
        </button>
      </div>
    </div>
  );
}
