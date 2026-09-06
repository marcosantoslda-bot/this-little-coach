import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '@tlc/database';
import type { ApiError } from '@tlc/shared';

/**
 * Filtro global: todas as respostas de erro seguem o `apiErrorSchema`
 * ({ statusCode, message, code?, details? }). Erros inesperados são registados
 * e devolvidos como 500 sem expor detalhes internos.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const body = this.toApiError(exception);

    if (body.statusCode >= 500) {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${request.method} ${request.url} -> ${body.statusCode}`, stack);
    }

    response.status(body.statusCode).json(body);
  }

  private toApiError(exception: unknown): ApiError {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrismaError(exception);
    }
    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Erro interno', code: 'INTERNAL_ERROR' };
  }

  private fromHttpException(exception: HttpException): ApiError {
    const statusCode = exception.getStatus();
    const payload = exception.getResponse();
    if (typeof payload === 'string') {
      return { statusCode, message: payload };
    }
    const record = payload as Record<string, unknown>;
    const rawMessage = record.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join('; ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : exception.message;
    return {
      statusCode,
      message,
      ...(typeof record.code === 'string' ? { code: record.code } : {}),
      ...(record.details !== undefined ? { details: record.details } : {}),
    };
  }

  private fromPrismaError(error: Prisma.PrismaClientKnownRequestError): ApiError {
    switch (error.code) {
      case 'P2025':
        return { statusCode: HttpStatus.NOT_FOUND, message: 'Recurso não encontrado', code: 'NOT_FOUND' };
      case 'P2002':
        return { statusCode: HttpStatus.CONFLICT, message: 'Registo duplicado', code: 'CONFLICT' };
      case 'P2003':
        return { statusCode: HttpStatus.BAD_REQUEST, message: 'Referência inválida', code: 'INVALID_REFERENCE' };
      default:
        this.logger.error(`Prisma ${error.code}: ${error.message}`);
        return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Erro interno', code: 'INTERNAL_ERROR' };
    }
  }
}
