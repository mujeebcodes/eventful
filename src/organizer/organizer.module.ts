import { Module } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { OrganizerController } from './organizer.controller';
import { JwtModule } from '@nestjs/jwt';

import { UserModule } from 'src/user/user.module';
import { JwtStrategy } from 'src/auth/jwt.strategy';

@Module({
  imports: [JwtModule, UserModule],
  controllers: [OrganizerController],
  providers: [OrganizerService, JwtStrategy],
  exports: [OrganizerService],
})
export class OrganizerModule {}
