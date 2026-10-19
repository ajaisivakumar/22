import api from './api';
import { Opportunity, PartnerMessage } from '../types/opportunity.types';

const defaultOpportunities: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Smart India Hackathon: Need Backend & ML Engineer',
    description: 'We are working on an automated satellite imagery flood detection model. Need a teammate skilled in PyTorch/FastAPI and cloud deployment.',
    category: 'HACKATHON',
    requiredSkills: ['Python', 'PyTorch', 'FastAPI', 'Docker'],
    teamSize: 4,
    contactPreference: 'in_app',
    creatorAlias: 'NeuralKnight#402',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'opp-2',
    title: 'Campus Food Delivery & Pre-Order Web Application',
    description: 'Building an internal micro-ordering platform to bypass long queues in the food court. Need a React Native developer and UI/UX designer.',
    category: 'STARTUP',
    requiredSkills: ['React Native', 'Tailwind', 'Figma', 'Node.js'],
    teamSize: 3,
    contactPreference: 'in_app',
    creatorAlias: 'ByteCrafter#108',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'opp-3',
    title: 'Autonomous Drone Navigation (Final Year Capstone Project)',
    description: 'Investigating SLAM and optical flow on Raspberry Pi 5 with companion flight controller. Looking for an embedded C++ or ROS enthusiast.',
    category: 'RESEARCH',
    requiredSkills: ['ROS2', 'C++', 'OpenCV', 'Embedded Systems'],
    teamSize: 3,
    contactPreference: 'in_app',
    creatorAlias: 'AeroLead#991',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

const defaultMessages: PartnerMessage[] = [
  {
    id: 'msg-1',
    opportunityId: 'opp-1',
    senderId: 'usr-1',
    senderName: 'Alex Johnson',
    senderAlias: 'You',
    recipientId: 'NeuralKnight#402',
    message: 'Hey, I have worked with PyTorch and deployed FastAPI models on AWS. Would love to join your SIH team!',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'msg-2',
    opportunityId: 'opp-1',
    senderId: 'opp-1-creator',
    senderName: 'NeuralKnight',
    senderAlias: 'NeuralKnight#402',
    recipientId: 'usr-1',
    message: 'Awesome! Can you share your GitHub or any demo project link? We are meeting tomorrow 4 PM at the library.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export const opportunityService = {
  async getOpportunities(category?: string): Promise<Opportunity[]> {
    try {
      const res = await api.get<{ opportunities: Opportunity[] }>(category ? `/opportunities?category=${category}` : '/opportunities');
      return res.data.opportunities ?? [];
    } catch {
      const stored = localStorage.getItem('mock_opportunities');
      const list: Opportunity[] = stored ? JSON.parse(stored) : defaultOpportunities;
      if (category && category !== 'ALL') {
        return list.filter((o) => o.category === category);
      }
      return list;
    }
  },

  async createOpportunity(data: {
    title: string;
    description: string;
    category: Opportunity['category'];
    requiredSkills: string[];
    teamSize: number;
    contactPreference: 'in_app' | 'email';
  }): Promise<Opportunity> {
    try {
      const res = await api.post<{ opportunity: Opportunity }>('/opportunities', data);
      return res.data.opportunity;
    } catch {
      const stored = localStorage.getItem('mock_opportunities');
      const list: Opportunity[] = stored ? JSON.parse(stored) : [...defaultOpportunities];
      const newOpp: Opportunity = {
        id: 'opp-' + Date.now(),
        title: data.title,
        description: data.description,
        category: data.category,
        requiredSkills: data.requiredSkills,
        teamSize: data.teamSize,
        contactPreference: data.contactPreference,
        creatorAlias: 'Explorer#' + Math.floor(100 + Math.random() * 900),
        isOwner: true,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      };
      list.unshift(newOpp);
      localStorage.setItem('mock_opportunities', JSON.stringify(list));
      return newOpp;
    }
  },

  async getMessages(opportunityId: string): Promise<PartnerMessage[]> {
    try {
      const res = await api.get<{ messages: PartnerMessage[] }>(`/opportunities/${opportunityId}/messages`);
      return res.data.messages;
    } catch {
      const stored = localStorage.getItem(`mock_messages_${opportunityId}`);
      if (stored) return JSON.parse(stored);
      return defaultMessages.filter((m) => m.opportunityId === opportunityId);
    }
  },

  async sendMessage(opportunityId: string, message: string): Promise<PartnerMessage> {
    try {
      const res = await api.post<{ message: PartnerMessage }>(`/opportunities/${opportunityId}/messages`, { message });
      return res.data.message;
    } catch {
      const stored = localStorage.getItem(`mock_messages_${opportunityId}`);
      const list: PartnerMessage[] = stored ? JSON.parse(stored) : defaultMessages.filter((m) => m.opportunityId === opportunityId);
      const newMsg: PartnerMessage = {
        id: 'msg-' + Date.now(),
        opportunityId,
        senderId: 'usr-1',
        senderName: 'Alex Johnson',
        senderAlias: 'You',
        recipientId: 'lead',
        message,
        createdAt: new Date().toISOString(),
      };
      list.push(newMsg);
      localStorage.setItem(`mock_messages_${opportunityId}`, JSON.stringify(list));
      return newMsg;
    }
  },

  async closeOpportunity(id: string): Promise<void> {
    try {
      await api.patch(`/opportunities/${id}/close`);
    } catch {
      const stored = localStorage.getItem('mock_opportunities');
      const list: Opportunity[] = stored ? JSON.parse(stored) : [...defaultOpportunities];
      const opp = list.find((o) => o.id === id);
      if (opp) opp.status = 'CLOSED';
      localStorage.setItem('mock_opportunities', JSON.stringify(list));
    }
  },
};
