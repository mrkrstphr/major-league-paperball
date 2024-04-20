module.exports = {
  stories: ['../app/**/*.stories.js'],
  addons: ['@storybook/addon-essentials'],
  webpackFinal: (config) => {
    config.module.rules.push({
      test: /\.hbs$/,
      loader: 'handlebars-loader',
    });

    return config;
  },
};
