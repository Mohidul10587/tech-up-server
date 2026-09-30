import { ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { StorageProvider, StorageUpload } from './storage.provider';

/** Cloudinary implementation used by Render/testing deployments. */
export class CloudinaryStorageProvider implements StorageProvider {
  private readonly folder =
    process.env.CLOUDINARY_FOLDER || 'gsm-tech/students';

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Cloudinary storage requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  upload(file: StorageUpload): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          resource_type: 'image',
          public_id: file.key.replace(/\.[^.]+$/, ''),
          overwrite: false,
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(
              new ServiceUnavailableException(
                'Unable to upload the image to Cloudinary.',
              ),
            );
            return;
          }
          resolve(result.secure_url);
        },
      );
      stream.end(file.buffer);
    });
  }
}
