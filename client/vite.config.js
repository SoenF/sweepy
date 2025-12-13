import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL for Capacitor/Android to load assets from public folder
  preview: {
    host: "0.0.0.0",
    allowedHosts: ["homeflow-f54h.onrender.com"]
  }
});
