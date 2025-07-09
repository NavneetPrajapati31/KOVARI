import type { Config } from "tailwindcss";
const { heroui } = require("@heroui/react");

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // CSS variable bindings for theming
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)", // Use in your root: --primary: #004831
        "primary-foreground": "var(--primary-foreground)",
        "primary-hover": "var(--primary-hover)",
        "primary-light": "var(--primary-light)",
        secondary: "var(--secondary)", // Use in your root: --secondary: #E7EBD0
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)", // --muted: #586F7C
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)", // --accent: #B8DDD9
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        border: "var(--border)", // --border: #F4F4F9
        input: "var(--input)",
        ring: "var(--ring)",

        // Optional raw HEX colors if you want direct access too
        brand: {
          primary: "#004831", // British Racing Green
          secondary: "#9BA186", // Sage
          accent: "#003527", // Coach Green
        },
      },

      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },

      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
        clash: ["Clash Display", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
        sans: ["Manrope", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), heroui()],
};

export default config;
