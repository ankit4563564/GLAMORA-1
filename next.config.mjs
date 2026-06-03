/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "replicate.com" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["mongoose", "mongodb"],
  },
};

export default nextConfig;
