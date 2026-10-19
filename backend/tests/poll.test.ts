import { describe, it, expect } from 'vitest';
import { createPollSchema, votePollSchema } from '../src/validators/poll.validator';

describe('Poll Validation', () => {
  it('should validate poll creation with valid options', () => {
    const validPoll = {
      question: 'Which programming language do you prefer for backend?',
      options: ['TypeScript', 'Go', 'Rust', 'Python'],
      resultsVisibility: 'AFTER_VOTE',
    };

    const res = createPollSchema.safeParse(validPoll);
    expect(res.success).toBe(true);
  });

  it('should reject poll with fewer than 2 options', () => {
    const invalidPoll = {
      question: 'Do you agree?',
      options: ['Yes'],
    };

    const res = createPollSchema.safeParse(invalidPoll);
    expect(res.success).toBe(false);
  });

  it('should reject poll with more than 10 options', () => {
    const invalidPoll = {
      question: 'Choose your favourite',
      options: Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`),
    };

    const res = createPollSchema.safeParse(invalidPoll);
    expect(res.success).toBe(false);
  });

  it('should validate vote payload requiring a valid uuid', () => {
    const validVote = {
      optionId: '123e4567-e89b-12d3-a456-426614174000',
    };
    expect(votePollSchema.safeParse(validVote).success).toBe(true);

    const invalidVote = {
      optionId: 'not-a-uuid',
    };
    expect(votePollSchema.safeParse(invalidVote).success).toBe(false);
  });
});
