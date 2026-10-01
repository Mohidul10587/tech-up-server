import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
