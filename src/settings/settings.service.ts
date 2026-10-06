import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SINGLETON_ID = 'singleton';

// Prisma requires `Prisma.JsonNull` (not plain `null`) to explicitly store
// NULL in a nullable Json column.
function jsonOrNull(
  value: object | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value !== undefined ? value : Prisma.JsonNull;
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

  /** Creates or fully updates the singleton settings row.
   *
   * IMPORTANT: Fields omitted from the DTO are preserved from the existing row.
   * This prevents a partial save (e.g. saving only contact details) from
   * accidentally nulling out course JSON or the logo URL.
   */
  async update(dto: UpdateSettingsDto) {
    // Read existing row so we can fall back to any field the DTO omits.
    const existing = await this.prisma.setting.findUnique({
      where: { id: SINGLETON_ID },
    });

    const logoUrl =
      dto.logoUrl !== undefined ? dto.logoUrl : (existing?.logoUrl ?? null);

    const mobileRepairingCourse =
      dto.mobileRepairingCourse !== undefined
        ? jsonOrNull(dto.mobileRepairingCourse)
        : ((existing?.mobileRepairingCourse as Prisma.InputJsonValue | null) ??
          Prisma.JsonNull);

    const englishSpeakingCourse =
      dto.englishSpeakingCourse !== undefined
        ? jsonOrNull(dto.englishSpeakingCourse)
        : ((existing?.englishSpeakingCourse as Prisma.InputJsonValue | null) ??
          Prisma.JsonNull);

    return this.prisma.setting.upsert({
      where: { id: SINGLETON_ID },
      update: {
        address:
          dto.address !== undefined
            ? (dto.address ?? null)
            : (existing?.address ?? null),
        phone:
          dto.phone !== undefined
            ? (dto.phone ?? null)
            : (existing?.phone ?? null),
        email:
          dto.email !== undefined
            ? (dto.email ?? null)
            : (existing?.email ?? null),
        logoUrl,
        mobileRepairingCourse,
        englishSpeakingCourse,
      },
      create: {
        id: SINGLETON_ID,
        address: dto.address ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        logoUrl,
        mobileRepairingCourse,
        englishSpeakingCourse,
      },
    });
  }
}
