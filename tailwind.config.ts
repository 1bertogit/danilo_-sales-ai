import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gem: {
          blue: '#1d4ed8', // blue-700
          teal: '#0f766e', // teal-700
          onyx: '#111827', // gray-900 (Background)
          slate: '#1f2937', // gray-800 (Cards)
          mist: '#374151', // gray-700 (Borders)
          offwhite: '#f9fafb', // gray-50 (Text)
        }
      },
      animation: {
        'progress-stripes': 'progress-stripes 1s linear infinite',
        fadeIn: 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        'progress-stripes': {
          '0%': { backgroundPosition: '1rem 0' },
          '100%': { backgroundPosition: '0 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;