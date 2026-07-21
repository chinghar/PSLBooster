import { defineConfig } from "vite";

// Frontend source lives in frontend/ (index.html, app.js, etc.). Static
// passthrough assets (MediaPipe WASM + model file) live in
// frontend/public/ and are served/copied at the site root by Vite's
// convention. Build output goes to <repo root>/dist so both the local
// FastAPI backend and Vercel's default Vite output-directory expectation
// point at the same place.
export default defineConfig({
  root: "frontend",
  publicDir: "public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
