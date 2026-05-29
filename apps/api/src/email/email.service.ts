import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly log = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  get isEnabled(): boolean { return this.resend !== null; }

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.from = this.config.get<string>('EMAIL_FROM') ?? 'Kiddo <contact@kiddoapp.fr>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
      this.log.warn('RESEND_API_KEY not set — dev mode, email verification skipped');
    }
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const subject = 'Votre code de vérification Kiddo';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#FFB300">Kiddo ⭐</h2>
        <p>Bienvenue ! Entrez ce code pour confirmer votre adresse e-mail :</p>
        <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#1a1000;
                    background:#FFF8E1;border-radius:12px;padding:20px;text-align:center;margin:24px 0">
          ${code}
        </div>
        <p style="color:#888;font-size:13px">Ce code expire dans 15 minutes. Ne le partagez pas.</p>
      </div>`;
    await this.send(to, subject, html);
  }

  async sendPasswordReset(to: string, code: string): Promise<void> {
    const subject = 'Réinitialisation de votre mot de passe Kiddo';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#FFB300">Kiddo ⭐</h2>
        <p>Voici votre code de réinitialisation de mot de passe :</p>
        <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#1a1000;
                    background:#FFF8E1;border-radius:12px;padding:20px;text-align:center;margin:24px 0">
          ${code}
        </div>
        <p style="color:#888;font-size:13px">Ce code expire dans 15 minutes. Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail.</p>
      </div>`;
    await this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.log.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
    } catch (err) {
      this.log.error(`Failed to send email to ${to}: ${(err as Error).message}`);
      throw err;
    }
  }
}
