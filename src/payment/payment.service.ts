import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Verifies the student exists and has STUDENT role; throws 404 otherwise. */
  private async findStudentOrThrow(studentId: string) {
    const student = await this.prisma.user.findFirst({
      where: { id: studentId, role: Role.STUDENT },
      select: { id: true, courseFee: true },
    });
    if (!student) throw new NotFoundException('Student not found.');
    return student;
  }

  /** All payments for a student, most recent first. */
  async list(studentId: string) {
    const student = await this.findStudentOrThrow(studentId);

    const payments = await this.prisma.payment.findMany({
      where: { studentId },
      orderBy: { paidAt: 'desc' },
      select: {
        id: true,
        amount: true,
        note: true,
        paidAt: true,
        createdAt: true,
      },
    });

    const courseFee = student.courseFee ?? 0;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      courseFee,
      totalPaid,
      due: Math.max(0, courseFee - totalPaid),
      payments,
    };
  }

  /** Records a new payment for a student. */
  async create(studentId: string, dto: CreatePaymentDto) {
    await this.findStudentOrThrow(studentId);

    if (dto.amount <= 0) {
      throw new BadRequestException('amount must be a positive integer.');
    }

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    if (isNaN(paidAt.getTime())) {
      throw new BadRequestException('paidAt must be a valid ISO date string.');
    }

    return this.prisma.payment.create({
      data: {
        studentId,
        amount: dto.amount,
        note: dto.note?.trim() || null,
        paidAt,
      },
      select: {
        id: true,
        amount: true,
        note: true,
        paidAt: true,
        createdAt: true,
      },
    });
  }

  /** Deletes a single payment row. */
  async remove(studentId: string, paymentId: string) {
    await this.findStudentOrThrow(studentId);

    const existing = await this.prisma.payment.findFirst({
      where: { id: paymentId, studentId },
    });
    if (!existing) throw new NotFoundException('Payment not found.');

    await this.prisma.payment.delete({ where: { id: paymentId } });
    return { deleted: true, id: paymentId };
  }
}
