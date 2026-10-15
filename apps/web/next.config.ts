import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Le paquet partagé est écrit en TypeScript : Next doit le compiler lui-même.
  transpilePackages: ["@pstb/shared"],
  images: {
    // Domaines autorisés pour les images (Supabase Storage).
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
