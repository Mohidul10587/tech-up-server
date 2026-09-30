import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import {
  LEGACY_UPLOAD_DESTINATION,
  LEGACY_UPLOAD_PUBLIC_PREFIX,
} from './upload/upload.constants';

async function bootstrap() {
  // Keep legacy local URLs readable. New files are stored through
  // `StorageService` and never written to this directory.
  mkdirSync(LEGACY_UPLOAD_DESTINATION, { recursive: true });

  // Typed as the Express adapter so `useStaticAssets` is available.
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  });

  app.useStaticAssets(LEGACY_UPLOAD_DESTINATION, {
    prefix: `${LEGACY_UPLOAD_PUBLIC_PREFIX}/`,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 8000;

  await app.listen(port);

  logger.log(`🚀 Backend server running on port: ${port}`);
  logger.log(`🌐 URL: http://localhost:${port}`);
  logger.log(`🔧 Mode: ${process.env.NODE_ENV ?? 'development'}`);
}

bootstrap();
