import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { UploadController } from './upload.controller';

/**
 * Image upload endpoints.
 *
 * Declared after `AuthModule` so it can inject `AuthService` for the
 * admin-only guard on every route.
 */
@Module({
  imports: [AuthModule, StorageModule],
  controllers: [UploadController],
})
export class UploadModule {}
