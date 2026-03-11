/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: false,
    },

    images: {
        remotePatterns: [
            { protocol: "https", hostname: "img.clerk.com" },
            { protocol: "https", hostname: "images.clerk.dev" },
        ],
    },

    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    // camera/mic blocked globally — project pages re-enable via Permissions-Policy if needed
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;