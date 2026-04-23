import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.31.153", "172.24.245.200", "192.168.0.12", "172.26.208.1", "172.26.1.182"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://k14f205.p.ssafy.io/api/:path*",
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:8080/api/auth/:path*",
      },
    ];
  },
};

export default nextConfig;