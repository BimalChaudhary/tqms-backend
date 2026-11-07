"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = exports.EnvelopeInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let EnvelopeInterceptor = class EnvelopeInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.map)((body) => {
            if (body === undefined || body === null)
                return body;
            if (typeof body === 'object' && ('data' in body || 'meta' in body))
                return body;
            return { data: body };
        }));
    }
};
exports.EnvelopeInterceptor = EnvelopeInterceptor;
exports.EnvelopeInterceptor = EnvelopeInterceptor = __decorate([
    (0, common_1.Injectable)()
], EnvelopeInterceptor);
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errors;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const resp = exception.getResponse();
            if (typeof resp === 'string') {
                message = resp;
            }
            else if (typeof resp === 'object' && resp !== null) {
                const r = resp;
                message = r.message ?? message;
                if (Array.isArray(r.message))
                    message = r.message.join(', ');
                errors = r.errors;
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        res.status(status).json({ message, ...(errors ? { errors } : {}) });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=interceptors.js.map