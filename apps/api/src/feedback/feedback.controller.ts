import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { EmailService } from '../email/email.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

const CATEGORY_LABELS: Record<string, string> = {
  bug: '🐛 Bug',
  question: '❓ Question',
  feature: '💡 Suggestion de fonctionnalité',
};

@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('parent')
export class FeedbackController {
  private readonly log = new Logger(FeedbackController.name);
  private readonly adminEmail: string;

  constructor(
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {
    this.adminEmail = this.config.getOrThrow<string>('ADMIN_EMAIL');
    this.log.log(`FeedbackController init — adminEmail: ${this.adminEmail}, resendEnabled: ${this.emailService.isEnabled}`);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async send(@Body() dto: CreateFeedbackDto, @CurrentUser() user: JwtPayload) {
    this.log.log(`Feedback received — category: ${dto.category}, from: ${user.email ?? user.sub}, to: ${this.adminEmail}`);
    const category = CATEGORY_LABELS[dto.category] ?? dto.category;
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2 style="color:#FFB300">Kiddo — Nouveau message</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr><td style="padding:8px;color:#888;font-size:13px;width:120px">Catégorie</td><td style="padding:8px;font-weight:700">${category}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#888;font-size:13px">De</td><td style="padding:8px;font-weight:700">${user.email ?? user.sub}</td></tr>
        </table>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;white-space:pre-wrap;font-size:14px;line-height:1.6">${dto.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <p style="color:#aaa;font-size:11px;margin-top:16px">Envoyé depuis l'app Kiddo</p>
      </div>`;

    try {
      await this.emailService['send'](
        this.adminEmail,
        `[Kiddo] ${category} — ${user.email ?? user.sub}`,
        html,
      );
      this.log.log('Feedback email sent successfully');
    } catch (err) {
      this.log.error(`Feedback email failed: ${(err as Error).message}`, (err as Error).stack);
      throw err;
    }
    return { message: 'Message envoyé' };
  }
}
