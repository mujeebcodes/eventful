import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UserModule } from './user/user.module';
import { OrganizerModule } from './organizer/organizer.module';


@Module({
  imports: [ PrismaModule, UserModule, OrganizerModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
