import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { LoginOrganizerDto } from './dto/login-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { Response } from 'express';

@Controller('organizers')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  @Post('signup')
  async create(@Body() createOrganizerDto: CreateOrganizerDto) {
    return await this.organizerService.createOrganizer(createOrganizerDto);
  }

  @Post('login')
  async login(
    @Body() loginOrganizerDto: LoginOrganizerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.organizerService.loginOrganizer(loginOrganizerDto, res);
  }

  @Get()
  findAll() {
    return this.organizerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizerService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrganizerDto: UpdateOrganizerDto,
  ) {
    return this.organizerService.update(+id, updateOrganizerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.organizerService.remove(+id);
  }
}
