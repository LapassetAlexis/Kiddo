import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';
import { JwtService }       from '@nestjs/jwt';
import { ConfigService }    from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import * as bcrypt          from 'bcrypt';
import * as crypto          from 'crypto';
import { Family }             from '../families/family.entity';
import { Child }              from '../children/child.entity';
import { PinAttempt }         from '../children/pin-attempt.entity';
import { EmailVerification }  from './entities/email-verification.entity';
import { PasswordReset }      from './entities/password-reset.entity';
import { JwtPayload }         from './decorators/current-user.decorator';

// ─── Constants ───────────────────────────────────────────────────────────────

const PIN_MAX_ATTEMPTS  = 5;
const PIN_LOCK_MINUTES  = 15;
const CODE_EXPIRES_MIN  = 15;
const BCRYPT_ROUNDS     = 12;

// ─── Console colours (kept light – no prod email yet) ────────────────────────
const cyan  = (s: string) => `\x1b[36m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const bold  = (s: string) => `\x1b[1m${s}\x1b[0m`;

// ─── JWT Strategy (lives here to keep the module lean) ───────────────────────

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest:   ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:      config.get<string>('JWT_SECRET') ?? 'kidpoints-dev-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return payload;
  }
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Family)             private families:      Repository<Family>,
    @InjectRepository(Child)              private children:      Repository<Child>,
    @InjectRepository(PinAttempt)         private pinAttempts:   Repository<PinAttempt>,
    @InjectRepository(EmailVerification)  private emailVerifs:   Repository<EmailVerification>,
    @InjectRepository(PasswordReset)      private pwdResets:     Repository<PasswordReset>,
    private jwt:    JwtService,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private generate6DigitCode(): string {
    return String(crypto.randomInt(100_000, 1_000_000)).padStart(6, '0');
  }

  private codeExpiry(): Date {
    return new Date(Date.now() + CODE_EXPIRES_MIN * 60 * 1_000);
  }

  private logCode(action: string, email: string, code: string): void {
    console.log(
      bold(`\n  [KidPoints Auth] ${action}`),
      `\n  Email : ${cyan(email)}`,
      `\n  Code  : ${green(bold(code))}`,
      `\n  (expires in ${CODE_EXPIRES_MIN} minutes)\n`,
    );
  }

  // ── Registration & email verification ──────────────────────────────────────

  async register(name: string, email: string, password: string) {
    email = email.toLowerCase().trim();
    const existing = await this.families.findOne({ where: { email } });
    if (existing) throw new ConflictException('Cette adresse e-mail est déjà utilisée.');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const family = this.families.create({ email, passwordHash });
    // Store name in the email field temporarily — adjust if Family entity gains a `name` column
    await this.families.save(family);

    const code = await this.createEmailVerificationCode(email);
    this.logCode('Email verification code', email, code);

    return { message: 'Famille créée. Vérifiez votre e-mail pour confirmer votre compte.' };
  }

  async verifyEmail(email: string, code: string) {
    email = email.toLowerCase().trim();
    const record = await this.emailVerifs.findOne({
      where: { email, code },
      order: { createdAt: 'DESC' },
    });

    if (!record)                          throw new BadRequestException('Code invalide.');
    if (record.usedAt)                    throw new BadRequestException('Code déjà utilisé.');
    if (record.expiresAt < new Date())    throw new BadRequestException('Code expiré. Demandez un nouveau code.');

    await this.emailVerifs.update(record.id, { usedAt: new Date() });

    const family = await this.families.findOne({ where: { email } });
    if (!family) throw new NotFoundException('Compte introuvable.');

    const accessToken = this.jwt.sign({ sub: family.id, role: 'parent', email: family.email });
    return { accessToken, message: 'E-mail vérifié avec succès.' };
  }

  async resendVerification(email: string) {
    email = email.toLowerCase().trim();
    const family = await this.families.findOne({ where: { email } });
    // Return the same generic message whether the family exists or not (no enumeration)
    if (!family) {
      return { message: 'Si ce compte existe, un nouveau code vous a été envoyé.' };
    }

    const code = await this.createEmailVerificationCode(email);
    this.logCode('Email verification code (resend)', email, code);

    return { message: 'Si ce compte existe, un nouveau code vous a été envoyé.' };
  }

  // ── Password reset ─────────────────────────────────────────────────────────

  async forgotPassword(email: string) {
    email = email.toLowerCase().trim();
    const family = await this.families.findOne({ where: { email } });
    // Generic response to prevent account enumeration
    if (family) {
      const code = await this.createPasswordResetCode(email);
      this.logCode('Password reset code', email, code);
    }
    return { message: 'Si ce compte existe, un code de réinitialisation vous a été envoyé.' };
  }

  async verifyResetCode(email: string, code: string) {
    email = email.toLowerCase().trim();
    const record = await this.pwdResets.findOne({
      where: { email, code },
      order: { createdAt: 'DESC' },
    });

    if (!record)                        throw new BadRequestException('Code invalide.');
    if (record.usedAt)                  throw new BadRequestException('Code déjà utilisé.');
    if (record.expiresAt < new Date())  throw new BadRequestException('Code expiré. Demandez un nouveau code.');

    return { valid: true, message: 'Code valide. Vous pouvez maintenant réinitialiser votre mot de passe.' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    email = email.toLowerCase().trim();
    const record = await this.pwdResets.findOne({
      where: { email, code },
      order: { createdAt: 'DESC' },
    });

    if (!record)                        throw new BadRequestException('Code invalide.');
    if (record.usedAt)                  throw new BadRequestException('Code déjà utilisé.');
    if (record.expiresAt < new Date())  throw new BadRequestException('Code expiré. Demandez un nouveau code.');

    const family = await this.families.findOne({ where: { email } });
    if (!family) throw new NotFoundException('Compte introuvable.');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.families.update(family.id, { passwordHash });
    await this.pwdResets.update(record.id, { usedAt: new Date() });

    return { message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' };
  }

  // ── Existing login methods ─────────────────────────────────────────────────

  async parentLogin(email: string, password: string) {
    email = email.toLowerCase().trim();
    const family = await this.families.findOne({ where: { email } });
    if (!family || !(await bcrypt.compare(password, family.passwordHash))) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const accessToken = this.jwt.sign({ sub: family.id, role: 'parent', email: family.email });
    return { accessToken };
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
        ? new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1_000)
        : undefined;
      await this.pinAttempts.upsert({ child: { id: childId }, attemptCount: count, lockedUntil }, ['child']);
      throw new UnauthorizedException('PIN incorrect');
    }

    // Reset attempts on success
    if (attempt) await this.pinAttempts.update(attempt.id, { attemptCount: 0, lockedUntil: undefined as any });

    const accessToken = this.jwt.sign(
      { sub: childId, familyId: child.family.id, role: 'child' },
      { expiresIn: '8h' },
    );
    return { accessToken };
  }

  // ── /me ────────────────────────────────────────────────────────────────────

  async getMe(user: JwtPayload) {
    if (user.role === 'parent') {
      const family = await this.families.findOne({ where: { id: user.sub }, relations: ['children'] });
      if (!family) throw new UnauthorizedException();
      return {
        role:      'parent',
        id:        family.id,
        email:     family.email,
        timezone:  family.timezone,
        children:  family.children.map(c => ({ id: c.id, name: c.name, avatar: c.avatar, color: c.color })),
      };
    }

    // child
    const child = await this.children.findOne({ where: { id: user.sub }, relations: ['family'] });
    if (!child) throw new UnauthorizedException();
    return {
      role:     'child',
      id:       child.id,
      name:     child.name,
      avatar:   child.avatar,
      color:    child.color,
      familyId: child.family.id,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async createEmailVerificationCode(email: string): Promise<string> {
    const code = this.generate6DigitCode();
    const record = this.emailVerifs.create({ email, code, expiresAt: this.codeExpiry() });
    await this.emailVerifs.save(record);
    return code;
  }

  private async createPasswordResetCode(email: string): Promise<string> {
    const code = this.generate6DigitCode();
    const record = this.pwdResets.create({ email, code, expiresAt: this.codeExpiry() });
    await this.pwdResets.save(record);
    return code;
  }
}
