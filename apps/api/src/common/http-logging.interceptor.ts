import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly log = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = ctx.switchToHttp().getResponse<Response>();
          this.log.log(`${method} ${url} ${res.statusCode} +${Date.now() - start}ms`);
        },
        error: (err: Error & { status?: number }) => {
          const status = err.status ?? 500;
          this.log.error(`${method} ${url} ${status} +${Date.now() - start}ms — ${err.message}`);
        },
      }),
    );
  }
}
