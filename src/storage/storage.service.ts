import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  extensionForMime,
  STUDENT_IMAGE_FIELDS,
  StudentImageUrls,
} from '../upload/upload.constants';
import { STORAGE_PROVIDER } from './storage.provider';
import type { StorageProvider } from './storage.provider';

/** Application-facing storage layer. It contains no Cloudinary/MinIO details. */
@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: StorageProvider,
  ) {}

  async uploadStudentImages(
    files?: Record<string, Express.Multer.File[]>,
  ): Promise<StudentImageUrls> {
    const urls: StudentImageUrls = {};
    if (!files) return urls;

    for (const field of STUDENT_IMAGE_FIELDS) {
      const file = files[field]?.[0];
      if (!file) continue;

      const extension = extensionForMime(file.mimetype);
      const key = `student-images/${Date.now()}-${randomBytes(12).toString('hex')}${extension}`;
      urls[field] = await this.provider.upload({
        buffer: file.buffer,
        contentType: file.mimetype,
        key,
      });
    }

    return urls;
  }
}
