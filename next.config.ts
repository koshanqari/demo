import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse dynamically imports pdfjs-dist's worker file at runtime; Turbopack
  // rewrites the relative path into its chunk graph and the worker .mjs can't be
  // found. Leaving these as external CommonJS deps fixes resolution.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
