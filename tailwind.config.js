/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#161616',
          50: '#f6f6f6',
          100: '#e9e9e9',
          200: '#d1d1d1',
          300: '#a8a8a8',
          400: '#7d7d7d',
          500: '#565656',
          600: '#3d3d3d',
          700: '#2c2c2c',
          800: '#212121',
          850: '#1b1b1b',
          900: '#161616',
          950: '#101010',
        },
        accent: {
          DEFAULT: '#e35d3f',
          50: '#fdf1ee',
          100: '#fbe1da',
          200: '#f6c0b1',
          300: '#f0987e',
          400: '#e97a58',
          500: '#e35d3f',
          600: '#cc4629',
          700: '#a83821',
          800: '#872f1e',
          900: '#6f291c',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(227,93,63,0.18), 0 8px 20px -8px rgba(227,93,63,0.4)',
        soft: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.5)',
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 1px 2px rgba(0,0,0,0.3), 0 12px 32px -16px rgba(0,0,0,0.55)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #e35d3f 0%, #ee7c52 100%)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
