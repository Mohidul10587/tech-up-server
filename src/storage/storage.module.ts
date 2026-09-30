import { Module } from '@nestjs/common';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';
import { MinioStorageProvider } from './minio-storage.provider';
import { STORAGE_PROVIDER, StorageProvider } from './storage.provider';
import { StorageService } from './storage.service';

function createStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER?.trim().toLowerCase();
  if (provider === 'cloudinary') return new CloudinaryStorageProvider();
  if (provider === 'minio') return new MinioStorageProvider();
  throw new Error(
    'STORAGE_PROVIDER must be set to either "cloudinary" or "minio".',
  );
}

@Module({
  providers: [
    StorageService,
    { provide: STORAGE_PROVIDER, useFactory: createStorageProvider },
  ],
  exports: [StorageService],
})
export class StorageModule {}
