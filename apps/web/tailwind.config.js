/** @type {import("tailwindcss").Config} */
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#000080",
        steel: "#4682B4",
        lightseagreen: "#20B2AA",
        darkslate: "#2F4F4F",
        yellow: "#FFFF00",
        powder: "#B0E0E6"
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem"
      },
      boxShadow: {
        glass: "0 10px 30px rgba(0,0,0,0.1)"
      }
    }
  },
  plugins: [animate]
};