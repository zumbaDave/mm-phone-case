/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // domains: ["utfs.io"]
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'utfs.io',
                pathname: '**',
            }
        ]
    }
};

export default nextConfig;
