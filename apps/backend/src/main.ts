import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS (Cross-Origin Resource Sharing) Etkinleştirme
  // Frontend uygulamasının (3001) backend (3000) ile konuşabilmesi için zorunludur [1]
  app.enableCors({
    origin: '*', // Geliştirme ortamında her yerden istek kabul eder (Production'da Next.js URL'i yazılmalıdır)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error('Error starting server:', err);
});