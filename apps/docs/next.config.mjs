import createMDX from 'fumadocs-mdx/config';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  basePath: process.env.NODE_ENV === 'production' ? '/bolkauth' : '',
  images: { unoptimized: true },
  webpack(config, { dev, isServer }) {
    if (dev && isServer) {
      config.optimization ??= {};
      config.optimization.splitChunks = false;
    }

    return config;
  },
};

export default withMDX(config);
