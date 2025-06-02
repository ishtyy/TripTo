// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sky: {
          400: "#60A5FA",
          700: "#1E40AF"
        },
        ocean: "#0EA5E9",
        sunset: "#FBBF24"
      },
      fontFamily: {
        heading: ["Playfair Display", "serif"],
        body: ["Poppins", "sans-serif"]
      }
    }
  },
  plugins: []
};
