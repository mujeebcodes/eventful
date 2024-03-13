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
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Event organizers')
@Controller('organizers')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Post('signup')
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
  async login(
    @Body() loginOrganizerDto: LoginOrganizerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.organizerService.loginOrganizer(loginOrganizerDto, res);
  }

  @Get(':id/logout')
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
  @SkipThrottle()
  @UseInterceptors(CacheInterceptor)
  getProfile(@Param('id') organizerId: string) {
    return this.organizerService.getOrganizerProfile(organizerId);
  }

  @Get(':id/analytics')
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
  @UseGuards(JwtAuthGuard)
  deleteAccount(
    @Param('id') organizerId: string,
    @User('id') currentOrganizerId: string,
  ) {
    return this.organizerService.deleteAccount(organizerId, currentOrganizerId);
  }
}
