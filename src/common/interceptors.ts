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
import { db } from '../store/data';

function changedCollections(path: string): (keyof typeof db)[] {
  if (path === '/auth/change-password') return ['users'];
  if (path.startsWith('/auth/')) return [];
  if (path.startsWith('/checkpoint-users')) return ['checkpointUsers'];
  if (path.startsWith('/narration')) return ['narration'];
  if (path.startsWith('/other-vehicles')) return ['otherVehicles'];
  if (path.startsWith('/vehicle-owners')) return ['vehicleOwners'];
  if (path.startsWith('/vehicles')) return ['vehicles'];
  if (path.startsWith('/queues/pending/') && path.endsWith('/approve')) return ['queues', 'pendingQueues'];
  if (path.startsWith('/queues/pending/')) return ['pendingQueues'];
  if (path.startsWith('/queues')) return ['queues'];
  return Object.keys(db).filter((key) => key !== 'sessions') as (keyof typeof db)[];
}

/** Wrap successful responses as { data: T } or leave paginated as-is */
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly neonStore: NeonStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
    const path = String(request.originalUrl ?? request.url).split('?')[0].replace(/^\/api/, '');
    return next.handle().pipe(
      // Persist successful mutations before the response is sent.
      mergeMap(async (body) => {
        if (isWrite) await this.neonStore.persist(changedCollections(path));
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
