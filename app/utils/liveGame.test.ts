import { describe, expect, it } from 'vitest';
import { LiveGame, LiveGame_LiveData_LineScore } from '../types';
import { boxscore, isGameOver } from './liveGame';

describe('boxscore', () => {
  it('should limit the returned innings to a max of 9 for extra innings games', () => {
    const linescore = {
      currentInning: 13,
      currentInningOrdinal: '13th',
      innings: [
        { num: 1, home: { runs: 0 }, away: { runs: 0 } },
        { num: 2, home: { runs: 0 }, away: { runs: 1 } },
        { num: 3, home: { runs: 0 }, away: { runs: 0 } },
        { num: 4, home: { runs: 2 }, away: { runs: 0 } },
        { num: 5, home: { runs: 0 }, away: { runs: 1 } },
        { num: 6, home: { runs: 1 }, away: { runs: 0 } },
        { num: 7, home: { runs: 0 }, away: { runs: 0 } },
        { num: 8, home: { runs: 0 }, away: { runs: 2 } },
        { num: 9, home: { runs: 1 }, away: { runs: 0 } },
        { num: 10, home: { runs: 0 }, away: { runs: 0 } },
        { num: 11, home: { runs: 0 }, away: { runs: 0 } },
        { num: 12, home: { runs: 0 }, away: { runs: 0 } },
        { num: 13, home: { runs: 0 }, away: { runs: 1 } },
      ],
      inningState: 'Top',
      isTopInning: true,
      scheduledInnings: 9,
    } as unknown as LiveGame_LiveData_LineScore;

    const data = boxscore({
      liveData: {
        linescore,
      },
    } as LiveGame);

    expect(data.innings).toHaveLength(linescore.scheduledInnings);
    expect(data.innings.map(({ num }) => num)).toEqual([
      5, 6, 7, 8, 9, 10, 11, 12, 13,
    ]);
    expect(data.innings.map(({ home }) => home.runs)).toEqual([
      0, 1, 0, 0, 1, 0, 0, 0, 0,
    ]);
    expect(data.innings.map(({ away }) => away.runs)).toEqual([
      1, 0, 0, 2, 0, 0, 0, 0, 1,
    ]);
  });

  it('should pad the innings with empty innings for games with innings remaining', () => {
    const linescore = {
      currentInning: 5,
      currentInningOrdinal: '5th',
      innings: [
        { num: 1, home: { runs: 0 }, away: { runs: 0 } },
        { num: 2, home: { runs: 0 }, away: { runs: 1 } },
        { num: 3, home: { runs: 0 }, away: { runs: 0 } },
        { num: 4, home: { runs: 2 }, away: { runs: 0 } },
        { num: 5, home: { runs: 0 }, away: { runs: 1 } },
      ],
      inningState: 'Bottom',
      isTopInning: false,
      scheduledInnings: 9,
    } as unknown as LiveGame_LiveData_LineScore;

    const data = boxscore({
      liveData: {
        linescore,
      },
    } as LiveGame);

    expect(data.innings).toHaveLength(linescore.scheduledInnings);
    expect(data.innings.map(({ num }) => num)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });
});

describe('isGameOver', () => {
  it('should return true if the game is final', () => {
    const game = {
      gameData: {
        status: {
          abstractGameCode: 'F',
        },
      },
    } as LiveGame;

    expect(isGameOver(game)).toBe(true);
  });

  it('should return true if the game has 3 outs in the top of the 9th, and the home team is winning', () => {
    const game = {
      gameData: {
        status: {
          abstractGameCode: 'L',
        },
      },
      liveData: {
        linescore: {
          currentInning: 9,
          scheduledInnings: 9,
          outs: 3,
          isTopInning: true,
          teams: {
            home: { runs: 5 },
            away: { runs: 3 },
          },
        },
      },
    } as LiveGame;

    expect(isGameOver(game)).toBe(true);
  });

  it('should return false if the game has 3 outs in the top of the 9th, and the game is tied', () => {
    const game = {
      gameData: {
        status: {
          abstractGameCode: 'L',
        },
      },
      liveData: {
        linescore: {
          currentInning: 9,
          scheduledInnings: 9,
          outs: 3,
          isTopInning: true,
          teams: {
            home: { runs: 5 },
            away: { runs: 5 },
          },
        },
      },
    } as LiveGame;

    expect(isGameOver(game)).toBe(false);
  });

  it('should return false if the game has 3 outs in the top of the 9th, and the away team is winning', () => {
    const game = {
      gameData: {
        status: {
          abstractGameCode: 'L',
        },
      },
      liveData: {
        linescore: {
          currentInning: 9,
          scheduledInnings: 9,
          outs: 3,
          isTopInning: true,
          teams: {
            home: { runs: 3 },
            away: { runs: 5 },
          },
        },
      },
    } as LiveGame;

    expect(isGameOver(game)).toBe(false);
  });

  it('should return true if the game is in the bottom of the 9th, and the home team is winning', () => {
    const game = {
      gameData: {
        status: {
          abstractGameCode: 'L',
        },
      },
      liveData: {
        linescore: {
          currentInning: 9,
          scheduledInnings: 9,
          outs: 0,
          isTopInning: false,
          teams: {
            home: { runs: 5 },
            away: { runs: 3 },
          },
        },
      },
    } as LiveGame;

    expect(isGameOver(game)).toBe(true);
  });

  it('should return true if the game is over after extra innings', () => {
    const game = {
      gameData: {
        status: {
          abstractGameCode: 'S',
        },
      },
      liveData: {
        linescore: {
          currentInning: 10,
          scheduledInnings: 9,
          outs: 3,
          isTopInning: true,
          teams: {
            home: { runs: 5 },
            away: { runs: 3 },
          },
        },
      },
    } as LiveGame;

    expect(isGameOver(game)).toBe(true);
  });

  it('should return false for any inning < scheduledInnings', () => {
    const game = {
      gameData: {
        status: {
          abstractGameCode: 'S',
        },
      },
      liveData: {
        linescore: {
          currentInning: 8,
          scheduledInnings: 9,
          outs: 2,
          isTopInning: false,
          teams: {
            home: { runs: 5 },
            away: { runs: 3 },
          },
        },
      },
    } as LiveGame;

    expect(isGameOver(game)).toBe(false);
  });
});
