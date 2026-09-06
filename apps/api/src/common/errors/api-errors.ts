import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exceção HTTP cujo corpo já segue o `apiErrorSchema` de @tlc/shared
 * ({ statusCode, message, code?, details? }). O filtro global serializa-a tal e qual.
 */
export class ApiHttpException extends HttpException {
  constructor(status: HttpStatus, message: string, code?: string, details?: unknown) {
    super({ statusCode: status, message, ...(code ? { code } : {}), ...(details !== undefined ? { details } : {}) }, status);
  }
}

export const badRequest = (message: string, code = 'BAD_REQUEST', details?: unknown) =>
  new ApiHttpException(HttpStatus.BAD_REQUEST, message, code, details);

export const unauthorized = (message = 'Não autenticado', code = 'UNAUTHORIZED') =>
  new ApiHttpException(HttpStatus.UNAUTHORIZED, message, code);

export const notFound = (message = 'Recurso não encontrado', code = 'NOT_FOUND') =>
  new ApiHttpException(HttpStatus.NOT_FOUND, message, code);

export const conflict = (message: string, code = 'CONFLICT', details?: unknown) =>
  new ApiHttpException(HttpStatus.CONFLICT, message, code, details);

export const serviceUnavailable = (message: string, code = 'SERVICE_UNAVAILABLE') =>
  new ApiHttpException(HttpStatus.SERVICE_UNAVAILABLE, message, code);
