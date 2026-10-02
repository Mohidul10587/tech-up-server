import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';

@Injectable()
export class BatchService {
  constructor(private readonly prisma: PrismaService) {}

  /** All batches, ordered numerically by name (1, 2, 3, …, 10, 11, …). */
  async list() {
    const batches = await this.prisma.batch.findMany({
      orderBy: { name: 'asc' },
    });
    // Sort numerically since the column is a string.
    return batches.sort((a, b) => Number(a.name) - Number(b.name));
  }

  /** Creates a batch. Rejects duplicates. */
  async create(dto: CreateBatchDto) {
    const existing = await this.prisma.batch.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Batch ${dto.name} already exists.`);
    }
    return this.prisma.batch.create({
      data: { name: dto.name },
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
   * All students belonging to the given batch (matched on batchNo == batch.name).
   * Returns the same shape as the general student list.
   */
  async listStudents(id: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    const students = await this.prisma.user.findMany({
      where: { role: 'STUDENT', batchNo: batch.name },
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
