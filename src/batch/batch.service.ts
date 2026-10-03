import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseName, CreateBatchDto } from './dto/create-batch.dto';

@Injectable()
export class BatchService {
  constructor(private readonly prisma: PrismaService) {}

  /** All batches, optionally filtered by courseName, ordered numerically. */
  async list(courseName?: CourseName) {
    const batches = await this.prisma.batch.findMany({
      where: courseName ? { courseName } : undefined,
      orderBy: { name: 'asc' },
    });
    return batches.sort((a, b) => Number(a.name) - Number(b.name));
  }

  /** Creates a batch. Rejects duplicate name+course combinations. */
  async create(dto: CreateBatchDto) {
    const existing = await this.prisma.batch.findUnique({
      where: { name_courseName: { name: dto.name, courseName: dto.courseName } },
    });
    if (existing) {
      throw new ConflictException(
        `Batch ${dto.name} already exists for ${dto.courseName}.`,
      );
    }
    return this.prisma.batch.create({
      data: { name: dto.name, courseName: dto.courseName },
    });
  }

  /** Deletes a batch by id. */
  async remove(id: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }
    await this.prisma.batch.delete({ where: { id } });
    return { deleted: true, id };
  }

  /**
   * All students belonging to the given batch.
   * Optionally filtered to only students of a specific course.
   */
  async listStudents(id: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    const students = await this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
        batchNo: batch.name,
        courseName: batch.courseName,
      },
      select: {
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
        payments: { select: { amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return students.map(({ payments, ...s }) => ({
      ...s,
      totalPaid: payments.reduce((sum, p) => sum + p.amount, 0),
    }));
  }
}
