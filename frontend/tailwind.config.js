/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        hud: ['Trebuchet MS', 'Segoe UI', 'Tahoma', 'sans-serif'],
        mono: ['Courier New', 'Lucida Console', 'monospace'],
      },
    },
  },
  plugins: [],
};
