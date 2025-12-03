import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // 보안 헤더
  app.use(helmet());

  // CORS 설정
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL') || 'http://localhost:3001',
    credentials: true,
  });

  // 전역 Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API 프리픽스
  app.setGlobalPrefix('api');

  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
