import NativeEventSearch from '../../../specs/NativeEventSearch';
import type { EventDto } from '@/shared/api/types';
export function rankEvents(query: string, events: EventDto[]) {
  if (!query.trim()) return events;
  const indexes = NativeEventSearch?.rankByTitle(
    query,
    events.map(
      (event) => `${event.title} ${event.description} ${event.location} ${event.category}`,
    ),
  );
  if (indexes) return indexes.map((index) => events[index]).filter(Boolean);
  const needle = query.toLocaleLowerCase();
  return events
    .map((event, index) => ({
      event,
      index,
      score: `${event.title} ${event.description} ${event.location} ${event.category}`
        .toLocaleLowerCase()
        .indexOf(needle),
    }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map(({ event }) => event);
}
