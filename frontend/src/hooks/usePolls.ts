import { useState, useEffect, useCallback } from 'react';
import { Poll } from '../types/poll.types';
import { pollService } from '../services/poll.service';
import toast from 'react-hot-toast';

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      const data = await pollService.getActivePolls();
      setPolls(data);
    } catch {
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const vote = async (pollId: string, optionId: string) => {
    try {
      const updated = await pollService.vote(pollId, optionId);
      setPolls((prev) => prev.map((p) => (p.id === pollId ? updated : p)));
      toast.success('Your vote has been counted!');
    } catch (err: unknown) {
      const axiosErr = err as { message?: string };
      toast.error(axiosErr.message || 'Failed to cast vote');
    }
  };

  return { polls, loading, vote, refreshPolls: fetchPolls };
}
