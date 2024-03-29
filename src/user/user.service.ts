import { HttpException, HttpStatus, Injectable, Res } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as QRCode from 'qrcode';
import { Response } from 'express';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwt: JwtService,
  ) {}
  async signup(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.prismaService.user.findUnique({
        where: { id: createUserDto.email },
      });
      if (existingUser) {
        throw new HttpException(
          'User with this email exists. Please login',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      const newUser = {
        ...createUserDto,
        password: await this.hashPassword(createUserDto.password),
      };
      await this.prismaService.user.create({ data: newUser });
      return { message: 'User created successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Unknown error occurred',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async login(loginUserDto: LoginUserDto, res: Response) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: loginUserDto.email },
    });
    if (!existingUser) {
      throw new HttpException(
        'Wrong credentials',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isCorrectPassword = await this.comparePassword(
      loginUserDto.password,
      existingUser.password,
    );

    if (!isCorrectPassword) {
      throw new HttpException(
        'Wrong credentials',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const token = this.signToken({
      userId: existingUser.id,
      email: existingUser.email,
      role: 'user',
    });

    res.cookie('token', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
    });

    return { message: 'Login successful' };
  }

  logout(userId: string, currentUserId: string, res: Response) {
    if (currentUserId !== userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    res.clearCookie('token');
    return { msg: 'Logged out successfully' };
  }

  async getProfile(currentUserId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        enrollments: true,
        createdAt: true,
      },
    });

    if (currentUserId !== user.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return { ...user, role: 'user' };
  }

  async getUserEnrollments(currentUserId: string) {
    const enrollments = await this.prismaService.enrollment.findMany({
      where: { userId: currentUserId },
      select: {
        id: true,
        userId: true,
        user: true,
        event: true,
        enrollmentDate: true,
      },
    });

    if (enrollments.length < 1) {
      return { msg: 'You are currently not enrolled for any event' };
    }

    return enrollments;
  }
  async getEnrollment(enrolId: string, currentUserId: string) {
    const enrollment = await this.prismaService.enrollment.findUnique({
      where: { id: enrolId },
      select: {
        id: true,
        userId: true,
        user: true,
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            venue: true,
            when: true,
            organizer: { select: { organizationName: true } },
            eventImg: true,
          },
        },
        enrollmentDate: true,
      },
    });

    if (currentUserId !== enrollment.userId) {
      throw new HttpException(
        'Unauthorized to view this enrollment',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const checkinURL = `/events/checkin/${enrollment.event.id}/${enrollment.userId}/${enrollment.id}`;
    const accessQRCode = await this.generateQRCode(checkinURL);
    return { ...enrollment, QRCode: accessQRCode };
  }

  async updateUserProfile(userId, currentUserId, updateUserDto: UpdateUserDto) {
    if (userId !== currentUserId) {
      throw new HttpException(
        'Unauthorized to make this change',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.prismaService.user.update({
      where: { id: userId },
      data: updateUserDto,
    });

    return { message: 'account updated successfully' };
  }

  async deleteUserAccount(userId, currentUserId) {
    if (userId !== currentUserId) {
      throw new HttpException(
        'Unauthorized to make this change',
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.prismaService.user.delete({ where: { id: userId } });
    return { message: 'account deleted successfully' };
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  signToken(args: { userId: string; email: string; role: string }) {
    const payload = {
      id: args.userId,
      email: args.email,
      role: args.role,
    };

    const token = this.jwt.sign(payload);

    return token;
  }

  async generateQRCode(url) {
    try {
      const qrCode = await QRCode.toDataURL(url);
      return qrCode;
    } catch (err) {
      throw new HttpException(
        'Unable to generate QR code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
