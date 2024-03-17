import { ApiProperty } from '@nestjs/swagger';
import { Enrollment, Event } from '@prisma/client';

export class UserProfileResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstname: string;

  @ApiProperty()
  lastname: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  enrollments: Enrollment;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  role: string;
}

export class OrganizerProfileResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationName: string;

  @ApiProperty()
  logo: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  bio: string;

  @ApiProperty()
  events: string;
}

class EventStats {
  @ApiProperty()
  totalEnrollment: number;

  @ApiProperty()
  scannedIn: number;
}

export class OrganizerAnalyticsResponse {
  @ApiProperty()
  totalEventsOrganized: number;

  @ApiProperty()
  allTimeEnrollments: number;

  @ApiProperty({ type: EventStats, isArray: true })
  individualEventsStats: Record<string, EventStats>;
}

export class EnrollmentResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  user: any;

  @ApiProperty()
  event: Event;

  @ApiProperty()
  enrollmentDate: Date;
}

export class EventResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  eventImg: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  venue: string;

  @ApiProperty()
  when: Date;

  @ApiProperty()
  availableTickets: number;

  @ApiProperty()
  eventStatus: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  organizer: {
    organizationName: string;
  };
}

export class ApiSuccessMessage {
  @ApiProperty()
  msg: string;
}
export class ApiErrorMessage {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  msg: string;
}
