/** tailwind.config.js
 *
 * Design tokens live here as the single source of truth for the
 * SDMS color palette, so every component references e.g. bg-navy
 * or text-security-blue instead of a raw hex value scattered
 * across files.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',        // primary dark surface (sidebar, navbar)
        'security-blue': '#2563EB', // primary action color
        slate: '#475569',       // secondary text / borders
        'app-bg': '#F8FAFC',    // light page background
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        'admin-accent': '#4C1D95', // purple, admin-only indicators

        // Landing/public-page palette. Kept separate from the tokens
        // above (navy, security-blue, etc.), which drive the
        // authenticated app's Sidebar/Navbar - changing those wasn't
        // asked for and would ripple into the dashboard chrome. This
        // set exists specifically to fix the landing page's contrast
        // issues: no pure black anywhere, and a deliberate
        // foreground/muted-foreground pair that both read clearly
        // against the #0B1120 background.
        'landing-bg': '#0B1120',
        'landing-card': 'rgba(255, 255, 255, 0.05)',
        'landing-border': 'rgba(255, 255, 255, 0.1)',
        'landing-text': '#F8FAFC',
        'landing-muted': '#94A3B8',
        'landing-success': '#22C55E',
        'landing-danger': '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 8px 20px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(6px, -6px)' },
        },
        checkPop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out',
        drift: 'drift 6s ease-in-out infinite',
        checkPop: 'checkPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
