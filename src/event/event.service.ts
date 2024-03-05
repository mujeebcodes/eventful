import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UserDecoratorType } from 'src/decorators/types/userDecorator.type';
import { PrismaService } from 'prisma/prisma.service';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { cloudinary } from 'src/imageUploads/cloudinary.config';
import { Cache } from 'cache-manager';

@Injectable()
export class EventService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
  ) {}

  async createEvent(
    user: UserDecoratorType,
    eventImg: Express.Multer.File,
    createEventDto: CreateEventDto,
  ) {
    if (user.role !== 'organizer') {
      throw new HttpException(
        'Unauthorized to create events',
        HttpStatus.FORBIDDEN,
      );
    }
    const organizer = await this.prismaService.organizer.findUnique({
      where: { id: user.id },
    });

    if (!eventImg) {
      throw new HttpException(
        'Event must have an image/poster',
        HttpStatus.BAD_REQUEST,
      );
    }

    const tempFilePath = path.join(__dirname, '../imageUploads/tempFile.png');

    await fsPromises.writeFile(tempFilePath, eventImg.buffer);
    const logoUpload = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: 'auto',
      folder: 'eventful/events',
    });

    const imgUrl = logoUpload.secure_url;

    const newEvent = {
      title: createEventDto.title,
      description: createEventDto.description,
      eventImg: imgUrl,
      venue: createEventDto.venue,
      when: new Date(createEventDto.when),
      availableTickets: +createEventDto.availableTickets,
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
        eventImg: true,
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
        eventImg: true,
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

  async enrollUser(
    currentUser: UserDecoratorType,
    eventId: string,
    whenToRemind: string,
  ) {
    if (currentUser.role !== 'user') {
      throw new HttpException('Unauthorized to enroll', HttpStatus.FORBIDDEN);
    }
    const event = await this.prismaService.event.findUnique({
      where: { id: eventId },
      select: { title: true, availableTickets: true, participants: true },
    });

    const user = await this.prismaService.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!event || !user) {
      throw new HttpException(
        'Invalid Event/User',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isTicketAvailable = event.availableTickets > 0;
    if (!isTicketAvailable) {
      throw new HttpException(
        'Event sold out',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const alreadyEnrolled = event.participants.find(
      (participant) => currentUser.id === participant.userId,
    );

    if (alreadyEnrolled) {
      throw new HttpException(
        'User already enrolled in this event',
        HttpStatus.CONFLICT,
      );
    }

    await this.prismaService.enrollment.create({
      data: { userId: currentUser.id, eventId, whenToRemind },
    });

    await this.prismaService.event.update({
      where: { id: eventId },
      data: { availableTickets: event.availableTickets - 1 },
    });

    return { message: 'User enrolled successfully in event' };
  }

  async checkInUser(eventId: string, userId: string, enrollmentId: string) {
    const enrollment = await this.prismaService.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { userId: true, event: true, eventId: true },
    });

    if (!enrollment) {
      throw new HttpException('Invalid enrollment', HttpStatus.NOT_FOUND);
    }

    if (enrollment.eventId !== eventId && enrollment.userId !== userId) {
      throw new HttpException('Invalid enrollment', HttpStatus.UNAUTHORIZED);
    }

    const currentDate = new Date();
    const eventDate = new Date(enrollment.event.when);

    if (!this.isSameDay(currentDate, eventDate)) {
      throw new HttpException(
        'Cannot check in before/after event date',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prismaService.enrollment.update({
      where: { id: enrollmentId },
      data: { QRCodeScanned: true },
    });

    return { message: 'User checked in successfully to event' };
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}
