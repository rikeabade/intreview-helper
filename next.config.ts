import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) quebra quando o webpack tenta empacotá-lo para
  // o runtime de servidor — deixamos o Node carregá-lo nativamente em runtime.
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
