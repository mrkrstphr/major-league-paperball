import { Schedule_Game } from '../types';

export type Cache = {
  schedule?: { date: string; games: Array<Schedule_Game> };
  gameEnded: any;
  team?: any;
};
