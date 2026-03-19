/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Barlow Condensed"', '"Arial Narrow"', 'Arial', 'sans-serif'],
        body:    ['"Barlow"', 'Arial', 'sans-serif'],
        mono:    ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        acid: '#d4f53c',
        ink:  '#0a0a0a',
        paper:'#f5f2eb',
        red:  '#e63022',
      },
    },
  },
  plugins: [],
};
