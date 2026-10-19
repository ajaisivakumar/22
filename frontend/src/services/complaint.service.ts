import api from './api';
import { LabComplaint } from '../types/complaint.types';

export const complaintService = {
  async submitComplaint(data: {
    floor: string;
    lab: string;
    systemNumber: string;
    description: string;
  }): Promise<LabComplaint> {
    const res = await api.post<{ referenceId: string; complaint: LabComplaint }>(
      '/lab-complaints',
      data
    );
    return res.data.complaint;
  },

  async getMyComplaints(): Promise<LabComplaint[]> {
    try {
      const res = await api.get<{ complaints: LabComplaint[] }>('/lab-complaints/my');
      return res.data.complaints ?? [];
    } catch {
      return [];
    }
  },

  async adminGetComplaints(params?: { status?: string; lab?: string }): Promise<LabComplaint[]> {
    try {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.lab) query.set('lab', params.lab);
      const suffix = query.toString() ? `?${query}` : '';
      const res = await api.get<{ complaints: LabComplaint[] }>(`/admin/lab-complaints${suffix}`);
      return res.data.complaints ?? [];
    } catch {
      const res = await api.get<{ complaints: LabComplaint[] }>('/lab-complaints');
      return res.data.complaints ?? [];
    }
  },

  async adminUpdateStatus(id: string, status: string, note?: string): Promise<LabComplaint> {
    const res = await api.patch<{ complaint: LabComplaint }>(`/admin/lab-complaints/${id}/status`, {
      status,
      resolutionNote: note,
      notes: note,
    });
    return res.data.complaint;
  },

  async getAllComplaints(params?: { status?: string; lab?: string }): Promise<LabComplaint[]> {
    return complaintService.adminGetComplaints(params);
  },

  async updateComplaintStatus(id: string, status: string, note?: string): Promise<LabComplaint> {
    return complaintService.adminUpdateStatus(id, status, note);
  },
};
