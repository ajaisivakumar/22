export interface AdminDashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  publishedEvents: number;
  activePolls: number;
  openComplaints: number;
  lostFoundOpen: number;
  lostFoundResolved: number;
  moderationActions24h: number;
  securityEventsCount: number;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorEmail: string;
  actorRole: string;
  targetType: string;
  targetId?: string;
  ipAddress?: string;
  details?: string;
  createdAt: string;
}
