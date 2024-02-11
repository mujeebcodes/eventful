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
  ) {
    return this.eventService.enrollUser(currentUser, eventId);
  }

  @Get()
  findAll() {
    return this.eventService.getAllEvents();
  }

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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  cancelEvent(
    @Param('id') eventId: string,
    @User('id') currentOrganizerId: string,
  ) {
    return this.eventService.cancelEvent(eventId, currentOrganizerId);
  }
}
