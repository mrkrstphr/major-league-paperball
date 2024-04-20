import template from './scorecard.hbs';

export default {
  title: 'Partials/Scorecard',
  argTypes: {},
  render: (args) => template(args),
};

export const Default = {
  args: {
    lineScore: {
      home: { isUp: true, name: 'ATL', runs: 2, hits: 8, errors: 1 },
      away: { isUp: false, name: 'CIN', runs: 3, hits: 5, errors: 0 },
    },
  },
};
