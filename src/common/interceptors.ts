import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { NeonStore } from '../store/neon.service';

/** Wrap successful responses as { data: T } or leave paginated as-is */
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly neonStore: NeonStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    return next.handle().pipe(
      // Persist successful mutations before the response is sent.
      mergeMap(async (body) => {
        if (isWrite) await this.neonStore.persist();
        if (body === undefined || body === null) return body;
        // Already has data/meta (paginated or single)
        if (typeof body === 'object' && ('data' in body || 'meta' in body)) return body;
        // Plain array or object → wrap
        return { data: body };
      }),
    );
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Record<string, string> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (typeof resp === 'object' && resp !== null) {
        const r = resp as any;
        message = r.message ?? message;
        if (Array.isArray(r.message)) message = r.message.join(', ');
        errors = r.errors;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    res.status(status).json({ message, ...(errors ? { errors } : {}) });
  }
}
