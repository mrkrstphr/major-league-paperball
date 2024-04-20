import type { StorybookConfig } from '@storybook/html-webpack5';

const config: StorybookConfig = {
  stories: ['../app/**/*.stories.js'],
  addons: [
    '@storybook/addon-webpack5-compiler-swc',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
  ],
  previewHead: (head) => `
    ${head}
    <script src="https://cdn.tailwindcss.com"></script>
  `,
  framework: {
    name: '@storybook/html-webpack5',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  webpackFinal: (config) => {
    // @ts-ignore
    config.module.rules.push({
      test: /\.hbs$/,
      loader: 'handlebars-loader',
      options: {
        helperDirs: [__dirname + '/../app/views/helpers'],
      },
    });

    return config;
  },
};
export default config;
