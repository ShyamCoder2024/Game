const nextConfig = {
    async redirects() {
        return [
            {
                source: '/super-master/:path*',
                destination: '/supermaster/:path*',
                permanent: true,
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:3001/api/:path*',
            },
        ];
    },
};

export default nextConfig;
