/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS domains
      },
      {
        protocol: 'http',
        hostname: '**', // Allow all HTTP domains (use cautiously)
      }
    ],
    // Alternative: Specify specific domains if you know them
    // domains: [
    //   'serpapi.com',
    //   'www.google.com',
    //   'encrypted-tbn0.gstatic.com',
    //   // Add other domains as needed
    // ],
  },
};

export default nextConfig;