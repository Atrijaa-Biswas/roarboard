import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pureBlack: '#020617', // slate-950
        surface: '#0f172a', // slate-900 
        surfaceGlass: 'rgba(15, 23, 42, 0.75)', 
        borderPrimary: '#1e293b', // slate-800
        borderSecondary: '#334155', // slate-700
        
        // Brand / Neon Accents
        accentBlue: '#3b82f6',     // Primary Route / Chat
        accentEmerald: '#10b981',  // Fastest Gate / Success
        accentRose: '#f43f5e',      // Alert / High Congestion
        accentWarning: '#f59e0b',  // Yellow Warning
        
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 30px rgba(59, 130, 246, 0.8)' },
        },
        routeDash: {
          to: { strokeDashoffset: '-20' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        ticker: 'ticker 20s linear infinite',
        pulseGlow: 'pulseGlow 2s infinite ease-in-out',
        routeDash: 'routeDash 1s linear infinite',
        slideUp: 'slideUp 0.3s ease-out forwards',
      }
    },
  },
  plugins: [],
};

export default config;
