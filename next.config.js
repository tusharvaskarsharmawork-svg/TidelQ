/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // We explicitly allow serving static HTML files from public/ 
  // without interfering with the Next.js router.
  images: {
    unoptimized: true,
  },
  // Ensure we can deploy to Render (Web Service)
}

module.exports = nextConfig
