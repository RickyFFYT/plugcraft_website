/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow local /assets images (including query strings like ?v=2)
    localPatterns: [
      // Allow all files in /assets (with or without query strings)
      { pathname: '/assets/**' },
    ],
  },
}

module.exports = nextConfig
