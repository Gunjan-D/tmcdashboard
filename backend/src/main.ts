import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { cors: false });

  // CORS – allow Angular dev server and Apache-served frontend
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:80'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation / transformation pipe (mirrors Bean Validation in Java)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger / OpenAPI documentation (analogous to Javadoc + Postman collection)
  const config = new DocumentBuilder()
    .setTitle('DE TMC REST API')
    .setDescription(
      'Delaware Department of Transportation – Traffic Management Center Operations API.\n\n' +
        'Provides real-time incident management, ITS device monitoring, scheduled reporting, ' +
        'and WebSocket push notifications for the 24×7 TMC operations team.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('auth', 'Authentication & LDAP integration')
    .addTag('incidents', 'Traffic incident lifecycle management')
    .addTag('devices', 'ITS device health & SNMP monitoring')
    .addTag('reports', 'Excel & PDF report generation')
    .addTag('scheduler', 'Automated scheduled jobs (Quartz equivalent)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`DE TMC Backend listening on http://localhost:${port}`);
  logger.log(`Swagger UI available at http://localhost:${port}/api/docs`);
  logger.log(`WebSocket gateway active on ws://localhost:${port}`);
}

bootstrap();
