export type Team = {
  id: number;
  name: string;
};

export type Schedule_Team = {
  id: number;
  name: string;
};

export type Schedule_Game_Team = {
  score: number;
  team: Schedule_Team;
};

export type Schedule_Game = {
  gamePk: number;
  gameDate: string;
  rescheduleDate?: string;
  status: {
    // TODO: enum here L,
    abstractGameCode: string;
    // TODO: enum here I,
    codedGameState: string;
  };
  teams: {
    away: Schedule_Game_Team;
    home: Schedule_Game_Team;
  };
};

export type Schedule = {
  dates: Array<{
    date: string;
    games: Array<Schedule_Game>;
  }>;
};

export type LiveGame_Data_Team = {
  id: number;
  abbreviation: string;
  name: string;
};

export type LiveGame_GameData = {
  id: number;
  datetime: {
    dateTime: string;
  };
  probablePitchers: {
    away: LiveGame_Player;
    home: LiveGame_Player;
  };
  status: {
    // TODO: enum here
    abstractGameCode: string;
  };
  teams: {
    away: LiveGame_Data_Team;
    home: LiveGame_Data_Team;
  };
  venue: {
    name: string;
  };
  weather: {
    condition: string;
    temp: string;
    wind: string;
  };
};

export type LiveGame_LiveData_LineScore_Team = {
  runs: number;
  hits: number;
  errors: number;
};

export type LiveGame_Player = {
  id: number;
  fullName: string;
  link: string;
};

export type LiveGame_LiveData_LineScore = {
  currentInning: number;
  currentInningOrdinal: string;
  // TODO: enum here
  inningState: string;
  isTopInning: boolean;
  scheduledInnings: number;
  innings: Array<{
    num: number;
    ordinalNum: string;
    home: {
      runs: number;
      hits: number;
      errors: number;
      leftOnBase: number;
    };
    away: {
      runs: number;
      hits: number;
      errors: number;
      leftOnBase: number;
    };
  }>;
  defense: {
    team: LiveGame_Data_Team;
    pitcher: LiveGame_Player;
  };
  offense: {
    team: LiveGame_Data_Team;
    batter: LiveGame_Player;
    first?: LiveGame_Player;
    second?: LiveGame_Player;
    third?: LiveGame_Player;
  };
  teams: {
    away: LiveGame_LiveData_LineScore_Team;
    home: LiveGame_LiveData_LineScore_Team;
  };
  balls: number;
  strikes: number;
  outs: number;
};

export type LiveGame_LiveData_BoxScore_Team_Player = {
  person: LiveGame_Player;
  stats: {
    batting: {
      summary: string;
    };
    pitching: {
      summary: string;
    };
  };
  seasonStats: {
    pitching: {
      era: string;
      wins: number;
      losses: number;
    };
  };
};

export type LiveGame_LiveData_BoxScore = {
  teams: {
    away: {
      players: Record<string, LiveGame_LiveData_BoxScore_Team_Player>;
    };
    home: {
      players: Record<string, LiveGame_LiveData_BoxScore_Team_Player>;
    };
  };
};

export type LiveGame_LiveData_Play = {
  about: {
    endTime: string;
    halfInning: 'bottom' | 'top';
    inning: number;
    isScoringPlay: boolean;
  };
  count: {};
  matchup: {};
  result: {
    event?: string;
    description: string;
    awayScore: number;
    homeScore: number;
  };
};

export type LiveGame_LiveData = {
  boxscore: LiveGame_LiveData_BoxScore;
  linescore: LiveGame_LiveData_LineScore;
  plays: {
    allPlays: Array<LiveGame_LiveData_Play>;
    currentPlay: LiveGame_LiveData_Play;
    scoringPlays: Array<number>;
  };
};

export type LiveGame = {
  gamePk: number;
  gameData: LiveGame_GameData;
  liveData: LiveGame_LiveData;
};

export type Standings_Team = {
  team: {
    id: number;
    name: string;
  };
  wins: number;
  losses: number;
  winningPercentage: number;
  gamesBack: number;
  streak: {
    streakCode: string;
  };
  records: {
    splitRecords: Array<{
      type: 'lastTen';
      wins: number;
      losses: number;
      pct: number;
    }>;
  };
};

export type Standings = {
  records: Array<{
    division: { id: number; link: string };
    teamRecords: Array<Standings_Team>;
  }>;
};
