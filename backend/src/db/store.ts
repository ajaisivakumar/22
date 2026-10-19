// ─────────────────────────────────────────────────────────────────────────────
// In-memory store — used until full Prisma migration is complete.
// All arrays start EMPTY — no dummy/seeded data.
// ─────────────────────────────────────────────────────────────────────────────

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN' | 'MODERATOR';
  avatarUrl?: string;
  department?: string;
  batch?: string;
  isEmailVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
}

export interface PollRecord {
  id: string;
  question: string;
  description?: string;
  options: { id: string; text: string; voteCount: number }[];
  totalVotes: number;
  userVotes?: Record<string, string>; // userId -> optionId
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  createdBy?: string;
  expiresAt: string;
  createdAt: string;
}

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  category: 'TECHNICAL' | 'CULTURAL' | 'SPORTS' | 'WORKSHOP' | 'SEMINAR' | 'HACKATHON';
  eventDate: string;
  venue: string;
  registrationLink?: string;
  brochureUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'CANCELLED';
  organizerName?: string;
  moderatorNotes?: string;
  createdBy?: string;
  createdAt: string;
}

export interface OpportunityRecord {
  id: string;
  title: string;
  description: string;
  category: 'HACKATHON' | 'RESEARCH' | 'STARTUP' | 'COURSE_PROJECT' | 'OTHER';
  requiredSkills: string[];
  teamSize: number;
  contactPreference: 'in_app' | 'email';
  creatorAlias: string;
  creatorId?: string;
  status: 'OPEN' | 'FILLED' | 'CLOSED';
  createdAt: string;
}

export interface MessageRecord {
  id: string;
  opportunityId: string;
  senderId: string;
  senderName: string;
  senderAlias: string;
  recipientId: string;
  message: string;
  createdAt: string;
}

export interface LostFoundRecord {
  id: string;
  title: string;
  type: 'LOST' | 'FOUND';
  category: string;
  location: string;
  date: string;
  description: string;
  imageUrl?: string;
  contactInfo?: string;
  isSensitive: boolean;
  status: 'OPEN' | 'CLAIMED' | 'RETURNED' | 'RESOLVED' | 'HIDDEN';
  createdAt: string;
}

export interface ComplaintRecord {
  id: string;
  referenceId: string;
  floor: string;
  lab: string;
  systemNumber: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface SavedCGPARecord {
  id: string;
  userId: string;
  semesterNumber: number;
  gpa: number;
  totalCredits: number;
  courses: any[];
  createdAt: string;
}

export interface LeaderboardRecord {
  id: string;
  userId?: string;
  rank: number;
  displayName: string;
  alias?: string;
  isAnonymous: boolean;
  cgpa: number;
  milestone: string;
  department: string;
  batch: string;
  verified: boolean;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: 'POLL' | 'EVENT' | 'PARTNER' | 'LOSTFOUND' | 'COMPLAINT' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  actorEmail: string;
  actorRole: string;
  targetType: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

class Store {
  // All collections start EMPTY — no hardcoded sample data
  users: UserRecord[] = [];
  polls: PollRecord[] = [];
  events: EventRecord[] = [];
  opportunities: OpportunityRecord[] = [];
  messages: MessageRecord[] = [];
  lostFound: LostFoundRecord[] = [];
  complaints: ComplaintRecord[] = [];
  savedCgpa: SavedCGPARecord[] = [];
  leaderboard: LeaderboardRecord[] = [];
  notifications: NotificationRecord[] = [];
  auditLogs: AuditLogRecord[] = [];
}

export const db = new Store();
