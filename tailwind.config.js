function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: withOpacity('--c-surface-900'),
          50: withOpacity('--c-surface-50'),
          100: withOpacity('--c-surface-100'),
          200: withOpacity('--c-surface-200'),
          300: withOpacity('--c-surface-300'),
          400: withOpacity('--c-surface-400'),
          500: withOpacity('--c-surface-500'),
          600: withOpacity('--c-surface-600'),
          700: withOpacity('--c-surface-700'),
          800: withOpacity('--c-surface-800'),
          850: withOpacity('--c-surface-850'),
          900: withOpacity('--c-surface-900'),
          950: withOpacity('--c-surface-950'),
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
