import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* @ts-ignore */
  dev: {
    /* @ts-ignore */
    allowedDevOrigins: ['192.168.100.12', 'localhost:3000']
  }
};

export default nextConfig;
