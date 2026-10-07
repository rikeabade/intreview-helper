import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) breaks when webpack tries to bundle it for the
  // server runtime, so we let Node load it natively at runtime.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "undici"],
  // Defense in depth: markdown built from untrusted web content must not be able
  // to make the browser fetch remote images (beacon/exfiltration channel).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "img-src 'self' data:" },
        ],
      },
    ];
  },
};

export default nextConfig;
