import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { User } from 'src/decorators/user.decorator';
import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async signup(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ message: string }> {
    return await this.userService.signup(createUserDto);
  }

  @ApiBody({ type: LoginUserDto })
  @ApiOkResponse({
    headers: {
      'Set-Cookie': { description: 'JWT cookie', schema: { type: 'string' } },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.userService.login(loginUserDto, res);
  }

  @Get(':id/logout')
  @UseGuards(JwtAuthGuard)
  logout(
    @Param('id') userId: string,
    @User('id') currentUserId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userService.logout(userId, currentUserId, res);
  }

  @Get('current-user')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  async getProfile(@User('id') currentUserId: string) {
    return await this.userService.getProfile(currentUserId);
  }

  @Get('enrollments')
  @UseGuards(JwtAuthGuard)
  getUserEnrollments(@User('id') currentUserId: string) {
    return this.userService.getUserEnrollments(currentUserId);
  }

  @Get('enrollments/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  getEnrollment(
    @Param('id') enrollId: string,
    @User('id') currentUserId: string,
  ) {
    return this.userService.getEnrollment(enrollId, currentUserId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateUserProfile(
    @Param('id') userId: string,
    @User('id') currentUserId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUserProfile(
      userId,
      currentUserId,
      updateUserDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteUserAccount(
    @Param('id') userId: string,
    @User('id') currentUserId: string,
  ) {
    return this.userService.deleteUserAccount(userId, currentUserId);
  }
}
