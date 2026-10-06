import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  UploadedFile,
  UploadedFiles,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from '../auth/auth.service';
import { StorageService } from '../storage/storage.service';
import {
  STUDENT_IMAGE_FIELDS,
  studentImageUploadOptions,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  extensionForMime,
} from './upload.constants';
import { memoryStorage } from 'multer';
import { randomBytes } from 'crypto';

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

  /** Admin-only: upload the site logo. Returns `{ logoUrl: "..." }`. */
  @Post('logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(
            new BadRequestException(
              `Unsupported image type "${file.mimetype}". Allowed: JPEG, PNG, WebP.`,
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Headers('authorization') authorization?: string,
  ) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException();
    await this.auth.getAdminFromToken(token);

    if (!file) throw new BadRequestException('No file provided.');

    const extension = extensionForMime(file.mimetype);
    const key = `logo/${Date.now()}-${randomBytes(8).toString('hex')}${extension}`;
    const logoUrl = await this.storage.uploadSingle(file, key);

    return { logoUrl };
  }
}
