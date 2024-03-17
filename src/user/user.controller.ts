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
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import {
  UserProfileResponse,
  EnrollmentResponse,
  ApiSuccessMessage,
  ApiErrorMessage,
} from 'src/api-responses/user.response';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  @ApiOperation({ summary: 'Creates a new user' })
  @ApiCreatedResponse({
    description: 'Returns a success message if successful',
    type: ApiSuccessMessage,
  })
  @ApiUnprocessableEntityResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  async signup(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ message: string }> {
    return await this.userService.signup(createUserDto);
  }

  @ApiBody({ type: LoginUserDto })
  @ApiOperation({ summary: 'Logs in a valid user' })
  @ApiOkResponse({
    description:
      'Adds JWT token to cookies if successful and returns a success message',
    type: ApiSuccessMessage,
    headers: {
      'Set-Cookie': { description: 'JWT cookie', schema: { type: 'string' } },
    },
  })
  @ApiUnprocessableEntityResponse({
    description: 'returns an error code & message if unsuccessful',
    type: ApiErrorMessage,
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
  @ApiOperation({
    summary: 'Logs out the current user. Requires valid JWT user authorization',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'User Id' })
  @ApiOkResponse({
    description: 'Logs out the user by clearing the cookies.',
    type: ApiSuccessMessage,
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  @UseGuards(JwtAuthGuard)
  logout(
    @Param('id') userId: string,
    @User('id') currentUserId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userService.logout(userId, currentUserId, res);
  }

  @Get('current-user')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Gets current user profile. Requires valid JWT user authorization',
  })
  @ApiOkResponse({
    description: 'Returns the profile of the current user',
    type: UserProfileResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  async getProfile(@User('id') currentUserId: string) {
    return await this.userService.getProfile(currentUserId);
  }

  @Get('enrollments')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Get all the user's enrollments. Requires valid JWT user authorization",
  })
  @ApiOkResponse({
    description:
      'Returns the enrollments of the current user if they have any or { msg: "You are currently not enrolled for any event" } if they have none. Requires valid JWT authentication',
    type: [EnrollmentResponse],
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  @UseGuards(JwtAuthGuard)
  getUserEnrollments(@User('id') currentUserId: string) {
    return this.userService.getUserEnrollments(currentUserId);
  }

  @Get('enrollments/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a single enrollment. Requires valid JWT user authorization',
  })
  @ApiOkResponse({
    description: 'Returns a single enrollment',
    type: EnrollmentResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  getEnrollment(
    @Param('id') enrollId: string,
    @User('id') currentUserId: string,
  ) {
    return this.userService.getEnrollment(enrollId, currentUserId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Updates the user profile. Requires valid JWT user authorization',
  })
  @ApiOkResponse({
    description: 'Returns a success message if successful',
    type: ApiSuccessMessage,
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
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
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deletes the user profile. Requires valid JWT user authorization',
  })
  @ApiOkResponse({
    description: 'Returns a success message if successful',
    type: ApiSuccessMessage,
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  @UseGuards(JwtAuthGuard)
  deleteUserAccount(
    @Param('id') userId: string,
    @User('id') currentUserId: string,
  ) {
    return this.userService.deleteUserAccount(userId, currentUserId);
  }
}
