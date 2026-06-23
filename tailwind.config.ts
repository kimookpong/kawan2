import type { Config } from "tailwindcss";

/**
 * Design tokens นำมาจาก design/kawan3_community_system/DESIGN.md
 * สไตล์: Modern Corporate with Cultural Infusion
 * Deep Green (primary) + Terracotta (tertiary/accent)
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f9f9f9",
        "surface-dim": "#dadada",
        "surface-bright": "#f9f9f9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f4",
        "surface-container": "#eeeeee",
        "surface-container-high": "#e8e8e8",
        "surface-container-highest": "#e2e2e2",
        "surface-variant": "#e2e2e2",
        "on-surface": "#1a1c1c",
        "on-surface-variant": "#404944",
        "inverse-surface": "#2f3131",
        "inverse-on-surface": "#f0f1f1",
        outline: "#707974",
        "outline-variant": "#bfc9c3",
        "surface-tint": "#2b6954",
        primary: "#003527",
        "on-primary": "#ffffff",
        "primary-container": "#064e3b",
        "on-primary-container": "#80bea6",
        "inverse-primary": "#95d3ba",
        secondary: "#5c5f60",
        "on-secondary": "#ffffff",
        "secondary-container": "#dee0e2",
        "on-secondary-container": "#606365",
        tertiary: "#502000",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#733100",
        "on-tertiary-container": "#ff985a",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        background: "#f9f9f9",
        "on-background": "#1a1c1c",
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', "Sarabun", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "0.125rem",
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      maxWidth: {
        container: "1280px",
      },
      boxShadow: {
        card: "0px 4px 6px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
