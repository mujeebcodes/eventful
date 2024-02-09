import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UserDecoratorType } from 'src/decorators/types/userDecorator.type';
import { PrismaService } from 'prisma/prisma.service';
import { OrganizerService } from 'src/organizer/organizer.service';

@Injectable()
export class EventService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly organizerService: OrganizerService,
  ) {}

  async createEvent(user: UserDecoratorType, createEventDto: CreateEventDto) {
    if (user.role !== 'organizer') {
      throw new HttpException(
        'Unauthorized to create events',
        HttpStatus.FORBIDDEN,
      );
    }
    const organizer = await this.prismaService.organizer.findUnique({
      where: { id: user.id },
    });

    const newEvent = {
      title: createEventDto.title,
      description: createEventDto.description,
      venue: createEventDto.venue,
      when: new Date(createEventDto.when),
      availableTickets: createEventDto.availableTickets,
      eventStatus: createEventDto.eventStatus,
      category: createEventDto.category,
      organizerId: organizer.id,
    };
    return await this.prismaService.event.create({ data: newEvent });
  }

  async getAllEvents() {
    const events = await this.prismaService.event.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        venue: true,
        when: true,
        availableTickets: true,
        eventStatus: true,
        category: true,
        createdAt: true,
        organizer: { select: { organizationName: true } },
      },
    });

    if (events.length < 1) {
      throw new HttpException('No events scheduled', HttpStatus.NOT_FOUND);
    }
    return events;
  }

  async getEvent(id: string) {
    const event = await this.prismaService.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        venue: true,
        when: true,
        availableTickets: true,
        eventStatus: true,
        category: true,
        createdAt: true,
        organizerId: true,
        organizer: { select: { organizationName: true } },
      },
    });

    if (!event) {
      throw new HttpException('Event does not exist', HttpStatus.NOT_FOUND);
    }

    return event;
  }

  async updateEvent(
    eventId: string,
    currentOrganizerId: string,
    updateEventDto: UpdateEventDto,
  ) {
    const event = await this.getEvent(eventId);

    if (!event) {
      throw new HttpException('Event does not exist', HttpStatus.NOT_FOUND);
    }

    if (event.organizerId !== currentOrganizerId) {
      throw new HttpException(
        'Unauthorized to make this change',
        HttpStatus.FORBIDDEN,
      );
    }

    return await this.prismaService.event.update({
      where: { id: eventId },
      data: updateEventDto,
    });
  }

  async cancelEvent(eventId: string, currentOrganizerId: string) {
    const event = await this.getEvent(eventId);

    if (!event) {
      throw new HttpException('Event does not exist', HttpStatus.NOT_FOUND);
    }
    if (event.organizerId !== currentOrganizerId) {
      throw new HttpException(
        'Unauthorized to make this change',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prismaService.event.delete({ where: { id: eventId } });
    return { message: 'Event cancelled successfully' };
  }
}
