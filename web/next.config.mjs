/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true, //@dev note this is to allow svg to display
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.autonomys.xyz',
        port: '',
        pathname: '/file/**',
      },
    ],
  },
};

export default nextConfig;
