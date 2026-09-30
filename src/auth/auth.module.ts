import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  AtLeastOneIdentifierConstraint,
  StringOrUndefinedConstraint,
} from './dto/student-profile.dto';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AtLeastOneIdentifierConstraint,
    StringOrUndefinedConstraint,
  ],
  // Exported so UploadModule can reuse the admin guard for its endpoints.
  exports: [AuthService],
})
export class AuthModule {}
