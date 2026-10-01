import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly payments: PaymentService,
    private readonly auth: AuthService,
  ) {}

  private async guard(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    await this.auth.getAdminFromToken(token);
  }

  /** GET /payments/students/:studentId */
  @Get('students/:studentId')
  async list(
    @Param('studentId') studentId: string,
    @Headers('authorization') authorization?: string,
  ) {
    await this.guard(authorization);
    return this.payments.list(studentId);
  }

  /** POST /payments/students/:studentId */
  @Post('students/:studentId')
  async create(
    @Param('studentId') studentId: string,
    @Body() dto: CreatePaymentDto,
    @Headers('authorization') authorization?: string,
  ) {
    await this.guard(authorization);
    return this.payments.create(studentId, dto);
  }

  /** DELETE /payments/students/:studentId/:paymentId */
  @Delete('students/:studentId/:paymentId')
  async remove(
    @Param('studentId') studentId: string,
    @Param('paymentId') paymentId: string,
    @Headers('authorization') authorization?: string,
  ) {
    await this.guard(authorization);
    return this.payments.remove(studentId, paymentId);
  }
}
