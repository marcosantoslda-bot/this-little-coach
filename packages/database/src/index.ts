/**
 * Ponto de entrada do pacote @tlc/database.
 *
 * Expõe um único PrismaClient (singleton) para ser usado pela API.
 * Em desenvolvimento, o cliente é guardado em `globalThis` para evitar
 * múltiplas ligações durante hot-reload.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
