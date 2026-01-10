import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@app': path.resolve(__dirname, '../src/app'),
          '@pages': path.resolve(__dirname, '../src/pages'),
          '@widgets': path.resolve(__dirname, '../src/widgets'),
          '@features': path.resolve(__dirname, '../src/features'),
          '@entities': path.resolve(__dirname, '../src/entities'),
          '@shared': path.resolve(__dirname, '../src/shared'),
        },
      },
    });
  },
};

export default config;
