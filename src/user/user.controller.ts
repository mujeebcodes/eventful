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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { User } from 'src/decorators/user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signup(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ message: string }> {
    return await this.userService.signup(createUserDto);
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.userService.login(loginUserDto, res);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getProfile(@User('id') currentUserId: string) {
    return await this.userService.getProfile(currentUserId);
  }

  @Get('enrollments/:id')
  @UseGuards(JwtAuthGuard)
  getEnrollment(
    @Param('id') enrollId: string,
    @User('id') currentUserId: string,
  ) {
    return this.userService.getEnrollment(enrollId, currentUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
