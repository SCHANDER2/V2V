// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is made conditional to prevent Windows NTFS file-locking race conditions
  // (ENOTEMPTY / ENOENT in .next/standalone during trace collection).
  ...(process.env.STANDALONE_BUILD === "true" ? { output: "standalone" } : {}),
  images: { unoptimized: true },
};

module.exports = withPWA(nextConfig);
