import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { setDefaultResultOrder } from 'dns';
import { AppModule } from './app.module';

async function bootstrap() {
  setDefaultResultOrder('ipv4first');

  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3001;

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false,
  });

  const config = new DocumentBuilder()
    .setTitle('IA Agente Backend')
    .setDescription('Endpoints del agente IA')
    .setVersion('1.0')
    .addServer(`http://localhost:${port}`, 'Servidor Local')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa el token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor ejecutándose en el puerto ${port} on http://localhost:${port}`);
    console.log(`Swagger disponible en http://localhost:${port}/api/docs`);
  });
}
bootstrap();