import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.phone, dto.password);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    return this.auth.getAdminFromToken(token);
  }

  /**
   * Admin-only: registers a student. The phone number doubles as the password,
   * so no password is accepted in the body.
   */
  @Post('students')
  async createStudent(
    @Body() dto: CreateStudentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    await this.auth.getAdminFromToken(token);
    return this.auth.createStudent(dto);
  }

  /** Admin-only: every student. */
  @Get('students')
  async listStudents(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    await this.auth.getAdminFromToken(token);
    return this.auth.listStudents();
  }

  /** Admin-only: every user, all roles. */
  @Get('users')
  async listUsers(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    await this.auth.getAdminFromToken(token);
    return this.auth.listUsers();
  }

  /** Admin-only: edits a student. */
  @Patch('students/:id')
  async updateStudent(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    await this.auth.getAdminFromToken(token);
    return this.auth.updateStudent(id, dto);
  }

  /** Admin-only: removes a student. */
  @Delete('students/:id')
  async deleteStudent(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    await this.auth.getAdminFromToken(token);
    return this.auth.deleteStudent(id);
  }
}
