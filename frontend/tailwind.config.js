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
          50: '#f7931e'
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