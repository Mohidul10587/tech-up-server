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
import { BatchService } from './batch.service';
import { AuthService } from '../auth/auth.service';
import { CreateBatchDto } from './dto/create-batch.dto';

@Controller('batches')
export class BatchController {
  constructor(
    private readonly batches: BatchService,
    private readonly auth: AuthService,
  ) {}

  private async requireAdmin(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    await this.auth.getAdminFromToken(token);
  }

  /** Public: the dropdown on the student registration form needs this. */
  @Get()
  list() {
    return this.batches.list();
  }

  /** Admin-only: creates a batch. */
  @Post()
  async create(
    @Body() dto: CreateBatchDto,
    @Headers('authorization') authorization?: string,
  ) {
    await this.requireAdmin(authorization);
    return this.batches.create(dto);
  }

  /** Admin-only: deletes a batch by id. */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    await this.requireAdmin(authorization);
    return this.batches.remove(id);
  }

  /** Admin-only: lists all students in a batch. */
  @Get(':id/students')
  async listStudents(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    await this.requireAdmin(authorization);
    return this.batches.listStudents(id);
  }
}
