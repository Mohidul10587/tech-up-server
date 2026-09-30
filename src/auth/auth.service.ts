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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
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
      accessToken: await this.jwt.signAsync({ sub: user.id, role: user.role }),
      user: { id: user.id, phone: user.phone, role: user.role },
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
    // `customUserId` is intentionally omitted: PostgreSQL fills it from the one
    // global sequence via the column default, so concurrent creates can never
    // collide and no read-then-write race exists.
    const user = await this.prisma.user.create({
      data: {
        phone,
        passwordHash,
        role: Role.STUDENT,
        ...profile,
      },
    });

    return {
      id: user.id,
      customUserId: user.customUserId,
      phone: user.phone,
      role: user.role,
      batchNo: user.batchNo,
      fullName: user.fullName,
      courseName: user.courseName,
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

  /**
   * Shared projection for list endpoints.
   *
   * `passwordHash` is NEVER selected - returning it would leak every account's
   * credentials to the admin panel and into any client bundle that renders the
   * response. Fields are listed explicitly rather than spreading the row.
   */
  private static readonly LIST_SELECT = {
    id: true,
    customUserId: true,
    phone: true,
    role: true,
    createdAt: true,
    batchNo: true,
    fullName: true,
    courseName: true,
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

  /** All students, newest first. */
  async listStudents() {
    return this.prisma.user.findMany({
      where: { role: Role.STUDENT },
      select: AuthService.LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    });
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
   */
  async updateStudent(id: string, dto: UpdateStudentDto) {
    await this.findStudentOrThrow(id);

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

    return this.prisma.user.update({
      where: { id },
      data,
      select: AuthService.LIST_SELECT,
    });
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
