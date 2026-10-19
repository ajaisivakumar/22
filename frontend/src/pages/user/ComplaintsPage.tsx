import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MessageSquareWarning,
  ShieldCheck,
  CheckCircle2,
  Copy,
  RotateCcw,
  Monitor,
} from 'lucide-react';
import { complaintService } from '../../services/complaint.service';
import { LabComplaint } from '../../types/complaint.types';
import { labComplaintSchema, LabComplaintFormData } from '../../utils/validators';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import toast from 'react-hot-toast';

// ── Real college labs ────────────────────────────────────────────────────────
const LABS = [
  'Ground Floor Lab',
  'Siemens Lab',
  'Naan Muthalvan Lab',
] as const;

const DEFAULT_LAB = LABS[0];

export const ComplaintsPage: React.FC = () => {
  const [submittedComplaint, setSubmittedComplaint] = useState<LabComplaint | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LabComplaintFormData>({
    resolver: zodResolver(labComplaintSchema),
    defaultValues: {
      floor: 'Ground Floor',
      lab: DEFAULT_LAB,
      systemNumber: '',
      description: 'SYSTEM NOT WORKING',
    },
  });

  const onSubmit = async (data: LabComplaintFormData) => {
    try {
      const complaint = await complaintService.submitComplaint({
        floor: 'Ground Floor',      // single campus, floor not needed by admin
        lab: data.lab,
        systemNumber: data.systemNumber,
        description: data.description || 'SYSTEM NOT WORKING',
      });
      setSubmittedComplaint(complaint);
      toast.success('Lab complaint recorded anonymously!');
    } catch {
      toast.error('Failed to register complaint');
    }
  };

  const copyRefId = () => {
    if (submittedComplaint?.referenceId) {
      navigator.clipboard.writeText(submittedComplaint.referenceId);
      toast.success('Reference ticket ID copied to clipboard');
    }
  };

  const handleStartNew = () => {
    setSubmittedComplaint(null);
    reset({
      floor: 'Ground Floor',
      lab: DEFAULT_LAB,
      systemNumber: '',
      description: 'SYSTEM NOT WORKING',
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <MessageSquareWarning className="w-6 h-6 text-primary" />
          Anonymous Lab Complaint Desk
        </h1>
        <p className="text-sm text-gray-500">
          Report faulty PCs, broken keyboards, OS boot failures, or network drops in college computer labs.
        </p>
      </div>

      {/* Zero Trace Security Notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900">
          <p className="font-bold">Zero Trace Anonymous Guarantee</p>
          <p className="mt-0.5 text-emerald-800">
            No name, roll number, student ID, or network IP address is recorded with this ticket.
            The IT hardware technician only receives the laboratory coordinates and issue symptoms.
          </p>
        </div>
      </div>

      {submittedComplaint ? (
        /* ── Confirmation Screen ── */
        <Card className="border-emerald-200">
          <CardBody className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">Lab Complaint Dispatched</h2>
              <p className="text-xs text-gray-500 mt-1">
                Your ticket has been queued with the Campus Hardware Maintenance Department.
              </p>
            </div>

            {/* Reference ID Pill */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 max-w-sm mx-auto space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Ticket Reference Code
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl font-bold text-gray-900 tracking-wide">
                  {submittedComplaint.referenceId}
                </span>
                <button
                  type="button"
                  onClick={copyRefId}
                  className="p-1.5 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-200 transition-colors"
                  title="Copy Reference ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400">
                Keep this code to check service progress or follow up with lab assistants.
              </p>
            </div>

            {/* Ticket Summary */}
            <div className="text-left bg-gray-50/70 p-4 rounded-lg text-xs space-y-1.5 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Lab:</span>
                <span className="font-semibold text-gray-800">{submittedComplaint.lab}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">System Number:</span>
                <span className="font-semibold text-gray-800 font-mono">
                  {submittedComplaint.systemNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reported Problem:</span>
                <span className="font-medium text-gray-700">{submittedComplaint.description}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                onClick={handleStartNew}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                File Another Complaint
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        /* ── Complaint Form ── */
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Lab Terminal Coordinates</CardTitle>
              <CardDescription>Select the lab and enter the system number</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Lab Selector */}
              <Select
                label="Computer Laboratory"
                error={errors.lab?.message}
                {...register('lab')}
              >
                {LABS.map((labName) => (
                  <option key={labName} value={labName}>
                    {labName}
                  </option>
                ))}
              </Select>

              {/* System Number — plain digits only, no prefix */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  System / Terminal Number
                </label>
                <div className="relative">
                  <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min={1}
                    max={999}
                    placeholder="e.g. 14"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    {...register('systemNumber')}
                  />
                </div>
                {errors.systemNumber && (
                  <p className="text-xs text-red-600 font-medium">{errors.systemNumber.message}</p>
                )}
                <p className="text-xs text-gray-400">
                  Enter the number printed on the sticker on top of the CPU or monitor bezel.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Issue Description</label>
                <textarea
                  rows={3}
                  className="w-full text-xs sm:text-sm rounded-lg border border-gray-300 p-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Describe hardware/software malfunction..."
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs text-red-600 font-medium">{errors.description.message}</p>
                )}
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5"
                  isLoading={isSubmitting}
                >
                  Submit Anonymous Complaint
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default ComplaintsPage;
