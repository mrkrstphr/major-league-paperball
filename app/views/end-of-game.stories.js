import template from './end-of-game.hbs';

export default {
  title: 'Views/End of Game',
  render: (args) => template(args),
};

export const Default = {
  args: {
    winningTeam: {
      name: 'Brownsville Reds',
    },
    boxscore: {
      innings: [
        { num: 1, home: { runs: 0 }, away: { runs: 0 } },
        { num: 2, home: { runs: 0 }, away: { runs: 0 } },
        { num: 3, home: { runs: 0 }, away: { runs: 0 } },
        { num: 4, home: { runs: 0 }, away: { runs: 0 } },
        { num: 5, home: { runs: 2 }, away: { runs: 0 } },
        { num: 6, home: { runs: 0 }, away: { runs: 0 } },
        { num: 7, home: { runs: 0 }, away: { runs: 0 } },
        { num: 8, home: { runs: 1 }, away: { runs: 0 } },
        { num: 9, home: { runs: 0 }, away: { runs: 0 } },
      ],
      totals: {
        away: { runs: 0, hits: 5, errors: 1 },
        home: { runs: 3, hits: 8, errors: 0 },
      },
    },
    teams: {
      home: { abbreviation: 'BRW' },
      away: { abbreviation: 'DLL' },
    },
    scheduledInnings: 9,
    totalInnings: 9,
    winnerScore: 3,
    loserScore: 0,
  },
};

export const ExtraInnings = {
  args: {
    winningTeam: {
      name: 'Great Lakes Loons',
    },
    boxscore: {
      innings: [
        { num: 4, home: { runs: 1 }, away: { runs: 0 } },
        { num: 5, home: { runs: 1 }, away: { runs: 0 } },
        { num: 6, home: { runs: 1 }, away: { runs: 0 } },
        { num: 7, home: { runs: 1 }, away: { runs: 0 } },
        { num: 8, home: { runs: 1 }, away: { runs: 0 } },
        { num: 9, home: { runs: 1 }, away: { runs: 1 } },
        { num: 10, home: { runs: 0 }, away: { runs: 0 } },
        { num: 11, home: { runs: 1 }, away: { runs: 1 } },
        { num: 12, home: { runs: 0 }, away: { runs: 3 } },
      ],
      totals: {
        away: { runs: 11, hits: 15, errors: 0 },
        home: { runs: 4, hits: 6, errors: 3 },
      },
    },
    teams: {
      home: { abbreviation: 'TOL' },
      away: { abbreviation: 'GTL' },
    },
    scheduledInnings: 9,
    totalInnings: 12,
    winnerScore: 11,
    loserScore: 4,
  },
};
