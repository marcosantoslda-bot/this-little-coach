import { Body, Param, Query } from '@nestjs/common';
import type { ZodTypeAny } from 'zod';
import { uuidSchema } from '@tlc/shared';
import { ZodValidationPipe } from './zod-validation.pipe';

/** `@ZodBody(schema)` — corpo do pedido validado por Zod. */
export const ZodBody = <T extends ZodTypeAny>(schema: T): ParameterDecorator => Body(new ZodValidationPipe(schema));

/** `@ZodQuery(schema)` — query string validada/coagida por Zod. */
export const ZodQuery = <T extends ZodTypeAny>(schema: T): ParameterDecorator => Query(new ZodValidationPipe(schema));

/** `@ZodParam('id')` — parâmetro de rota validado (UUID por defeito). */
export const ZodParam = (name: string, schema: ZodTypeAny = uuidSchema): ParameterDecorator =>
  Param(name, new ZodValidationPipe(schema));
