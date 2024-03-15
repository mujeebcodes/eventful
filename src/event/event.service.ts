import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UserDecoratorType } from 'src/decorators/types/userDecorator.type';
import { PrismaService } from 'prisma/prisma.service';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { cloudinary } from 'src/imageUploads/cloudinary.config';
import { Cache } from 'cache-manager';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EventService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailerService: MailerService,
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
      select: {
        title: true,
        availableTickets: true,
        participants: true,
        when: true,
      },
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
        "You're already enrolled in this event",
        HttpStatus.CONFLICT,
      );
    }

    const reminderDate = this.calculateReminderDate(event.when, whenToRemind);
    console.log(reminderDate);

    const currentDate = new Date();
    if (reminderDate <= currentDate) {
      throw new HttpException(
        'Reminder date cannot be in the past',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prismaService.enrollment.create({
      data: {
        userId: currentUser.id,
        eventId,
        whenToRemind: reminderDate.toISOString(),
      },
    });

    await this.prismaService.event.update({
      where: { id: eventId },
      data: { availableTickets: event.availableTickets - 1 },
    });

    return { message: 'User enrolled successfully in event' };
  }

  async cancelUserEnrollment(
    currentUser: UserDecoratorType,
    enrollmentId: string,
  ) {
    if (currentUser.role !== 'user') {
      throw new HttpException('Unauthorized to enroll', HttpStatus.FORBIDDEN);
    }

    const enrollment = await this.prismaService.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new HttpException('Enrollment not found', HttpStatus.NOT_FOUND);
    }

    if (enrollment.userId !== currentUser.id) {
      throw new HttpException(
        'Not aurthorized to cancel this enrollment',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.prismaService.enrollment.delete({
      where: { id: enrollmentId },
    });
    await this.prismaService.event.update({
      where: { id: enrollment.eventId },
      data: {
        availableTickets: {
          increment: 1,
        },
      },
    });
    return { message: 'enrollment cancelled successfully' };
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

  calculateReminderDate(eventDate: Date, whenToRemind: string): Date {
    const reminderDate = new Date(eventDate);

    const [number, unit] = whenToRemind.split(' ');

    switch (unit.toLowerCase()) {
      case 'minute':
      case 'minutes':
        reminderDate.setMinutes(reminderDate.getMinutes() - parseInt(number));
        break;
      case 'hour':
      case 'hours':
        reminderDate.setHours(reminderDate.getHours() - parseInt(number));
        break;
      case 'day':
      case 'days':
        reminderDate.setDate(reminderDate.getDate() - parseInt(number));
        break;
      case 'week':
      case 'weeks':
        reminderDate.setDate(reminderDate.getDate() - parseInt(number) * 7);
        break;
      default:
        throw new HttpException(
          'Invalid reminder unit',
          HttpStatus.BAD_REQUEST,
        );
    }

    return reminderDate;
  }

  async getDueReminders(): Promise<any[]> {
    const currentDate = new Date();
    const enrollments = await this.prismaService.enrollment.findMany({
      where: {
        whenToRemind: {
          lte: currentDate,
        },
      },
      include: {
        user: { select: { email: true } },
        event: { select: { title: true } },
      },
    });
    return enrollments;
  }

  async sendReminders(): Promise<void> {
    try {
      const enrollments = await this.getDueReminders();
      if (enrollments) {
        for (const enrollment of enrollments) {
          this.mailerService.sendMail({
            to: enrollment.user.email,
            from: process.env.MY_EMAIL,
            subject: 'Reminder for upcoming event',
            text: `Dear ${enrollment.user.firstname},\n\nThis is a reminder for the upcoming event, ${enrollment.event.title} on ${enrollment.event.when}.`,
          });
          console.log(`Reminder email sent to ${enrollment.user.email}`);
        }
      }
    } catch (error) {
      console.log(`Error sending reminders: ${error.message}`);
    }
  }
}
