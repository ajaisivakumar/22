import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users2,
  PlusCircle,
  MessageSquare,
  Send,
  UserCheck,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Opportunity, PartnerMessage } from '../../types/opportunity.types';
import { opportunityService } from '../../services/opportunity.service';
import {
  createOpportunitySchema,
  CreateOpportunityFormData,
} from '../../utils/validators';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatRelativeTime } from '../../utils/format';
import toast from 'react-hot-toast';

export const PartnerFinderPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Chat Drawer / Modal state
  const [activeChatOpp, setActiveChatOpp] = useState<Opportunity | null>(null);
  const [chatMessages, setChatMessages] = useState<PartnerMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    loadOpportunities();
  }, [selectedCategory]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const data = await opportunityService.getOpportunities(selectedCategory);
      setOpportunities(data);
    } catch {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOpportunityFormData>({
    resolver: zodResolver(createOpportunitySchema),
    defaultValues: {
      category: 'HACKATHON',
      teamSize: 4,
      contactPreference: 'in_app',
    },
  });

  const onCreateOpportunity = async (data: CreateOpportunityFormData) => {
    try {
      const skills = data.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await opportunityService.createOpportunity({
        title: data.title,
        description: data.description,
        category: data.category as Opportunity['category'],
        requiredSkills: skills,
        teamSize: data.teamSize,
        contactPreference: 'in_app',
      });
      toast.success('Team opening published anonymously!');
      setCreateModalOpen(false);
      reset();
      loadOpportunities();
    } catch {
      toast.error('Failed to create posting');
    }
  };

  const handleOpenChat = async (opp: Opportunity) => {
    setActiveChatOpp(opp);
    const msgs = await opportunityService.getMessages(opp.id);
    setChatMessages(msgs);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChatOpp) return;
    try {
      setSendingMsg(true);
      const newMsg = await opportunityService.sendMessage(activeChatOpp.id, messageInput.trim());
      setChatMessages((prev) => [...prev, newMsg]);
      setMessageInput('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Users2 className="w-6 h-6 text-brand-green" />
            Find Your Team / Project Partner Finder
          </h1>
          <p className="text-sm text-gray-500">
            Form high-impact squads for hackathons, capstones, startups, and research without bias. Anonymous until you connect.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Post Team Opening
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-2">
        {['ALL', 'HACKATHON', 'STARTUP', 'RESEARCH', 'COURSE_PROJECT'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Users2 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-base font-semibold text-gray-900">No team openings found</h3>
          <p className="mt-1 text-xs text-gray-500">
            Be the first to post an opening for an upcoming hackathon or course project!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {opportunities.map((opp) => (
            <Card key={opp.id} hoverable className="flex flex-col justify-between">
              <CardBody className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {opp.category}
                    </span>
                    <Badge status={opp.status} size="sm" />
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">
                    Lead: {opp.creatorAlias}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-snug">{opp.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{opp.description}</p>
                </div>

                {/* Skills tags */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                    Target Skills & Roles
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {opp.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </CardBody>

              <div className="px-5 py-3.5 bg-gray-50/75 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-gray-400" /> Target Team Size: {opp.teamSize}
                </span>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleOpenChat(opp)}
                  leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                >
                  Message Lead
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CHAT / MESSAGE MODAL */}
      <Modal
        isOpen={!!activeChatOpp}
        onClose={() => setActiveChatOpp(null)}
        title={`Message Lead: ${activeChatOpp?.creatorAlias}`}
        description={`Regarding: ${activeChatOpp?.title}`}
        maxWidth="lg"
      >
        <div className="flex flex-col h-96">
          <div className="p-2.5 bg-amber-50 rounded-lg text-xs text-amber-800 flex items-center gap-2 mb-3 shrink-0">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Your identity is protected. Share your skills and projects directly with the squad lead.
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
            {chatMessages.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-12">
                No messages yet. Send an intro and your portfolio link!
              </p>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.senderId === 'usr-1' || msg.senderAlias === 'You';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-gray-400 mb-0.5">{msg.senderAlias}</span>
                    <div
                      className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                        isMe
                          ? 'bg-primary text-white rounded-br-none'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-2xs'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-0.5">
                      {formatRelativeTime(msg.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-3 flex gap-2 shrink-0">
            <input
              type="text"
              placeholder="Write a message to team lead..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 text-xs rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
            />
            <Button
              size="sm"
              variant="primary"
              onClick={handleSendMessage}
              isLoading={sendingMsg}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send
            </Button>
          </div>
        </div>
      </Modal>

      {/* CREATE OPPORTUNITY MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Post a New Team Opening"
        description="Connect with talented students across branches"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onCreateOpportunity)} className="space-y-4">
          <Input
            label="Opportunity Title"
            placeholder="e.g. SIH 2026: Seeking Full-Stack Next.js Developer"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Category" {...register('category')}>
              <option value="HACKATHON">Hackathon</option>
              <option value="STARTUP">Startup Venture</option>
              <option value="RESEARCH">Research Paper</option>
              <option value="COURSE_PROJECT">Course / Capstone Project</option>
              <option value="OTHER">Other Collaboration</option>
            </Select>

            <Input
              label="Target Squad Size"
              type="number"
              min="2"
              max="10"
              error={errors.teamSize?.message}
              {...register('teamSize')}
            />
          </div>

          <Input
            label="Required Skills (Comma separated)"
            placeholder="React, TypeScript, Tailwind, Python, FastAPI"
            error={errors.requiredSkills?.message}
            {...register('requiredSkills')}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Project Overview</label>
            <textarea
              rows={3}
              placeholder="Describe your idea, timeline, expected commitment, and what you bring..."
              className="w-full text-xs sm:text-sm rounded-lg border border-gray-300 p-2.5 focus:border-primary focus:outline-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-red-600 font-medium">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Publish Opening
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PartnerFinderPage;
