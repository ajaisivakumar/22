export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface LabComplaint {
  id: string;
  referenceId: string;
  floor: string;
  lab: string;
  systemNumber: string;
  description: string;
  status: ComplaintStatus;
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}
