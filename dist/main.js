"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const common_1 = require("@nestjs/common");
const interceptors_1 = require("./common/interceptors");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, cookie_parser_1.default)());
    app.use((0, express_session_1.default)({
        name: 'tqms_sid',
        secret: 'tqms-dev-secret-change-in-prod',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
        },
    }));
    app.enableCors({
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    app.useGlobalFilters(new interceptors_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new interceptors_1.EnvelopeInterceptor());
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`TQMS backend running on http://localhost:${port}/api`);
    console.log(`Login: checkpoint@tqms.local / password123`);
}
bootstrap();
//# sourceMappingURL=main.js.map