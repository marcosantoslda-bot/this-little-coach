import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DEV_USER_HEADER } from './common/auth/supabase-jwt.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import type { Env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<Env, true>);
  const logger = new Logger('Bootstrap');

  const corsOrigins = config.get('CORS_ORIGINS', { infer: true });
  app.enableCors({ origin: corsOrigins ? corsOrigins.split(',').map((o) => o.trim()) : true, credentials: true });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('This Little Coach API')
    .setDescription('Fase 1 — perfis, catálogo, treinos, sessões e progresso')
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT do Supabase Auth' })
    .addApiKey({ type: 'apiKey', in: 'header', name: DEV_USER_HEADER, description: 'Bypass de dev (AUTH_DEV_BYPASS=true)' }, 'dev-user')
    .addSecurityRequirements('dev-user')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = config.get('API_PORT', { infer: true });
  await app.listen(port);
  logger.log(`API a escutar em http://localhost:${port} (docs em /docs)`);
}

void bootstrap();
