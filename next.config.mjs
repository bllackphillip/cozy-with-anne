import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Explicitly tells Turbopack: this folder IS the project root.
    // Without this, Turbopack walks UP the directory tree looking for a
    // monorepo workspace root. On machines where there are other projects
    // or files in parent folders, this can cause it to use the wrong
    // node_modules for CSS resolution. This pins it to this project.
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
