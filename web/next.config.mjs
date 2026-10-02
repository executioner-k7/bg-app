/** @type {import('next').NextConfig} */

const nextConfig = {
  reactCompiler: true,
  allowedDevOrigins: [process.env.HOST_IP, '127.0.0.1'],
};

export default nextConfig;