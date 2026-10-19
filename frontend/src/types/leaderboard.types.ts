export interface LeaderboardEntry {
  id: string;
  rank: number;
  displayName: string;
  alias?: string;
  isAnonymous: boolean;
  cgpa: number;
  milestone: string; // e.g. "Sem 1-4", "Sem 1-6"
  department: string;
  batch: string;
  verified: boolean;
  isCurrentUser?: boolean;
}

export interface MyLeaderboardStatus {
  isOptedIn: boolean;
  isAnonymous: boolean;
  currentRank?: number;
  cgpa?: number;
  milestone?: string;
}
