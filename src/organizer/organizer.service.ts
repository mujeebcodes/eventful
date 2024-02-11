import { HttpException, HttpStatus, Injectable, Res } from '@nestjs/common';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { LoginOrganizerDto } from './dto/login-organizer.dto';
import { PrismaService } from 'prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { Response } from 'express';
import { cloudinary } from 'src/imageUploads/cloudinary.config';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

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

  async loginOrganizer(
    loginOrganizerDto: LoginOrganizerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
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

  findAll() {
    return `This action returns all organizer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} organizer`;
  }

  update(id: number, updateOrganizerDto: UpdateOrganizerDto) {
    return `This action updates a #${id} organizer`;
  }

  remove(id: number) {
    return `This action removes a #${id} organizer`;
  }
}
