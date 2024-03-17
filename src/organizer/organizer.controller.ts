import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { LoginOrganizerDto } from './dto/login-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { User } from 'src/decorators/user.decorator';
import { UserDecoratorType } from 'src/decorators/types/userDecorator.type';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  ApiErrorMessage,
  ApiSuccessMessage,
  OrganizerAnalyticsResponse,
  OrganizerProfileResponse,
} from 'src/api-responses/user.response';

@ApiTags('Event organizers')
@Controller('organizers')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Creates a new event organizer' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        organizationName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        password: { type: 'string' },
        bio: { type: 'string' },
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Returns a success message if successful',
    type: ApiSuccessMessage,
  })
  @ApiUnprocessableEntityResponse({
    description: 'returns an error code & message if unsucccessful',
    type: ApiErrorMessage,
  })
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @UploadedFile() logo: Express.Multer.File,
    @Body() createOrganizerDto: CreateOrganizerDto,
  ) {
    return await this.organizerService.createOrganizer(
      logo,
      createOrganizerDto,
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Logs in a valid event organizer' })
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
  async login(
    @Body() loginOrganizerDto: LoginOrganizerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.organizerService.loginOrganizer(loginOrganizerDto, res);
  }

  @Get(':id/logout')
  @ApiOperation({
    summary:
      'Logs out the current organizer. Requires valid JWT event organizer authorization',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Organizer Id' })
  @ApiOkResponse({
    description: 'Logs out the event organizer by clearing the cookies.',
    type: ApiSuccessMessage,
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  @UseGuards(JwtAuthGuard)
  logout(
    @Param('id') organizerId: string,
    @User('id') currentOrganizerId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.organizerService.logOutOrganizer(
      organizerId,
      currentOrganizerId,
      res,
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Gets current user profile. Requires valid JWT event organizer authorization',
  })
  @ApiOkResponse({
    description: 'Returns the profile of the current organizer',
    type: OrganizerProfileResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  @SkipThrottle()
  @UseInterceptors(CacheInterceptor)
  getProfile(@Param('id') organizerId: string) {
    return this.organizerService.getOrganizerProfile(organizerId);
  }

  @Get(':id/analytics')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Gets an array of the current organizer's statistics. Requires valid JWT event organizer authorization",
  })
  @ApiOkResponse({
    description: "Gets an array of the current organizer's statistics",
    type: OrganizerAnalyticsResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  async getOrganizerAnalytics(
    @Param('id') organizerId: string,
    @User() currentOrganizer: UserDecoratorType,
  ) {
    return await this.organizerService.getOrganizerAnalytics(
      organizerId,
      currentOrganizer,
    );
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Updates the organizer profile. Requires valid JWT event organizer authorization',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        organizationName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        password: { type: 'string' },
        bio: { type: 'string' },
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
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
  @UseInterceptors(FileInterceptor('logo'))
  updateOrganizerProfile(
    @Param('id') organizerId: string,
    @User('id') currentOrganizerId: string,
    @UploadedFile() logo: Express.Multer.File,
    @Body() updateOrganizerDto: UpdateOrganizerDto,
  ) {
    return this.organizerService.updateOrganizerProfile(
      organizerId,
      currentOrganizerId,
      logo,
      updateOrganizerDto,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Deletes the organizer profile. Requires valid JWT event organizer authorization',
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
  deleteAccount(
    @Param('id') organizerId: string,
    @User('id') currentOrganizerId: string,
  ) {
    return this.organizerService.deleteAccount(organizerId, currentOrganizerId);
  }
}
