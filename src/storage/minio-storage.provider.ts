import { ServiceUnavailableException } from '@nestjs/common';
import { Client } from 'minio';
import { StorageProvider, StorageUpload } from './storage.provider';

/** MinIO implementation reserved for the final VPS deployment. */
export class MinioStorageProvider implements StorageProvider {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private bucketReady?: Promise<void>;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT;
    const accessKey = process.env.MINIO_ACCESS_KEY;
    const secretKey = process.env.MINIO_SECRET_KEY;
    this.bucket = process.env.MINIO_BUCKET || '';
    this.publicUrl = (process.env.MINIO_PUBLIC_URL || '').replace(/\/+$/, '');

    if (
      !endpoint ||
      !accessKey ||
      !secretKey ||
      !this.bucket ||
      !this.publicUrl
    ) {
      throw new Error(
        'MinIO storage requires MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET and MINIO_PUBLIC_URL.',
      );
    }

    this.client = new Client({
      endPoint: endpoint,
      port: Number(process.env.MINIO_PORT || 9000),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey,
      secretKey,
    });
  }

  async upload(file: StorageUpload): Promise<string> {
    try {
      await this.ensureBucket();
      await this.client.putObject(
        this.bucket,
        file.key,
        file.buffer,
        file.buffer.length,
        {
          'Content-Type': file.contentType,
        },
      );
      return `${this.publicUrl}/${this.bucket}/${file.key}`;
    } catch {
      throw new ServiceUnavailableException(
        'Unable to upload the image to MinIO.',
      );
    }
  }

  private ensureBucket(): Promise<void> {
    if (!this.bucketReady) {
      this.bucketReady = this.ensureBucketOnce();
    }
    return this.bucketReady;
  }

  private async ensureBucketOnce(): Promise<void> {
    if (!(await this.client.bucketExists(this.bucket))) {
      await this.client.makeBucket(this.bucket);
    }
  }
}
