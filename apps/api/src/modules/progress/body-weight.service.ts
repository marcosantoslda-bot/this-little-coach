import { Injectable } from '@nestjs/common';
import { toNumber } from '../../common/mapping/primitives';
import { UsersRepository } from '../users/users.repository';
import { ProgressRepository } from './progress.repository';

/**
 * Peso corporal de referência: última medição com peso, senão o peso inicial
 * do perfil, senão `null` (quem chama decide o fallback, ex.: 70 kg nas calorias).
 */
@Injectable()
export class BodyWeightService {
  constructor(
    private readonly progress: ProgressRepository,
    private readonly users: UsersRepository,
  ) {}

  async resolve(userId: string): Promise<number | null> {
    const latest = await this.progress.findLatestWeight(userId);
    if (latest?.weightKg) return toNumber(latest.weightKg);
    const profile = await this.users.findProfile(userId);
    return toNumber(profile?.startingWeightKg);
  }
}
