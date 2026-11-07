import { NestInterceptor, ExecutionContext, CallHandler, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class EnvelopeInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
export declare class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void;
}
