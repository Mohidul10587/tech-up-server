import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { BatchService } from './batch.service';
import { AuthService } from '../auth/auth.service';
import { CourseName, COURSE_NAMES, CreateBatchDto } from './dto/create-batch.dto';

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

  /**
   * Public: lists all batches, optionally filtered by ?courseName=
   * The student registration dropdown uses this.
   */
  @Get()
  list(@Query('courseName') courseName?: string) {
    const validated = COURSE_NAMES.includes(courseName as CourseName)
      ? (courseName as CourseName)
      : undefined;
    return this.batches.list(validated);
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
