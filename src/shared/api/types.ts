export const categories = ['Music', 'Food', 'Arts', 'Community', 'Wellness', 'Technology'] as const;
export type EventCategory = (typeof categories)[number];
export type EventDto = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  location: string;
  category: EventCategory;
  imageUrl: string;
  hostName: string;
  hostId: string | null;
  attendeeCount: number;
  attendeeAvatars: string[];
  isAttending: boolean;
  createdAt: string;
};
export type EventInput = Pick<
  EventDto,
  'title' | 'description' | 'startsAt' | 'endsAt' | 'location' | 'category' | 'imageUrl'
>;
