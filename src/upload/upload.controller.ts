import {
  Controller,
  Headers,
  Post,
  UploadedFiles,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from '../auth/auth.service';
import { StorageService } from '../storage/storage.service';
import {
  STUDENT_IMAGE_FIELDS,
  studentImageUploadOptions,
} from './upload.constants';

/**
 * Admin-only image upload.
 *
 * The five student images are uploaded first, and the returned URLs are then
 * submitted as part of the student payload (see `CreateStudentDto`). Keeping
 * upload separate from creation means the text form can still be validated as
 * JSON, and a rejected registration never leaves orphaned rows in the database.
 */
@Controller('uploads')
export class UploadController {
  constructor(
    private readonly auth: AuthService,
    private readonly storage: StorageService,
  ) {}

  @Post('student-images')
  @UseInterceptors(
    FileFieldsInterceptor(
      STUDENT_IMAGE_FIELDS.map((field) => ({ name: field, maxCount: 1 })),
      studentImageUploadOptions,
    ),
  )
  async uploadStudentImages(
    @UploadedFiles()
    files: Record<string, Express.Multer.File[]>,
    @Headers('authorization') authorization?: string,
  ) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    await this.auth.getAdminFromToken(token);

    return { urls: await this.storage.uploadStudentImages(files) };
  }
}
