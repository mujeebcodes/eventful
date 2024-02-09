import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { OrganizerModule } from 'src/organizer/organizer.module';

@Module({
  imports: [OrganizerModule],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
