import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { User } from 'src/decorators/user.decorator';
import { UserDecoratorType } from 'src/decorators/types/userDecorator.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  ApiErrorMessage,
  ApiSuccessMessage,
  EventResponse,
} from 'src/api-responses/user.response';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Creates a new event. Requires valid JWT event organizer authorization',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        eventImg: {
          type: 'string',
          format: 'binary',
        },
        venue: { type: 'string' },
        when: { type: 'string' },
        availableTickets: {
          type: 'number',
        },
        eventStatus: { type: 'string' },
        category: { type: 'string' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Returns a success message if successful',
    type: ApiSuccessMessage,
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('eventImg'))
  createEvent(
    @User() user: UserDecoratorType,
    @UploadedFile() eventImg: Express.Multer.File,
    @Body() body,
  ) {
    return this.eventService.createEvent(user, eventImg, body);
  }

  @Post(':id/enroll')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Enrolls a user in an event. Requires valid JWT user authorization',
  })
  @ApiOkResponse({
    description: 'Returns a success message if successful',
    type: ApiSuccessMessage,
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  @ApiConflictResponse({
    description:
      'returns an error code & message if user already enrolled in the event',
    type: ApiErrorMessage,
  })
  @ApiUnprocessableEntityResponse({
    description: 'returns an error code & message if event is sold out',
    type: ApiErrorMessage,
  })
  @ApiBadRequestResponse({
    description:
      'returns an error code & message if user tries tp set an unrealistic reminder',
    type: ApiErrorMessage,
  })
  @UseGuards(JwtAuthGuard)
  enrollUser(
    @User() currentUser: UserDecoratorType,
    @Param('id') eventId: string,
    @Body('whenToRemind') whenToRemind: string,
  ) {
    return this.eventService.enrollUser(currentUser, eventId, whenToRemind);
  }

  @Delete('enrollment/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      "Cancels a user's enrollment in an event. Requires valid JWT user authorization",
  })
  @ApiOkResponse({
    description: 'Returns a success message if successful',
    type: ApiSuccessMessage,
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  @ApiNotFoundResponse({
    description:
      'returns an error code & message if the enrollment id is invalid',
    type: ApiErrorMessage,
  })
  @UseGuards(JwtAuthGuard)
  cancelUserEnrollment(
    @User() currentUser: UserDecoratorType,
    @Param('id') enrollmentId: string,
  ) {
    return this.eventService.cancelUserEnrollment(currentUser, enrollmentId);
  }

  @Get()
  @ApiOperation({
    summary: 'Gets all scheduled events. Does not require any authorization',
  })
  @ApiOkResponse({
    description: 'Returns an array of all scheduled events',
    type: [EventResponse],
  })
  @ApiNotFoundResponse({
    description: 'returns an error message if no event returned',
    type: ApiErrorMessage,
  })
  @SkipThrottle()
  @UseInterceptors(CacheInterceptor)
  findAll() {
    return this.eventService.getAllEvents();
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Gets a single scheduled event. Does not require any authorization',
  })
  @ApiOkResponse({
    description: 'Returns a scheduled event',
    type: EventResponse,
  })
  @ApiNotFoundResponse({
    description: 'returns an error message if no event returned',
    type: ApiErrorMessage,
  })
  @SkipThrottle()
  @UseInterceptors(CacheInterceptor)
  getEvent(@Param('id') id: string) {
    return this.eventService.getEvent(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Updates an event. Requires valid JWT event organizer authorization & must be from the organizer of the event',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        eventImg: {
          type: 'string',
          format: 'binary',
        },
        venue: { type: 'string' },
        when: { type: 'string' },
        availableTickets: {
          type: 'number',
        },
        eventStatus: { type: 'string' },
        category: { type: 'string' },
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
  @UseInterceptors(FileInterceptor('eventImg'))
  updateEvent(
    @Param('id') eventId: string,
    @User('id') currentOrganizerId: string,
    @Body() updateEventDto: UpdateEventDto,
    @UploadedFile() eventImg?: Express.Multer.File,
  ) {
    console.log(updateEventDto);
    return this.eventService.updateEvent(
      eventId,
      currentOrganizerId,
      updateEventDto,
      eventImg,
    );
  }

  @Patch('checkin/:eventId/:userId/:enrollmentId')
  @ApiOperation({
    summary:
      'Checks in a user through QR code scan. Requires valid JWT event organizer authorization',
  })
  @ApiOkResponse({
    description: 'Returns a success message if successful',
    type: ApiSuccessMessage,
  })
  @ApiBadRequestResponse({
    description:
      'returns an error code & message if trying to check in before date of event',
    type: ApiErrorMessage,
  })
  @ApiUnauthorizedResponse({
    description:
      'returns an error message if the user is not enrolled in the event',
    type: ApiErrorMessage,
  })
  checkInUser(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    return this.eventService.checkInUser(eventId, userId, enrollmentId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Deletes/cancels an event. Requires valid JWT event organizer authorization & from the organizer of the event',
  })
  @ApiOkResponse({
    description: 'Returns a success message if successful',
    type: ApiSuccessMessage,
  })
  @ApiUnauthorizedResponse({
    description: 'returns an error code & message if unauthorized',
    type: ApiErrorMessage,
  })
  @ApiNotFoundResponse({
    description: 'returns an error message if the event id is invalid',
    type: ApiErrorMessage,
  })
  @UseGuards(JwtAuthGuard)
  cancelEvent(
    @Param('id') eventId: string,
    @User('id') currentOrganizerId: string,
  ) {
    return this.eventService.cancelEvent(eventId, currentOrganizerId);
  }
}
