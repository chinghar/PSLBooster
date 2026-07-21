// Copies the MediaPipe WASM runtime out of node_modules into
// frontend/public/vendor/mediapipe/wasm so Vite serves/bundles it as a
// static passthrough asset. Runs automatically before `vite`/`vite build`
// via the "predev"/"prebuild" npm script hooks — never committed to git,
// since it's fully regenerated from the installed npm package.
import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "node_modules/@mediapipe/tasks-vision/wasm");
const dest = resolve(root, "frontend/public/vendor/mediapipe/wasm");

if (!existsSync(src)) {
  console.error("node_modules/@mediapipe/tasks-vision not found — run `npm install` first.");
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied MediaPipe WASM runtime -> ${dest}`);
