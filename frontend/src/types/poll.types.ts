export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface Poll {
  id: string;
  question: string;
  description?: string;
  options: PollOption[];
  totalVotes: number;
  userVoteId?: string;
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  expiresAt: string;
  createdAt: string;
  createdBy?: string | {
    id: string;
    name: string;
  };
}

export interface VotePayload {
  pollId: string;
  optionId: string;
}
