import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SINGLETON_ID = 'singleton';

// Prisma requires `Prisma.JsonNull` (not plain `null`) to explicitly store
// NULL in a nullable Json column.
function jsonOrNull(value: object | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value !== undefined ? (value as Prisma.InputJsonValue) : Prisma.JsonNull;
}

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
        mobileRepairingCourse: jsonOrNull(dto.mobileRepairingCourse),
        englishSpeakingCourse: jsonOrNull(dto.englishSpeakingCourse),
      },
      create: {
        id: SINGLETON_ID,
        address: dto.address ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        mobileRepairingCourse: jsonOrNull(dto.mobileRepairingCourse),
        englishSpeakingCourse: jsonOrNull(dto.englishSpeakingCourse),
      },
    });
  }
}
