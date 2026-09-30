import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { join } from 'path';

/**
 * Multipart field names accepted by the student image upload endpoint.
 *
 * These match the `User` columns one-to-one, so the client can POST a file under
 * the field name and get back the same name mapped to a stored URL.
 */
export const STUDENT_IMAGE_FIELDS = [
  'studentPhoto',
  'studentNidFrontImage',
  'studentNidBackImage',
  'guardianNidFrontImage',
  'guardianNidBackImage',
] as const;

export type StudentImageField = (typeof STUDENT_IMAGE_FIELDS)[number];

/** Response shape: `{ studentPhoto: "https://...", ... }` (absent if skipped). */
export type StudentImageUrls = Partial<Record<StudentImageField, string>>;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

/** 5 MB per file. Large enough for a phone photo, small enough to bound disk use. */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Read-only compatibility path for images uploaded before provider storage was
 * introduced. New uploads never write here, but keeping it mounted avoids
 * breaking existing database URLs such as `/uploads/legacy-photo.jpg`.
 */
export const LEGACY_UPLOAD_DESTINATION =
  process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
export const LEGACY_UPLOAD_PUBLIC_PREFIX = '/uploads';

/** Only trusted MIME types are mapped to extensions; user filenames are ignored. */
export function extensionForMime(mimetype: string): string {
  switch (mimetype) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      throw new BadRequestException(
        `Unsupported image type "${mimetype}". Allowed: JPEG, PNG, WebP.`,
      );
  }
}

/**
 * Files stay in memory only for the duration of the request. `StorageService`
 * then sends each buffer to the configured provider, so no provider-specific
 * disk path leaks into the controller or the rest of the application.
 */
export const studentImageUploadOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: STUDENT_IMAGE_FIELDS.length,
  },
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
};
