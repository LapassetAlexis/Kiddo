import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Family } from './family.entity';
import { ParentAccount } from './parent-account.entity';

@Injectable()
export class FamiliesService {
  constructor(
    @InjectRepository(Family)        private repo:     Repository<Family>,
    @InjectRepository(ParentAccount) private accounts: Repository<ParentAccount>,
  ) {}

  async findById(id: string) {
    const family = await this.repo.findOne({ where: { id }, relations: ['children'] });
    if (!family) throw new NotFoundException('Famille introuvable');
    return family;
  }

  async getMe(accountId: string) {
    const account = await this.accounts.findOne({
      where: { id: accountId },
      relations: ['family', 'family.children'],
    });
    if (!account) throw new NotFoundException();
    return {
      id:         account.id,
      email:      account.email,
      familyId:   account.family.id,
      name:       account.family.name,
      timezone:   account.family.timezone,
      inviteCode: account.family.inviteCode,
      children:   account.family.children.map(c => ({ id: c.id, name: c.name, avatar: c.avatar, color: c.color })),
    };
  }

  async updateProfile(accountId: string, dto: { name?: string; email?: string; timezone?: string }) {
    const account = await this.accounts.findOneOrFail({ where: { id: accountId }, relations: ['family'] });

    if (dto.email && dto.email !== account.email) {
      const exists = await this.accounts.findOne({ where: { email: dto.email } });
      if (exists) throw new ConflictException('Email déjà utilisé');
      await this.accounts.update(accountId, { email: dto.email });
    }

    if (dto.name !== undefined || dto.timezone !== undefined) {
      const familyUpdate: Partial<Family> = {};
      if (dto.name !== undefined) familyUpdate.name = dto.name;
      if (dto.timezone) familyUpdate.timezone = dto.timezone;
      await this.repo.update(account.family.id, familyUpdate);
    }

    return this.getMe(accountId);
  }

  async changePassword(accountId: string, currentPassword: string, newPassword: string) {
    const account = await this.accounts.findOneOrFail({ where: { id: accountId } });
    const valid = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!valid) throw new UnauthorizedException('Mot de passe actuel incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.accounts.update(accountId, { passwordHash });
    return { message: 'Mot de passe mis à jour' };
  }

  async deleteAccount(accountId: string) {
    const account = await this.accounts.findOneOrFail({ where: { id: accountId }, relations: ['family'] });
    const familyId = account.family.id;
    const siblingCount = await this.accounts.count({ where: { family: { id: familyId } } });
    if (siblingCount <= 1) {
      // Last parent — delete the whole family (cascades children/tasks/rewards)
      await this.repo.delete(familyId);
    } else {
      // Co-parent leaving — only remove their account
      await this.accounts.delete(accountId);
    }
    return { message: 'Compte supprimé' };
  }

  async registerFcmToken(accountId: string, token: string) {
    await this.accounts.update(accountId, { fcmToken: token });
  }

  async getFamilyParentTokens(familyId: string): Promise<string[]> {
    const accounts = await this.accounts.find({ where: { family: { id: familyId } } });
    return accounts.map(a => a.fcmToken).filter(Boolean) as string[];
  }
}
