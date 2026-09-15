import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          200: "#bccffd",
          300: "#8faefa",
          400: "#5c86f5",
          500: "#3660ee",
          600: "#2440e2",
          700: "#2032c8",
          800: "#212ba2",
          900: "#212a80",
        },
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        pop: "pop 180ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
