import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Family } from './family.entity';
import { ParentAccount } from './parent-account.entity';
import { formatName } from '../shared/format-name';

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
      id:                 account.id,
      email:              account.email,
      familyId:           account.family.id,
      name:               account.name,
      timezone:           account.family.timezone,
      inviteCode:         account.family.inviteCode,
      notifTaskSubmitted: account.notifTaskSubmitted,
      notifRewardClaimed: account.notifRewardClaimed,
      notifStreakAlert:   account.notifStreakAlert,
      children:           account.family.children.map(c => ({ id: c.id, name: c.name, avatar: c.avatar, color: c.color })),
    };
  }

  async updateProfile(accountId: string, dto: { name?: string; email?: string; timezone?: string }) {
    const account = await this.accounts.findOneOrFail({ where: { id: accountId }, relations: ['family'] });

    if (dto.email && dto.email !== account.email) {
      const exists = await this.accounts.findOne({ where: { email: dto.email } });
      if (exists) throw new ConflictException('Email déjà utilisé');
      await this.accounts.update(accountId, { email: dto.email });
    }

    if (dto.name !== undefined) {
      await this.accounts.update(accountId, { name: dto.name });
    }

    if (dto.timezone) {
      await this.repo.update(account.family.id, { timezone: dto.timezone });
    }

    return this.getMe(accountId);
  }

  async updateNotifPrefs(accountId: string, dto: {
    notifTaskSubmitted?: boolean;
    notifRewardClaimed?: boolean;
    notifStreakAlert?: boolean;
  }) {
    await this.accounts.update(accountId, dto);
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
    await this.repo.manager.transaction(async em => {
      const account = await em.findOne(ParentAccount, {
        where: { id: accountId },
        lock: { mode: 'pessimistic_write' },
        relations: ['family'],
      });
      if (!account) return;

      const familyId = account.family.id;
      const siblingCount = await em.count(ParentAccount, { where: { family: { id: familyId } } });

      if (siblingCount <= 1) {
        await em.delete(this.repo.target, familyId);
      } else {
        await em.delete(ParentAccount, accountId);
      }
    });
    return { message: 'Compte supprimé' };
  }

  async regenerateInviteCode(accountId: string) {
    const account = await this.accounts.findOneOrFail({ where: { id: accountId }, relations: ['family'] });
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await this.repo.update(account.family.id, { inviteCode });
    return this.getMe(accountId);
  }

  async listParents(familyId: string) {
    const accounts = await this.accounts.find({ where: { family: { id: familyId } } });
    return accounts.map(a => ({ id: a.id, name: a.name, email: a.email }));
  }

  async getDisplayName(accountId: string): Promise<string> {
    const account = await this.accounts.findOne({ where: { id: accountId } });
    return formatName(account?.name, account?.email);
  }

  async registerFcmToken(accountId: string, token: string) {
    await this.accounts.update(accountId, { fcmToken: token });
  }

  async getFamilyParentTokens(
    familyId: string,
    opts: { exclude?: string; event?: 'task' | 'reward' | 'streak' } = {},
  ): Promise<string[]> {
    const accounts = await this.accounts.find({ where: { family: { id: familyId } } });
    return accounts
      .filter(a => {
        if (opts.exclude && a.id === opts.exclude) return false;
        if (opts.event === 'task'   && !a.notifTaskSubmitted) return false;
        if (opts.event === 'reward' && !a.notifRewardClaimed) return false;
        if (opts.event === 'streak' && !a.notifStreakAlert)   return false;
        return true;
      })
      .map(a => a.fcmToken)
      .filter(Boolean) as string[];
  }
}
