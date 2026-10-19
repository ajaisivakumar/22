import React, { useState } from 'react';
import { Flame, CheckCircle, BarChart3, Clock, Sparkles } from 'lucide-react';
import { usePolls } from '../../hooks/usePolls';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatRelativeTime } from '../../utils/format';

export const PollWarsPage: React.FC = () => {
  const { polls, loading, vote } = usePolls();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [votingId, setVotingId] = useState<string | null>(null);

  const handleSelect = (pollId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [pollId]: optionId }));
  };

  const handleVoteSubmit = async (pollId: string) => {
    const optionId = selectedOptions[pollId];
    if (!optionId) return;
    setVotingId(pollId);
    await vote(pollId, optionId);
    setVotingId(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-primary text-xs font-bold uppercase tracking-wider mb-2">
          <Flame className="w-3.5 h-3.5 fill-primary text-primary" />
          Campus Voice
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
          🔥 Classroom Poll Wars
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time, college-wide student polls. Have your say on academic policy, campus amenities, timings, and events.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Flame className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-base font-semibold text-gray-900">No active polls right now</h3>
          <p className="mt-1 text-xs text-gray-500">
            All polls have ended or the student council hasn&apos;t opened a new topic today.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {polls.map((poll) => {
            const hasVoted = !!poll.userVoteId;
            const mostVotedOption = [...poll.options].sort((a, b) => b.voteCount - a.voteCount)[0];

            return (
              <Card key={poll.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge status={poll.status} size="sm" />
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Closes in {formatRelativeTime(poll.expiresAt)}
                      </span>
                    </div>
                    <CardTitle className="text-base sm:text-lg mt-1">{poll.question}</CardTitle>
                    {poll.description && (
                      <CardDescription>{poll.description}</CardDescription>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-700 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs whitespace-nowrap">
                      {poll.totalVotes} Total Votes
                    </span>
                  </div>
                </CardHeader>

                <CardBody className="p-6">
                  {/* Results View if User has Voted */}
                  {hasVoted ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>You cast your vote in this poll</span>
                      </div>

                      {poll.options.map((option) => {
                        const percent =
                          poll.totalVotes > 0
                            ? Math.round((option.voteCount / poll.totalVotes) * 100)
                            : 0;
                        const isUserChoice = poll.userVoteId === option.id;
                        const isLeader =
                          mostVotedOption &&
                          mostVotedOption.id === option.id &&
                          option.voteCount > 0;

                        return (
                          <div key={option.id} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-medium ${
                                    isUserChoice ? 'text-primary font-bold' : 'text-gray-800'
                                  }`}
                                >
                                  {option.text}
                                </span>
                                {isUserChoice && (
                                  <span className="text-[10px] bg-red-100 text-primary font-bold px-1.5 py-0.5 rounded">
                                    Your Vote
                                  </span>
                                )}
                                {isLeader && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Most Voted
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-gray-700">
                                {percent}% ({option.voteCount})
                              </span>
                            </div>

                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isUserChoice
                                    ? 'bg-primary'
                                    : isLeader
                                    ? 'bg-brand-blue'
                                    : 'bg-gray-400'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Voting Radio Form */
                    <div className="space-y-3">
                      {poll.options.map((option) => {
                        const isSelected = selectedOptions[poll.id] === option.id;
                        return (
                          <label
                            key={option.id}
                            onClick={() => handleSelect(poll.id, option.id)}
                            className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-red-50/50 shadow-2xs'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`poll-${poll.id}`}
                              checked={isSelected}
                              onChange={() => handleSelect(poll.id, option.id)}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            />
                            <span className="text-xs sm:text-sm font-medium text-gray-800">
                              {option.text}
                            </span>
                          </label>
                        );
                      })}

                      <div className="pt-3 flex justify-end">
                        <Button
                          variant="primary"
                          disabled={!selectedOptions[poll.id]}
                          isLoading={votingId === poll.id}
                          onClick={() => handleVoteSubmit(poll.id)}
                          leftIcon={<BarChart3 className="w-4 h-4" />}
                        >
                          Submit Vote
                        </Button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PollWarsPage;
