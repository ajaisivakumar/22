import { useState, useEffect, useCallback } from 'react';
import { CampusEvent, EventCategory } from '../types/event.types';
import { eventService } from '../services/event.service';
import toast from 'react-hot-toast';

export function useEvents(initialCategory?: EventCategory) {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [category, setCategory] = useState<EventCategory | undefined>(initialCategory);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventService.getEvents(category ? { category } : undefined);
      setEvents(data);
    } catch {
      toast.error('Failed to load campus events');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, category, setCategory, refreshEvents: fetchEvents };
}
