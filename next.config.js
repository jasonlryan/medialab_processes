/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removed custom webpack configuration for CSS
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
};

module.exports = nextConfig;
