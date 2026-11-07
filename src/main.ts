import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";
import session from "express-session";
import { ValidationPipe } from "@nestjs/common";
import {
  AllExceptionsFilter,
  EnvelopeInterceptor,
} from "./common/interceptors";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProd = process.env.NODE_ENV === "production";

  app.use(cookieParser());
  app.use(
    session({
      name: "tqms_sid",
      secret: process.env.SESSION_SECRET || "tqms-dev-secret-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        // Cross-site (Vercel → Render) needs none + secure
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
      },
    }),
  );

  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://tqms-frontend.vercel.app", // NO trailing slash
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new EnvelopeInterceptor());

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`TQMS backend running on http://localhost:${port}/api`);
  console.log(`Login: checkpoint@tqms.local / password123`);
}
bootstrap();
