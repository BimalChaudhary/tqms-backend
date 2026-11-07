import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";
import session from "express-session";
import { ValidationPipe } from "@nestjs/common";
import {
  AllExceptionsFilter,
  EnvelopeInterceptor,
} from "./common/interceptors";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Required on Render so secure cookies work behind the proxy
  app.set("trust proxy", 1);

  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set in production");
  }

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
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
      },
    }),
  );

  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://tqms-frontend.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new EnvelopeInterceptor());

  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`Server running on port ${port}`);
}
bootstrap();
