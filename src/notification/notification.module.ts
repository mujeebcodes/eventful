import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventModule } from 'src/event/event.module';

@Module({ imports: [EventModule, ScheduleModule.forRoot()] })
export class NotificationModule {}
