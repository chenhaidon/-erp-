import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./modules/app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") ?? 3000;
  const webOrigin = configService.get<string>("WEB_ORIGIN");

  app.enableCors({
    origin: webOrigin ? webOrigin.split(",").map((origin) => origin.trim()) : true
  });

  await app.listen(port);
}

bootstrap();
