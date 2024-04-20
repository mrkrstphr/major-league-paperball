import template from './matchup.hbs';

export default {
  title: 'Partials/Matchup',
  argTypes: {
    runners: {
      control: {
        type: 'array',
      },
    },
  },
  render: (args) => template(args),
};

export const Default = {
  args: {
    betweenInnings: false,
    matchup: {
      pitcher: {
        name: 'Huston Street',
        line: '2.6 IP, 2 H, 2 K',
      },
      batter: {
        name: 'Magglio Ordonez',
        line: '3-4, HR',
      },
    },
  },
};
