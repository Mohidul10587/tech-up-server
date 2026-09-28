import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
}
