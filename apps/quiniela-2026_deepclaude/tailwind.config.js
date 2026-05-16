/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00f0ff',
          foreground: '#000000',
        },
        accent: {
          DEFAULT: '#ff00cc',
          foreground: '#000000',
        },
        dark: '#0a0a1f',
        'dark-light': '#12122b',
        border: 'rgba(0, 240, 255, 0.2)',
        ring: '#00f0ff',
        background: '#0a0a1f',
        foreground: '#ffffff',
        muted: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          foreground: 'rgba(255, 255, 255, 0.4)',
        },
        card: {
          DEFAULT: 'rgba(18, 18, 43, 0.85)',
          foreground: '#ffffff',
        },
        success: '#34d399',
        warning: '#fbbf24',
        danger: '#f87171',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 20px #00f0ff, 0 10px 30px -10px rgb(0 240 255 / 0.3)',
        'neon-lg': '0 0 35px #00f0ff, 0 0 15px #ff00cc, 0 10px 40px -10px rgb(0 240 255 / 0.4)',
        'neon-accent': '0 0 20px #ff00cc, 0 10px 30px -10px rgb(255 0 204 / 0.3)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'slide-in': 'slideInUp 0.4s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scan-line': 'scanLine 2s linear infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'slideInUp': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fadeIn': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scanLine': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
