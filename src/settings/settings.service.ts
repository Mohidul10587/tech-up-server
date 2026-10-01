import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the single settings row, or an empty object if not yet created. */
  async get() {
    const row = await this.prisma.setting.findUnique({
      where: { id: SINGLETON_ID },
    });
    return row ?? { id: SINGLETON_ID };
  }

  /** Creates or fully updates the singleton settings row. */
  async update(dto: UpdateSettingsDto) {
    return this.prisma.setting.upsert({
      where: { id: SINGLETON_ID },
      update: {
        address: dto.address ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        courseFeesMobileRepairing: dto.courseFeesMobileRepairing ?? null,
        courseFeesEnglishSpeaking: dto.courseFeesEnglishSpeaking ?? null,
      },
      create: {
        id: SINGLETON_ID,
        address: dto.address ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        courseFeesMobileRepairing: dto.courseFeesMobileRepairing ?? null,
        courseFeesEnglishSpeaking: dto.courseFeesEnglishSpeaking ?? null,
      },
    });
  }
}
