import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.MY_EMAIL,
          pass: process.env.MY_EMAIL_APP_PASSWORD,
        },
      },
    }),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
