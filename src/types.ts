export interface Player {
  id: string;
  name: string;
  email: string;
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  score1: number;
  score2: number;
  table: number;
  status: 'pending' | 'active' | 'paused' | 'completed';
  raceToScore: number;
}

export interface Tournament {
  id: string;
  name: string;
  matches: Match[];
}