/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! PERINGATAN !!
    // Ini akan mengizinkan build produksi sukses meskipun
    // project kamu memiliki error TypeScript.
    // !! PERINGATAN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;