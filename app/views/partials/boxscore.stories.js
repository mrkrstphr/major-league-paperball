import template from './boxscore.hbs';

export default {
  title: 'Partials/Boxscore',
  render: (args) => template(args),
};

export const Default = {
  args: {
    currentInning: 4,
    boxscore: {
      innings: [
        { num: 1, home: { runs: 1 }, away: { runs: 0 } },
        { num: 2, home: { runs: 0 }, away: { runs: 0 } },
        { num: 3, home: { runs: 2 }, away: { runs: 4 } },
        { num: 4, home: { runs: 1 }, away: { runs: 0 } },
        { num: 5 },
        { num: 6 },
        { num: 7 },
        { num: 8 },
        { num: 9 },
      ],
      totals: {
        away: { runs: 4, hits: 7, errors: 1 },
        home: { runs: 4, hits: 9, errors: 0 },
      },
    },
    teams: {
      home: { abbreviation: 'DET' },
      away: { abbreviation: 'CLE' },
    },
  },
};
