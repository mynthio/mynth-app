/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        ["dark-green"]: "hsl(var(--dark-green))",
      },
      borderRadius: {
        window: "var(--window-radius)",
      },
    },
  },
  plugins: [],
};
