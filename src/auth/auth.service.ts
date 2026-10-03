import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { STUDENT_PROFILE_FIELDS } from './dto/student-profile.dto';
import {
  UPDATABLE_STUDENT_FIELDS,
  UpdateStudentDto,
} from './dto/update-student.dto';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly settings: SettingsService,
  ) {}

  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (
      !user ||
      user.role !== Role.ADMIN ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid phone number or password.');
    }

    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, role: user.role, name: user.fullName ?? user.phone }),
      user: { id: user.id, phone: user.phone, role: user.role, name: user.fullName ?? user.phone },
    };
  }

  async getAdminFromToken(token: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; role: Role }>(
        token,
      );
      if (payload.role !== Role.ADMIN) throw new UnauthorizedException();

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || user.role !== Role.ADMIN) throw new UnauthorizedException();
      return { id: user.id, phone: user.phone, role: user.role };
    } catch {
      throw new UnauthorizedException();
    }
  }

  /**
   * Registers a student. The phone number is the login id AND the password by
   * default, so the stored hash is derived from the phone rather than from any
   * value supplied by the form. The caller is responsible for authorising the
   * request (see the controller).
   */
  async createStudent(dto: CreateStudentDto) {
    const phone = dto.phone.trim();

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException(
        'A user with this phone number already exists.',
      );
    }

    // Normalise empty optional strings to undefined so they are stored as NULL
    // instead of empty strings.
    const profile: Record<string, string> = {};
    const source = dto as unknown as Record<string, unknown>;
    for (const field of STUDENT_PROFILE_FIELDS) {
      const value = source[field];
      if (typeof value === 'string' && value.trim().length > 0) {
        profile[field] = value.trim();
      }
    }

    const passwordHash = await bcrypt.hash(phone, 10);

    // Snapshot the current course fee from settings so that a later fee change
    // does not silently alter this student's due balance.
    // Fee is read from the JSON course objects: mobileRepairingCourse.presentFee
    // or englishSpeakingCourse.presentFee.
    let courseFee: number | undefined;
    if (profile.courseName) {
      const settings = await this.settings.get();
      const courseJson =
        profile.courseName === 'Mobile Repairing'
          ? (settings as Record<string, unknown>).mobileRepairingCourse
          : profile.courseName === 'English Speaking'
            ? (settings as Record<string, unknown>).englishSpeakingCourse
            : undefined;
      if (courseJson && typeof courseJson === 'object' && courseJson !== null) {
        const fee = (courseJson as Record<string, unknown>).presentFee;
        if (typeof fee === 'number' && fee > 0) courseFee = fee;
      }
    }

    // Generate studentId: {batchNo}-{serial}, e.g. 5-01, 5-02, 10-01, 10-02.
    // Serial is per-batch, starting at 01. If no batchNo, studentId stays null.
    let studentId: string | undefined;
    const batchNo = profile.batchNo;
    if (batchNo) {
      // Find the highest existing serial for this batch.
      // All studentIds that start with "{batchNo}-" are considered.
      const prefix = `${batchNo}-`;
      const existing = await this.prisma.user.findMany({
        where: {
          role: Role.STUDENT,
          studentId: { startsWith: prefix },
        },
        select: { studentId: true },
      });

      // Extract the numeric suffix (the serial part after "{batchNo}-").
      let maxSerial = 0;
      for (const row of existing) {
        if (!row.studentId) continue;
        const suffix = row.studentId.slice(prefix.length);
        const n = parseInt(suffix, 10);
        if (!isNaN(n) && n > maxSerial) maxSerial = n;
      }

      const nextSerial = maxSerial + 1;
      // Pad serial to at least 2 digits: 01, 02, … 09, 10, 11, … 100, 101
      const serialStr = nextSerial < 10 ? `0${nextSerial}` : `${nextSerial}`;
      studentId = `${prefix}${serialStr}`;
    }

    const user = await this.prisma.user.create({
      data: {
        phone,
        passwordHash,
        role: Role.STUDENT,
        ...(studentId !== undefined ? { studentId } : {}),
        ...(courseFee !== undefined ? { courseFee } : {}),
        ...profile,
      },
    });

    return this.formatStudent(user);
  }

  /**
   * Shared projection for list endpoints.
   *
   * `passwordHash` is NEVER selected - returning it would leak every account's
   * credentials to the admin panel and into any client bundle that renders the
   * response. Fields are listed explicitly rather than spreading the row.
   */
  private static readonly LIST_SELECT = {
    id: true,
    studentId: true,
    phone: true,
    role: true,
    createdAt: true,
    batchNo: true,
    fullName: true,
    courseName: true,
    courseFee: true,
    fatherName: true,
    motherName: true,
    presentAddress: true,
    permanentAddress: true,
    occupation: true,
    guardianPhone: true,
    email: true,
    nidNumber: true,
    birthRegistrationNumber: true,
    studentPhoto: true,
    studentNidFrontImage: true,
    studentNidBackImage: true,
    guardianNidFrontImage: true,
    guardianNidBackImage: true,
  } as const;

  /** Formats a raw Prisma User row into the public student shape. */
  private formatStudent(user: {
    id: string;
    studentId: string | null;
    phone: string;
    role: string;
    batchNo: string | null;
    fullName: string | null;
    courseName: string | null;
    courseFee: number | null;
    fatherName: string | null;
    motherName: string | null;
    presentAddress: string | null;
    permanentAddress: string | null;
    occupation: string | null;
    guardianPhone: string | null;
    email: string | null;
    nidNumber: string | null;
    birthRegistrationNumber: string | null;
    studentPhoto: string | null;
    studentNidFrontImage: string | null;
    studentNidBackImage: string | null;
    guardianNidFrontImage: string | null;
    guardianNidBackImage: string | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      studentId: user.studentId,
      phone: user.phone,
      role: user.role,
      batchNo: user.batchNo,
      fullName: user.fullName,
      courseName: user.courseName,
      courseFee: user.courseFee,
      fatherName: user.fatherName,
      motherName: user.motherName,
      presentAddress: user.presentAddress,
      permanentAddress: user.permanentAddress,
      occupation: user.occupation,
      guardianPhone: user.guardianPhone,
      email: user.email,
      nidNumber: user.nidNumber,
      birthRegistrationNumber: user.birthRegistrationNumber,
      studentPhoto: user.studentPhoto,
      studentNidFrontImage: user.studentNidFrontImage,
      studentNidBackImage: user.studentNidBackImage,
      guardianNidFrontImage: user.guardianNidFrontImage,
      guardianNidBackImage: user.guardianNidBackImage,
      createdAt: user.createdAt,
    };
  }

  /** All students, optionally filtered by courseName, newest first. */
  async listStudents(courseName?: string) {
    const students = await this.prisma.user.findMany({
      where: {
        role: Role.STUDENT,
        ...(courseName ? { courseName } : {}),
      },
      select: {
        ...AuthService.LIST_SELECT,
        payments: { select: { amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return students.map(({ payments, ...s }) => ({
      ...s,
      totalPaid: payments.reduce((sum, p) => sum + p.amount, 0),
    }));
  }

  /**
   * Every user of every role. Read-only: there is deliberately no
   * `updateUser`/`deleteUser` pair, because non-student accounts are not
   * managed from this screen.
   */
  async listUsers() {
    return this.prisma.user.findMany({
      select: AuthService.LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Loads a student or throws 404. Guarantees callers never touch other roles. */
  private async findStudentOrThrow(id: string) {
    const student = await this.prisma.user.findFirst({
      where: { id, role: Role.STUDENT },
    });
    if (!student) {
      throw new NotFoundException('Student not found.');
    }
    return student;
  }

  /**
   * Edits a student.
   *
   * Semantics: an OMITTED key leaves the stored value untouched, while an
   * explicitly empty/whitespace string CLEARS it (stored as NULL). This is what
   * lets the admin form submit every field every time without blanking the
   * ones they left alone.
   *
   * If `batchNo` is changed, a new `studentId` is automatically generated for
   * the new batch (same {batchNo}{serial} format as on create), so the ID
   * always reflects the student's current batch.
   */
  async updateStudent(id: string, dto: UpdateStudentDto) {
    const current = await this.findStudentOrThrow(id);

    const data: Record<string, unknown> = {};
    const source = dto as unknown as Record<string, unknown>;

    for (const field of UPDATABLE_STUDENT_FIELDS) {
      if (!(field in source)) continue;
      const raw = source[field];
      data[field] =
        typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null;
    }

    // The phone number is the password, so changing one must change the other.
    if (dto.phone !== undefined) {
      const phone = dto.phone.trim();
      if (phone.length === 0) {
        throw new BadRequestException('phone cannot be empty.');
      }

      const clash = await this.prisma.user.findUnique({ where: { phone } });
      if (clash && clash.id !== id) {
        throw new ConflictException(
          'A user with this phone number already exists.',
        );
      }

      data.phone = phone;
      data.passwordHash = await bcrypt.hash(phone, 10);
    }

    // If batchNo is being changed, regenerate studentId for the new batch so
    // that the ID always starts with the correct batch number.
    if (dto.batchNo !== undefined) {
      const newBatchNo =
        typeof dto.batchNo === 'string' && dto.batchNo.trim().length > 0
          ? dto.batchNo.trim()
          : null;

      const batchChanged = newBatchNo !== (current.batchNo ?? null);

      if (batchChanged) {
        if (newBatchNo) {
          // Find the highest existing serial for the new batch (excluding this
          // student's current id so a re-assignment to same batch doesn't skip).
          const prefix = `${newBatchNo}-`;
          const existing = await this.prisma.user.findMany({
            where: {
              role: Role.STUDENT,
              studentId: { startsWith: prefix },
              NOT: { id },
            },
            select: { studentId: true },
          });

          let maxSerial = 0;
          for (const row of existing) {
            if (!row.studentId) continue;
            const suffix = row.studentId.slice(prefix.length);
            const n = parseInt(suffix, 10);
            if (!isNaN(n) && n > maxSerial) maxSerial = n;
          }

          const nextSerial = maxSerial + 1;
          const serialStr =
            nextSerial < 10 ? `0${nextSerial}` : `${nextSerial}`;
          data.studentId = `${prefix}${serialStr}`;
        } else {
          // batchNo cleared → clear studentId too
          data.studentId = null;
        }
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        ...AuthService.LIST_SELECT,
        payments: { select: { amount: true } },
      },
    });
    const { payments, ...rest } = updated;
    return {
      ...rest,
      totalPaid: payments.reduce((sum, p) => sum + p.amount, 0),
    };
  }

  /**
   * Deletes a student.
   *
   * The `role: STUDENT` filter is part of the WHERE clause, not a prior check:
   * it makes the delete itself refuse non-student rows, so a delete can never
   * race past a role change and remove an admin account.
   */
  async deleteStudent(id: string) {
    await this.prisma.user.deleteMany({ where: { id, role: Role.STUDENT } });
    return { deleted: true, id };
  }
}
