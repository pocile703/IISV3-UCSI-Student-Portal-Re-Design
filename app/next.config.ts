import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Cross-device dev access (phones on the LAN). Next.js 16 blocks cross-origin
  // HMR by default — an unlisted origin breaks the HMR WebSocket, so React never
  // hydrates and every client control (incl. the login form's onSubmit) is dead.
  // The LAN IP changes on DHCP reassignment; the mDNS hostname is stable, prefer it.
  // Access from the phone via http://Sews-MacBook-Air.local:3000 (IP fallback below).
  allowedDevOrigins: ['10.250.30.203', 'Sews-MacBook-Air.local', '*.local'],
};

export default nextConfig;
