import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pureBlack: '#0a0a0a',
        surface: '#161b22',
        borderPrimary: '#1a1a1a',
        borderSecondary: '#30363d',
        accentCoral: '#D85A30',
        accentSuccess: '#1D9E75',
        accentWarning: '#EF9F27',
        textPrimary: '#e6edf3',
        textSecondary: '#8b949e',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        ticker: 'ticker 20s linear infinite',
      }
    },
  },
  plugins: [],
};

export default config;
