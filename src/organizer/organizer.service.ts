import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { LoginOrganizerDto } from './dto/login-organizer.dto';
import { PrismaService } from 'prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { Response } from 'express';
import { cloudinary } from 'src/imageUploads/cloudinary.config';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { EventType, OrganizerEventsType } from './types/organizerEvent.type';
import { Enrollment } from '@prisma/client';
import { UserDecoratorType } from 'src/decorators/types/userDecorator.type';

@Injectable()
export class OrganizerService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  async createOrganizer(
    logo: Express.Multer.File,
    createOrganizerDto: CreateOrganizerDto,
  ) {
    try {
      const existingOrganizer = await this.prismaService.organizer.findUnique({
        where: { email: createOrganizerDto.email },
      });

      if (existingOrganizer) {
        throw new HttpException(
          'Organizer with this email exists. Please login',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      let logoUrl =
        'https://res.cloudinary.com/dpsoua8bk/image/upload/v1707606375/0d64989794b1a4c9d89bff571d3d5842_y8cymq.jpg';
      if (logo) {
        const tempFilePath = path.join(
          __dirname,
          '../imageUploads/tempFile.png',
        );

        await fsPromises.writeFile(tempFilePath, logo.buffer);
        const logoUpload = await cloudinary.uploader.upload(tempFilePath, {
          resource_type: 'auto',
        });

        logoUrl = logoUpload.secure_url;
      }

      const newOrganizer = {
        ...createOrganizerDto,
        logo: logoUrl,
        password: await this.userService.hashPassword(
          createOrganizerDto.password,
        ),
      };

      await this.prismaService.organizer.create({ data: newOrganizer });

      return { message: 'Organizer created successfully' };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Unable to sign up',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async loginOrganizer(loginOrganizerDto: LoginOrganizerDto, res: Response) {
    const existingOrganizer = await this.prismaService.organizer.findUnique({
      where: { email: loginOrganizerDto.email },
    });
    if (!existingOrganizer) {
      throw new HttpException(
        'Wrong credentials',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isCorrectPassword = await this.userService.comparePassword(
      loginOrganizerDto.password,
      existingOrganizer.password,
    );

    if (!isCorrectPassword) {
      throw new HttpException(
        'Wrong credentials',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const token = await this.userService.signToken({
      userId: existingOrganizer.id,
      email: existingOrganizer.email,
      role: 'organizer',
    });

    res.cookie('token', token, { httpOnly: true });

    return { message: 'Login successful' };
  }

  async getOrganizerAnalytics(
    organizerId: string,
    currentOrganizer: UserDecoratorType,
  ) {
    if (organizerId !== currentOrganizer.id) {
      throw new HttpException(
        'Not authorized to access this route',
        HttpStatus.FORBIDDEN,
      );
    }
    const organizer: OrganizerEventsType =
      await this.prismaService.organizer.findUnique({
        where: { id: organizerId },
        select: { events: { include: { participants: true } } },
      });

    const allTimeEnrollments = organizer.events.reduce(
      (totalEnrollments, event: EventType) => {
        if (event.participants && Array.isArray(event.participants)) {
          totalEnrollments += event.participants.length;
        }
        return totalEnrollments;
      },
      0,
    );

    const individualEventsStats: Record<
      string,
      { totalEnrollment: number; scannedIn: number }
    > = {};

    organizer.events.forEach((event: EventType) => {
      const totalEnrollment = event.participants?.length || 0;
      const scannedIn =
        event.participants?.filter(
          (enrollment: Enrollment) => enrollment.QRCodeScanned,
        ).length || 0;

      individualEventsStats[event.title] = { totalEnrollment, scannedIn };
    });
    const organizerAnalytics = {
      totalEventsOrganized: organizer.events.length,
      allTimeEnrollments,
      individualEventsStats,
    };

    return { organizerAnalytics };
  }

  getOrganizerProfile(organizerId: string) {
    return this.prismaService.organizer.findUnique({
      where: { id: organizerId },
      select: {
        organizationName: true,
        logo: true,
        email: true,
        phone: true,
        bio: true,
        events: true,
      },
    });
  }

  async updateOrganizerProfile(
    organizerId: string,
    currentOrganizerId: string,
    logo: Express.Multer.File,
    updateOrganizerDto: UpdateOrganizerDto,
  ) {
    if (organizerId !== currentOrganizerId) {
      throw new HttpException(
        'Unauthorized to make this change',
        HttpStatus.UNAUTHORIZED,
      );
    }
    let logoUrl;
    if (logo) {
      const tempFilePath = path.join(__dirname, '../imageUploads/tempFile.png');

      await fsPromises.writeFile(tempFilePath, logo.buffer);
      const logoUpload = await cloudinary.uploader.upload(tempFilePath, {
        resource_type: 'auto',
      });

      logoUrl = logoUpload.secure_url;
    }

    await this.prismaService.organizer.update({
      where: { id: organizerId },
      data: {
        ...updateOrganizerDto,
        ...(logoUrl && { logo: logoUrl }),
      },
    });

    return { message: 'account updated successfully' };
  }

  async deleteAccount(organizerId, currentOrganizerId) {
    if (organizerId !== currentOrganizerId) {
      throw new HttpException(
        'Unauthorized to make this change',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.prismaService.organizer.delete({ where: { id: organizerId } });
    return { message: 'account deleted successfully' };
  }
}
