/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F5F3EC',
        surface: '#FFFFFF',
        ink: '#1B231F',
        muted: '#7C8983',
        sidebar: '#1E2A24',
        sidebarSoft: '#2A3931',
        accent: '#D9A441',
        accentSoft: '#F3E3C2',
        critical: '#C0473B',
        criticalSoft: '#F6E1DE',
        moderate: '#C98A2E',
        moderateSoft: '#F5E7D0',
        success: '#3F8161',
        successSoft: '#DFEBE4',
        line: '#E7E3D8',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(27, 35, 31, 0.04), 0 8px 24px rgba(27, 35, 31, 0.05)',
      },
      borderRadius: {
        xl2: '18px',
      },
    },
  },
  plugins: [],
}
