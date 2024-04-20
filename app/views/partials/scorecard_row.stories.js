import template from './scorecard_row.hbs';

export default {
  title: 'Partials/Scorecard/Row',
  argTypes: {},
  render: (args) => template(args),
};

export const Default = {
  args: { team: { isUp: true, name: 'ATL', runs: 2, hits: 8, errorss: 1 } },
};
