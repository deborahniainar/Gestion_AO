/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#536976',
          50: '#a3afb6'
        },
        secondary: {
          DEFAULT: '#ff7f32',
          50: '#FFDEC3'
        },
        accent: {
          DEFAULT: '#3c4453'
        },
        main : {
          DEFAULT: '#E6E6E6'
        },
        muted: {
          DEFAULT: '#D9D9D9',
          50: '#3033'
        },
        // Nouvelles variables de couleurs pour les actions et états
        success: {
          DEFAULT: '#10b981',
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857'
        },
        warning: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309'
        },
        danger: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c'
        },
        info: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        },
        // Couleurs pour les fichiers
        file: {
          pdf: '#ef4444',
          doc: '#3b82f6',
          image: '#10b981',
          default: '#6b7280'
        },
        // Nouvelles variables pour remplacer les grays
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827'
        },
        // Couleurs pour les surfaces et bordures
        surface: {
          light: '#ffffff',
          dark: '#1f2937',
          muted: '#f3f4f6',
          mutedDark: '#374151'
        },
        border: {
          light: '#e5e7eb',
          dark: '#4b5563'
        }
      },
      borderRadius: {
        'custom': '20px',
      },
      boxShadow: {
        'custom': '0 20px 40px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}