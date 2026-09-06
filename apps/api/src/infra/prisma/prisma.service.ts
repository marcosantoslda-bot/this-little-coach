import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@tlc/database';

/**
 * PrismaClient gerido pelo ciclo de vida do Nest: liga no arranque e
 * desliga no shutdown (requer `app.enableShutdownHooks()` em main.ts).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Ligação à base de dados estabelecida');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
