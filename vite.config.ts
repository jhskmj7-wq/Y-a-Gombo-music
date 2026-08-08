import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const now = new Date();
const buildTimestamp = now.toISOString();
const buildDateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
const buildTimeStr = now.toISOString().slice(11, 16).replace(':', '');

let gitCommitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "";
if (!gitCommitSha) {
  try {
    gitCommitSha = execSync("git rev-parse HEAD").toString().trim();
  } catch (e) {
    gitCommitSha = "";
  }
}
const gitShortSha = gitCommitSha ? gitCommitSha.substring(0, 7) : "";
const randomHash = Math.random().toString(36).substring(2, 7).toUpperCase();

const BUILD_ID = gitShortSha
  ? `ELITE-${gitShortSha}-${buildDateStr}`
  : `ELITE-${buildDateStr}-${buildTimeStr}-${randomHash}`;

const versionPayload = {
  commitSha: gitCommitSha || "NO_GIT_SHA",
  commitShortSha: gitShortSha || "LOCAL",
  buildId: BUILD_ID,
  timestamp: buildTimestamp,
  version: '2.6.0-ELITE',
  env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
  isVercel: !!process.env.VERCEL
};

function versionJsonPlugin() {
  return {
    name: 'generate-version-json',
    buildStart() {
      try {
        const publicDir = path.resolve(__dirname, 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        fs.writeFileSync(
          path.resolve(publicDir, 'version.json'),
          JSON.stringify(versionPayload, null, 2)
        );
      } catch (e) {
        console.error('Error writing public/version.json:', e);
      }
    },
    writeBundle() {
      try {
        const distDir = path.resolve(__dirname, 'dist');
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }
        fs.writeFileSync(
          path.resolve(distDir, 'version.json'),
          JSON.stringify(versionPayload, null, 2)
        );
      } catch (e) {
        console.error('Error writing dist/version.json:', e);
      }
    }
  };
}

export default defineConfig({
  base: '/',
  build: { sourcemap: true },
  define: {
    '__AFRIGOMBO_BUILD_ID__': JSON.stringify(BUILD_ID),
    '__AFRIGOMBO_BUILD_TIME__': JSON.stringify(buildTimestamp),
    '__AFRIGOMBO_COMMIT_SHA__': JSON.stringify(gitCommitSha || "NO_GIT_SHA"),
    '__AFRIGOMBO_COMMIT_SHORT_SHA__': JSON.stringify(gitShortSha || "LOCAL"),
  },
  plugins: [
    react(), 
    tailwindcss(),
    versionJsonPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: "AFRIGOMBO ELITE",
        short_name: "AFRIGOMBO",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait",
        theme_color: "#050505",
        background_color: "#050505",
        icons: [
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,ico,png,svg,webmanifest}'],
        globIgnores: ['**/index.html', 'index.html', '**/version.json'],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'navigation-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  optimizeDeps: {
    include: [
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "firebase/storage",
      "firebase/analytics"
    ]
  }
});
