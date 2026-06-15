import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Single .env at repo root — shared by both Vite (frontend) and the server.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Remove broken local proxy settings that cause outbound OAuth requests
// (e.g. to oauth2.googleapis.com) to fail with ECONNREFUSED.
const stripBrokenProxySetting = (key) => {
  const value = process.env[key];
  if (!value) return;
  const lowered = String(value).toLowerCase();
  if (lowered.includes("127.0.0.1:9") || lowered.includes("localhost:9")) {
    delete process.env[key];
  }
};

["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]
  .forEach(stripBrokenProxySetting);
