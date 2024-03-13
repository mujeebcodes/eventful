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
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('eventImg'))
  createEvent(
    @User() user: UserDecoratorType,
    @UploadedFile() eventImg: Express.Multer.File,
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.eventService.createEvent(user, eventImg, createEventDto);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  enrollUser(
    @User() currentUser: UserDecoratorType,
    @Param('id') eventId: string,
    @Body('whenToRemind') whenToRemind: string,
  ) {
    return this.eventService.enrollUser(currentUser, eventId, whenToRemind);
  }

  @Delete('enrollment/:id')
  @UseGuards(JwtAuthGuard)
  cancelUserEnrollment(
    @User() currentUser: UserDecoratorType,
    @Param('id') enrollmentId: string,
  ) {
    return this.eventService.cancelUserEnrollment(currentUser, enrollmentId);
  }

  @SkipThrottle()
  @UseInterceptors(CacheInterceptor)
  @Get()
  findAll() {
    return this.eventService.getAllEvents();
  }

  @SkipThrottle()
  @UseInterceptors(CacheInterceptor)
  @Get(':id')
  getEvent(@Param('id') id: string) {
    return this.eventService.getEvent(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateEvent(
    @Param('id') eventId: string,
    @User('id') currentOrganizerId: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventService.updateEvent(
      eventId,
      currentOrganizerId,
      updateEventDto,
    );
  }

  @Patch('checkin/:eventId/:userId/:enrollmentId')
  checkInUser(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    return this.eventService.checkInUser(eventId, userId, enrollmentId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  cancelEvent(
    @Param('id') eventId: string,
    @User('id') currentOrganizerId: string,
  ) {
    return this.eventService.cancelEvent(eventId, currentOrganizerId);
  }
}
