import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Family } from './family.entity';
import { Child } from '../children/child.entity';

@Injectable()
export class FamiliesService {
  constructor(
    @InjectRepository(Family) private repo: Repository<Family>,
    private ds: DataSource,
  ) {}

  async register(email: string, password: string, name?: string) {
    const exists = await this.repo.findOne({ where: { email } });
    if (exists) throw new ConflictException('Email déjà utilisé');
    const passwordHash = await bcrypt.hash(password, 12);
    return this.repo.save(this.repo.create({ email, passwordHash, name }));
  }

  async findById(id: string) {
    const family = await this.repo.findOne({ where: { id }, relations: ['children'] });
    if (!family) throw new NotFoundException('Famille introuvable');
    return family;
  }

  async getMe(familyId: string) {
    const family = await this.repo.findOne({
      where: { id: familyId },
      relations: ['children'],
      select: ['id', 'email', 'timezone', 'createdAt'],
    });
    if (!family) throw new NotFoundException();
    return family;
  }

  async updateProfile(familyId: string, dto: { email?: string; timezone?: string }) {
    const family = await this.repo.findOneOrFail({ where: { id: familyId } });
    if (dto.email && dto.email !== family.email) {
      const exists = await this.repo.findOne({ where: { email: dto.email } });
      if (exists) throw new ConflictException('Email déjà utilisé');
      family.email = dto.email;
    }
    if (dto.timezone) family.timezone = dto.timezone;
    return this.repo.save(family);
  }

  async changePassword(familyId: string, currentPassword: string, newPassword: string) {
    const family = await this.repo.findOneOrFail({ where: { id: familyId } });
    const valid = await bcrypt.compare(currentPassword, family.passwordHash);
    if (!valid) throw new UnauthorizedException('Mot de passe actuel incorrect');
    family.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.repo.save(family);
    return { message: 'Mot de passe mis à jour' };
  }

  async deleteAccount(familyId: string) {
    // Cascade deletes children, tasks, rewards, transactions via FK
    await this.repo.delete(familyId);
    return { message: 'Compte supprimé' };
  }
}
