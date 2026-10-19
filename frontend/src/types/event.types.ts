export type EventCategory = 'TECHNICAL' | 'CULTURAL' | 'SPORTS' | 'WORKSHOP' | 'SEMINAR' | 'HACKATHON';

export type EventStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'CANCELLED';

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  eventDate: string;
  venue: string;
  registrationLink?: string;
  brochureUrl?: string;
  status: EventStatus;
  organizerName?: string;
  createdBy?: string;
  submittedBy?: {
    id: string;
    name: string;
    email: string;
  };
  moderatorNotes?: string;
  createdAt: string;
}
