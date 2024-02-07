import { HttpException, HttpStatus, Injectable, Res } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { jwtSecret } from 'src/utils/constants';

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
        'Unable to sign up',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async login(loginUserDto: LoginUserDto, res) {
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

    const token = await this.signToken({
      userId: existingUser.id,
      email: existingUser.email,
      role: 'user',
    });

    res.cookie('token', token, { httpOnly: true });

    return { message: 'Login successful' };
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  async signToken(args: { userId: string; email: string; role: string }) {
    const payload = {
      id: args.userId,
      email: args.email,
    };

    const token = await this.jwt.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: '1h',
    });

    return token;
  }
}
