import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';
import { JwtService }       from '@nestjs/jwt';
import * as bcrypt          from 'bcrypt';
import { Family }     from '../families/family.entity';
import { Child }      from '../children/child.entity';
import { PinAttempt } from '../children/pin-attempt.entity';

const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Family)     private families: Repository<Family>,
    @InjectRepository(Child)      private children: Repository<Child>,
    @InjectRepository(PinAttempt) private pinAttempts: Repository<PinAttempt>,
    private jwt: JwtService,
  ) {}

  async parentLogin(email: string, password: string) {
    const family = await this.families.findOne({ where: { email } });
    if (!family || !(await bcrypt.compare(password, family.passwordHash))) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    return { accessToken: this.jwt.sign({ sub: family.id, role: 'parent' }) };
  }

  async childPin(childId: string, pin: string) {
    const child = await this.children.findOne({ where: { id: childId }, relations: ['family'] });
    if (!child) throw new UnauthorizedException();

    // Check lockout (stored in DB — survives server restart)
    let attempt = await this.pinAttempts.findOne({ where: { child: { id: childId } } });
    if (attempt?.lockedUntil && attempt.lockedUntil > new Date()) {
      throw new BadRequestException('Trop de tentatives. Réessaie dans quelques minutes.');
    }

    const valid = await bcrypt.compare(pin, child.pinHash);
    if (!valid) {
      const count = (attempt?.attemptCount ?? 0) + 1;
      const lockedUntil = count >= PIN_MAX_ATTEMPTS
        ? new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000)
        : undefined;
      await this.pinAttempts.upsert({ child: { id: childId }, attemptCount: count, lockedUntil }, ['child']);
      throw new UnauthorizedException('PIN incorrect');
    }

    // Reset attempts on success
    if (attempt) await this.pinAttempts.update(attempt.id, { attemptCount: 0, lockedUntil: null });

    return { accessToken: this.jwt.sign({ sub: childId, familyId: child.family.id, role: 'child' }, { expiresIn: '8h' }) };
  }
}
