export type GameMode = 'classic' | 'time';

export interface BlockData {
  id: string;
  value: number;
  row: number;
  col: number;
  isSelected: boolean;
  color: string;
}

export interface GameState {
  grid: BlockData[];
  score: number;
  target: number;
  mode: GameMode;
  isGameOver: boolean;
  timeLeft: number;
  selectedIds: string[];
}
