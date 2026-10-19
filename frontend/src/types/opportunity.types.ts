export interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: 'HACKATHON' | 'RESEARCH' | 'STARTUP' | 'COURSE_PROJECT' | 'OTHER';
  requiredSkills: string[];
  teamSize: number;
  contactPreference: 'in_app' | 'email';
  creatorAlias: string;
  creatorId?: string;
  isOwner?: boolean;
  status: 'OPEN' | 'FILLED' | 'CLOSED';
  createdAt: string;
}

export interface PartnerMessage {
  id: string;
  opportunityId: string;
  senderId: string;
  senderName: string;
  senderAlias: string;
  recipientId: string;
  message: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  participantName: string;
  lastMessage: string;
  updatedAt: string;
}
