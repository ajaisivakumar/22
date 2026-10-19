import { Request, Response, NextFunction } from 'express';
import { PollRepository } from '../repositories/poll.repository';
import AuditService from '../audit/audit.service';

export class PollController {
  public static async getActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const polls = await PollRepository.getActivePolls(userId);
      res.status(200).json({ success: true, data: polls });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const poll = await PollRepository.getPollById(id, userId);

      if (!poll) {
        res.status(404).json({ success: false, message: 'Poll not found' });
        return;
      }

      res.status(200).json({ success: true, data: poll });
    } catch (err) {
      next(err);
    }
  }

  public static async vote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: pollId } = req.params;
      const { optionId } = req.body;
      const userId = req.user!.id;

      const poll = await PollRepository.getPollById(pollId);
      if (!poll) {
        res.status(404).json({ success: false, message: 'Poll not found' });
        return;
      }

      if (poll.status !== 'ACTIVE') {
        res.status(400).json({ success: false, message: 'Poll is no longer active' });
        return;
      }

      if (poll.closesAt && new Date() > poll.closesAt) {
        res.status(400).json({ success: false, message: 'Voting has closed for this poll' });
        return;
      }

      const hasVoted = await PollRepository.hasUserVoted(pollId, userId);
      if (hasVoted) {
        res.status(409).json({ success: false, message: 'You have already voted on this poll' });
        return;
      }

      await PollRepository.castVote(pollId, optionId, userId);

      await AuditService.log({
        eventType: 'POLL_VOTE_CAST',
        actorId: userId,
        targetType: 'POLL',
        targetId: pollId,
        outcome: 'SUCCESS',
      });

      res.status(200).json({ success: true, message: 'Vote recorded successfully' });
    } catch (err: any) {
      if (err.code === 'P2002') {
        res.status(409).json({ success: false, message: 'You have already voted on this poll' });
        return;
      }
      next(err);
    }
  }

  public static async getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const poll = await PollRepository.getPollById(id, userId);
      if (!poll) {
        res.status(404).json({ success: false, message: 'Poll not found' });
        return;
      }

      const hasVoted = userId ? await PollRepository.hasUserVoted(id, userId) : false;
      if (poll.resultsVisibility === 'AFTER_VOTE' && !hasVoted && req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'You must cast a vote to view poll results',
        });
        return;
      }

      res.status(200).json({ success: true, data: poll });
    } catch (err) {
      next(err);
    }
  }

  // Admin handlers
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question, options, closesAt, resultsVisibility } = req.body;
      const poll = await PollRepository.createPoll({
        question,
        options,
        createdById: req.user!.id,
        closesAt: closesAt ? new Date(closesAt) : undefined,
        resultsVisibility,
      });

      res.status(201).json({ success: true, data: poll });
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const poll = await PollRepository.updatePoll(id, req.body);
      res.status(200).json({ success: true, data: poll });
    } catch (err) {
      next(err);
    }
  }

  public static async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const poll = await PollRepository.updatePoll(id, {
        status: 'ACTIVE',
        publishedAt: new Date(),
      });
      res.status(200).json({ success: true, data: poll });
    } catch (err) {
      next(err);
    }
  }

  public static async close(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const poll = await PollRepository.updatePoll(id, {
        status: 'CLOSED',
        closesAt: new Date(),
      });
      res.status(200).json({ success: true, data: poll });
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await PollRepository.deletePoll(id);
      res.status(200).json({ success: true, message: 'Poll deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
