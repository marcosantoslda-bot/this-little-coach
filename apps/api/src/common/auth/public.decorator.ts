import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'tlc:isPublic';

/** Marca um handler/controlador como acessível sem autenticação. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
