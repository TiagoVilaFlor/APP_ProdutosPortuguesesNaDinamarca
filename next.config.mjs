/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // 🔥 STATIC EXPORT
  images: {
    unoptimized: true, // required for static export
  },
};

module.exports = nextConfig;