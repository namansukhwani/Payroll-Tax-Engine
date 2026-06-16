import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';
import { ErrorCode } from '../constants/error-codes.constant';
import { createErrorResponse, FieldError } from '../dto/api-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.INTERNAL_ERROR;
    let message = 'Internal server error';
    let details: FieldError[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const res = exceptionResponse as Record<string, unknown>;

        if (Array.isArray(res['message'])) {
          const messages = res['message'] as (string | ValidationError)[];
          const firstMsg = messages[0];

          if (typeof firstMsg === 'string') {
            code = ErrorCode.VALIDATION_ERROR;
            message = 'Validation failed';
            details = messages
              .filter((m): m is string => typeof m === 'string')
              .map((m) => ({ field: '', message: m }));
          } else if (
            firstMsg &&
            typeof firstMsg === 'object' &&
            'constraints' in firstMsg
          ) {
            code = ErrorCode.VALIDATION_ERROR;
            message = 'Validation failed';
            details = this.flattenValidationErrors(
              messages as ValidationError[],
            );
          }
        } else if (typeof res['message'] === 'string') {
          message = res['message'];
          code = (res['error'] as ErrorCode) ?? code;
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }

      const logContext = `${request.method} ${request.url} → ${status} [${code}]`;
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(logContext, exception.stack);
      } else {
        this.logger.warn(`${logContext}: ${message}`);
      }
    } else {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(createErrorResponse(code, message, details));
  }

  private flattenValidationErrors(errors: ValidationError[]): FieldError[] {
    const result: FieldError[] = [];
    for (const error of errors) {
      if (error.constraints) {
        for (const msg of Object.values(error.constraints)) {
          result.push({ field: error.property, message: msg });
        }
      }
      if (error.children?.length) {
        result.push(...this.flattenValidationErrors(error.children));
      }
    }
    return result;
  }
}
