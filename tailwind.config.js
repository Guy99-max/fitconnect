// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#050505',
        card: '#1f1f1f',
        accentStart: '#9ee9ff',
        accentEnd: '#f3ddf3',
        grayText: '#aaaaaa',
      },
    },
  },
  plugins: [],
};
