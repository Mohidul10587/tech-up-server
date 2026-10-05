import {
  Body,
  Controller,
  Get,
  Headers,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly jwt: JwtService,
  ) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Put()
  async update(
    @Body() dto: UpdateSettingsDto,
    @Headers('authorization') authorization?: string,
  ) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; role: Role }>(token);
      if (payload.role !== Role.ADMIN) throw new UnauthorizedException();
    } catch {
      throw new UnauthorizedException();
    }
    return this.settings.update(dto);
  }
}
