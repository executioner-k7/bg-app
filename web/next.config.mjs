/** @type {import('next').NextConfig} */

const nextConfig = {
  reactCompiler: true,
  allowedDevOrigins: [process.env.HOST_IP],
};

export default nextConfig;