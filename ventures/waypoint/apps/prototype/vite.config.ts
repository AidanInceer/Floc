import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Throwaway prototype config. Uses the harness-assigned PORT when present,
// otherwise falls back to 5210. strictPort:false lets it hop if the port is busy.
const port = process.env.PORT ? Number(process.env.PORT) : 5210;

export default defineConfig({
  plugins: [react()],
  server: { port, host: true, strictPort: false },
  preview: { port, strictPort: false },
});
