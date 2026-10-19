import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flame, PlusCircle, Trash2, StopCircle, Eye, BarChart2 } from 'lucide-react';
import { Poll } from '../../types/poll.types';
import { pollService } from '../../services/poll.service';
import { createPollSchema, CreatePollFormData } from '../../utils/validators';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export const AdminPollsPage: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewingPoll, setViewingPoll] = useState<Poll | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePollFormData>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      question: '',
      description: '',
      options: ['Option 1', 'Option 2'],
      expiresAt: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 16),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options' as never,
  });

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      setLoading(true);
      const data = await pollService.getAllPolls();
      setPolls(data);
    } catch {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const onCreatePoll = async (data: CreatePollFormData) => {
    try {
      await pollService.createPoll({
        question: data.question,
        description: data.description,
        options: data.options,
        expiresAt: data.expiresAt,
      });
      toast.success('New poll published to student portal!');
      setCreateModalOpen(false);
      reset();
      loadPolls();
    } catch {
      toast.error('Failed to create poll');
    }
  };

  const handleClosePoll = async (id: string) => {
    try {
      await pollService.closePoll(id);
      toast.success('Poll marked as closed');
      loadPolls();
    } catch {
      toast.error('Failed to close poll');
    }
  };

  const handleDeletePoll = async (id: string) => {
    try {
      await pollService.deletePoll(id);
      toast.success('Poll removed');
      loadPolls();
    } catch {
      toast.error('Failed to delete poll');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            Classroom Poll Wars Moderation
          </h1>
          <p className="text-sm text-gray-500">
            Create institutional surveys, monitor vote distribution, and close active questions.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Create New Poll
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Question</th>
                <th className="py-3 px-4">Options</th>
                <th className="py-3 px-4 text-center">Total Votes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">Loading polls...</td>
                </tr>
              ) : polls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">No polls available</td>
                </tr>
              ) : (
                polls.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-bold text-gray-900 line-clamp-1">{p.question}</p>
                      {p.description && <p className="text-xs text-gray-400 truncate">{p.description}</p>}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {p.options.length} choices
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-900">{p.totalVotes}</td>
                    <td className="py-3 px-4">
                      <Badge status={p.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{formatDate(p.expiresAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewingPoll(p)}
                          title="View vote counts"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {p.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleClosePoll(p.id)}
                            title="Close voting"
                          >
                            <StopCircle className="w-3.5 h-3.5 text-amber-600" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeletePoll(p.id)}
                          title="Delete poll"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* VIEW POLL BREAKDOWN MODAL */}
      <Modal
        isOpen={!!viewingPoll}
        onClose={() => setViewingPoll(null)}
        title="Poll Analytics & Vote Count"
        maxWidth="md"
      >
        {viewingPoll && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">{viewingPoll.question}</h3>
            <p className="text-xs text-gray-500">Total votes cast: {viewingPoll.totalVotes}</p>

            <div className="space-y-3 pt-2">
              {viewingPoll.options.map((opt) => {
                const percent =
                  viewingPoll.totalVotes > 0
                    ? Math.round((opt.voteCount / viewingPoll.totalVotes) * 100)
                    : 0;
                return (
                  <div key={opt.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{opt.text}</span>
                      <span className="font-bold">{percent}% ({opt.voteCount})</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setViewingPoll(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE POLL MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Classroom Poll"
        description="Publish a question to the entire college student body"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit(onCreatePoll)} className="space-y-4">
          <Input
            label="Question"
            placeholder="e.g. Preferred start timing for sports festival?"
            error={errors.question?.message}
            {...register('question')}
          />

          <Input
            label="Description (optional)"
            placeholder="Additional context or department..."
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-700">Options</label>
              <button
                type="button"
                onClick={() => append('' as never)}
                className="text-xs text-primary font-semibold hover:underline"
              >
                + Add Option
              </button>
            </div>

            {fields.map((field, idx) => (
              <div key={field.id} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 text-xs rounded-lg border border-gray-300 p-2 focus:border-primary focus:outline-none"
                  {...register(`options.${idx}` as const)}
                />
                {fields.length > 2 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Input
            label="Expiration Date & Time"
            type="datetime-local"
            error={errors.expiresAt?.message}
            {...register('expiresAt')}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Publish Poll
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPollsPage;
