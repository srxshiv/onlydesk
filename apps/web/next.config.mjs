/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tool UI + kit packages ship raw TSX source; Next transpiles them in-app so
  // they share this app's React/react-query/framer-motion instances.
  transpilePackages: ['@onlydesk/api-client', '@onlydesk/shared-types', '@onlydesk/tools-sdk', '@onlydesk/tool-ui-kit', '@onlydesk/tool-resume-editor', '@onlydesk/tool-smart-todo'],
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig
