import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventService } from 'src/event/event.service';

@Injectable()
export class ReminderScheduler implements OnModuleInit {
  constructor(private readonly eventService: EventService) {}

  onModuleInit() {
    this.sendReminders();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendReminders() {
    // Trigger the sendReminders method every hour
    await this.eventService.sendReminders();
  }
}
