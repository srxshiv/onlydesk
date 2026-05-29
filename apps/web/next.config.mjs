/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@onlydesk/api-client', '@onlydesk/shared-types', '@onlydesk/tool-resume-editor', '@onlydesk/tools-sdk'],
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig
