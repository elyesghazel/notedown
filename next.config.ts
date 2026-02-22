import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    webpack: (config, { dev }) => {
        if (dev) {
            config.watchOptions = {
                ...config.watchOptions,
                ignored: ['**/.data/**', '**/node_modules/**']
            };
        }
        return config;
    },
    turbopack: {}, // Silences the Webpack + Turbopack missing config error
};

export default nextConfig;
