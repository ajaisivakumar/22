import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN' | 'MODERATOR';
  avatarUrl?: string;
  department?: string;
  batch?: string;
  googleId?: string;
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
  userVotes?: Record<string, string>;
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
  createdBy?: string;
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
  courses: unknown[];
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

export interface PasswordResetRecord {
  token: string;
  userId: string;
  expiresAt: string;
}

class Store {
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
  passwordResets: PasswordResetRecord[] = [];
}

export const db = new Store();

const DATA_FILE = path.resolve(process.cwd(), 'data', 'store.json');

export function persist(): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[store] Failed to persist data:', err);
  }
}

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

async function seedFreshData(): Promise<void> {
  const adminPassword = await bcrypt.hash(env.ADMIN_INITIAL_PASSWORD, 12);
  const studentPassword = await bcrypt.hash('student123', 12);

  const admin: UserRecord = {
    id: 'admin-bootstrap',
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL.toLowerCase(),
    password: adminPassword,
    role: 'ADMIN',
    department: 'Administration',
    isEmailVerified: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  const student: UserRecord = {
    id: 'student-demo',
    name: 'Alex Johnson',
    email: 'student@example.com',
    password: studentPassword,
    role: 'STUDENT',
    department: 'Computer Science',
    batch: '2023-2027',
    isEmailVerified: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  db.users = [admin, student];

  db.polls = [
    {
      id: 'poll-welcome',
      question: 'Which campus improvement should we prioritize this semester?',
      description: 'Help student council pick the next infrastructure upgrade.',
      options: [
        { id: 'opt-1', text: 'Extended library hours during exams', voteCount: 18 },
        { id: 'opt-2', text: 'More high-speed Wi-Fi in hostels', voteCount: 24 },
        { id: 'opt-3', text: 'New systems in computer labs', voteCount: 11 },
        { id: 'opt-4', text: 'Better cafeteria seating', voteCount: 7 },
      ],
      totalVotes: 60,
      userVotes: {},
      status: 'ACTIVE',
      createdBy: admin.id,
      expiresAt: isoDaysFromNow(12),
      createdAt: isoDaysAgo(2),
    },
    {
      id: 'poll-hackathon',
      question: 'Preferred format for the next intra-college hackathon?',
      description: 'The coding club is locking the event format this week.',
      options: [
        { id: 'opt-h1', text: '24-hour on-campus sprint', voteCount: 14 },
        { id: 'opt-h2', text: '48-hour hybrid (online + campus)', voteCount: 9 },
        { id: 'opt-h3', text: 'Weekend 12-hour challenge', voteCount: 16 },
      ],
      totalVotes: 39,
      userVotes: {},
      status: 'ACTIVE',
      createdBy: admin.id,
      expiresAt: isoDaysFromNow(6),
      createdAt: isoDaysAgo(1),
    },
  ];

  db.events = [
    {
      id: 'evt-symposium',
      title: 'Dept. Technical Symposium — Innovate 2026',
      description:
        'Paper presentations, project expo, and a late-night coding contest. Open to all departments. Brochure and registration are live.',
      category: 'TECHNICAL',
      eventDate: isoDaysFromNow(18),
      venue: 'Main Auditorium',
      registrationLink: 'https://example.com/innovate-2026',
      brochureUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      status: 'PUBLISHED',
      organizerName: 'CSE Association',
      createdBy: admin.id,
      createdAt: isoDaysAgo(4),
    },
    {
      id: 'evt-workshop',
      title: 'Hands-on Workshop: Full-Stack with React & Node',
      description:
        'Build and deploy a campus app in one day. Laptops required. Limited to 60 seats.',
      category: 'WORKSHOP',
      eventDate: isoDaysFromNow(9),
      venue: 'Siemens Lab',
      registrationLink: 'https://example.com/fullstack-workshop',
      brochureUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      status: 'PUBLISHED',
      organizerName: 'Developer Student Club',
      createdBy: admin.id,
      createdAt: isoDaysAgo(3),
    },
  ];

  db.opportunities = [
    {
      id: 'opp-sih',
      title: 'Smart India Hackathon — looking for a backend + ML teammate',
      description:
        'We have a problem statement around flood mapping from satellite imagery. Need someone comfortable with Python APIs and model serving.',
      category: 'HACKATHON',
      requiredSkills: ['Python', 'FastAPI', 'PyTorch', 'Docker'],
      teamSize: 4,
      contactPreference: 'in_app',
      creatorAlias: 'Builder#402',
      creatorId: admin.id,
      status: 'OPEN',
      createdAt: isoDaysAgo(1),
    },
    {
      id: 'opp-capstone',
      title: 'Final-year capstone: campus navigation PWA',
      description:
        'Building an accessible indoor map for visitors. Looking for a designer and a React developer.',
      category: 'COURSE_PROJECT',
      requiredSkills: ['React', 'Figma', 'TypeScript'],
      teamSize: 3,
      contactPreference: 'in_app',
      creatorAlias: 'MapMaker#118',
      creatorId: admin.id,
      status: 'OPEN',
      createdAt: isoDaysAgo(2),
    },
  ];

  db.lostFound = [
    {
      id: 'lf-1',
      title: 'Black Logitech mouse found near Siemens Lab',
      type: 'FOUND',
      category: 'Electronics',
      location: 'Siemens Lab, Ground Floor',
      date: isoDaysAgo(1).slice(0, 10),
      description: 'Wireless mouse left on desk 12 after the afternoon session. Handed to lab assistant.',
      status: 'OPEN',
      isSensitive: false,
      createdBy: admin.id,
      createdAt: isoDaysAgo(1),
    },
    {
      id: 'lf-2',
      title: 'Lost ID card — blue lanyard',
      type: 'LOST',
      category: 'ID / Documents',
      location: 'Cafeteria',
      date: isoDaysAgo(0).slice(0, 10),
      description: 'College ID with a blue lanyard, possibly dropped near the billing counter around 1 PM.',
      status: 'OPEN',
      isSensitive: true,
      createdBy: admin.id,
      createdAt: isoDaysAgo(0),
    },
  ];

  db.leaderboard = [
    {
      id: 'lb-1',
      rank: 1,
      displayName: 'A. Krishnan',
      alias: 'Scholar#101',
      isAnonymous: false,
      cgpa: 9.42,
      milestone: 'Sem 1-4',
      department: 'Computer Science',
      batch: '2023-2027',
      verified: true,
    },
    {
      id: 'lb-2',
      rank: 2,
      displayName: 'Hidden Scholar',
      alias: 'Scholar#204',
      isAnonymous: true,
      cgpa: 9.31,
      milestone: 'Sem 1-4',
      department: 'Computer Science',
      batch: '2023-2027',
      verified: true,
    },
    {
      id: 'lb-3',
      rank: 3,
      displayName: 'M. Patel',
      alias: 'Scholar#330',
      isAnonymous: false,
      cgpa: 9.18,
      milestone: 'Sem 1-4',
      department: 'Information Technology',
      batch: '2023-2027',
      verified: true,
    },
  ];

  db.notifications = [
    {
      id: 'ntf-all-1',
      userId: 'all',
      type: 'POLL',
      title: 'New campus poll is live',
      message: 'Vote on which campus improvement we should prioritize this semester.',
      read: false,
      link: '/poll-wars',
      createdAt: isoDaysAgo(1),
    },
    {
      id: 'ntf-all-2',
      userId: 'all',
      type: 'EVENT',
      title: 'Innovate 2026 registrations open',
      message: 'Department symposium paper and project tracks are now accepting registrations.',
      read: false,
      link: '/events',
      createdAt: isoDaysAgo(2),
    },
  ];

  db.auditLogs = [
    {
      id: 'aud-1',
      action: 'ADMIN_BOOTSTRAP',
      actorEmail: admin.email,
      actorRole: 'ADMIN',
      targetType: 'USER',
      targetId: admin.id,
      details: 'Initial administrator account created',
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function loadStore(): Promise<void> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as Partial<Store>;
      db.users = raw.users ?? [];
      db.polls = raw.polls ?? [];
      db.events = raw.events ?? [];
      db.opportunities = raw.opportunities ?? [];
      db.messages = raw.messages ?? [];
      db.lostFound = raw.lostFound ?? [];
      db.complaints = raw.complaints ?? [];
      db.savedCgpa = raw.savedCgpa ?? [];
      db.leaderboard = raw.leaderboard ?? [];
      db.notifications = raw.notifications ?? [];
      db.auditLogs = raw.auditLogs ?? [];
      db.passwordResets = raw.passwordResets ?? [];
    }
  } catch (err) {
    console.error('[store] Failed to load persisted data, starting fresh:', err);
  }

  const adminEmail = env.ADMIN_EMAIL.toLowerCase();
  let admin = db.users.find((u) => u.email.toLowerCase() === adminEmail);

  if (!admin) {
    if (db.users.length === 0 && db.polls.length === 0) {
      await seedFreshData();
      admin = db.users[0];
    } else {
      const password = await bcrypt.hash(env.ADMIN_INITIAL_PASSWORD, 12);
      admin = {
        id: 'admin-bootstrap',
        name: env.ADMIN_NAME,
        email: adminEmail,
        password,
        role: 'ADMIN',
        department: 'Administration',
        isEmailVerified: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      db.users.push(admin);
    }
  } else {
    admin.role = 'ADMIN';
    admin.status = 'ACTIVE';
    admin.isEmailVerified = true;
  }

  const hasDemoStudent = db.users.some((u) => u.email.toLowerCase() === 'student@example.com');
  if (!hasDemoStudent) {
    db.users.push({
      id: 'student-demo',
      name: 'Alex Johnson',
      email: 'student@example.com',
      password: await bcrypt.hash('student123', 12),
      role: 'STUDENT',
      department: 'Computer Science',
      batch: '2023-2027',
      isEmailVerified: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });
  }

  persist();
}

export function addAuditLog(
  action: string,
  actor: { email?: string; role?: string } | undefined,
  targetType: string,
  targetId?: string,
  details?: string
): void {
  db.auditLogs.unshift({
    id: 'aud-' + Date.now(),
    action,
    actorEmail: actor?.email || 'system',
    actorRole: actor?.role || 'SYSTEM',
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  });
}

export function toPublicUser(user: UserRecord) {
  const { password: _password, ...rest } = user;
  return rest;
}
