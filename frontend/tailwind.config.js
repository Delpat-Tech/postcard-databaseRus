/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ecefff',
          200: '#cfd8ff',
          500: '#6366f1',
          700: '#4f46e5'
        },
        accent: {
          50: '#fff8ed',
          500: '#f59e0b'
        },
        muted: {
          500: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Merriweather', 'ui-serif', 'Georgia']
      },
      container: {
        center: true,
        padding: '1rem'
      },
      borderRadius: {
        lg: '0.75rem'
      },
      boxShadow: {
        card: '0 6px 20px rgba(2,6,23,0.08)'
      }
    },
  },
  plugins: [],
};
