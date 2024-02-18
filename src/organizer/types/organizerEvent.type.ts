import { Enrollment, Event } from '@prisma/client';

export type EventType = Event & { participants: Enrollment[] };
export type OrganizerEventsType = {
  events: Array<Event & { participants?: Enrollment[] }>;
};
