import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';
import * as bcrypt          from 'bcrypt';
import { Family }           from './family.entity';

@Injectable()
export class FamiliesService {
  constructor(@InjectRepository(Family) private repo: Repository<Family>) {}

  async register(email: string, password: string) {
    const exists = await this.repo.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email déjà utilisé');
    const passwordHash = await bcrypt.hash(password, 12);
    return this.repo.save(this.repo.create({ email, passwordHash }));
  }
}
