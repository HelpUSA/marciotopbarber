// FILE: tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#111827", // cinza-900
        accent: "#EAB308",  // amarelo dourado
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "-apple-system"],
      },
    },
  },
  plugins: [],
};