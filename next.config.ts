import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Anexos da Base de Conhecimento aceitam arquivos de ate 20 MB.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
