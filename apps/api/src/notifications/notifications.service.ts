import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { NotificationIntent, NotifStatus } from './notification-intent.entity';
import { Child } from '../children/child.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly log = new Logger(NotificationsService.name);
  private messaging: any | null = null;

  constructor(
    @InjectRepository(NotificationIntent)
    private intents: Repository<NotificationIntent>,
    @InjectRepository(Child)
    private children: Repository<Child>,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    const projectId     = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail   = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey    = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.log.warn('Firebase env vars not set — push notifications will be logged only');
      return;
    }

    try {
      const admin = await import('firebase-admin');
      if (!admin.default.apps.length) {
        admin.default.initializeApp({
          credential: admin.default.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }
      this.messaging = admin.default.messaging();
      this.log.log('Firebase Admin initialized ✓');
    } catch (err) {
      this.log.error(`Firebase Admin init failed: ${err.message}`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processPending(): Promise<void> {
    const pending = await this.intents.find({
      where: { status: 'pending' as NotifStatus },
      take: 50,
      order: { createdAt: 'ASC' },
    });

    await Promise.all(pending.map(async intent => {
      try {
        await this.sendFcm(intent.fcmToken, intent.payload);
        await this.intents.update(intent.id, { status: 'sent', sentAt: new Date(), attempts: intent.attempts + 1 });
      } catch (err) {
        const attempts = intent.attempts + 1;
        const status: NotifStatus = attempts >= 3 ? 'failed' : 'pending';
        await this.intents.update(intent.id, { attempts, status });
        this.log.warn(`FCM attempt ${attempts} failed for intent ${intent.id}: ${err.message}`);
      }
    }));
  }

  async registerChildToken(childId: string, token: string): Promise<void> {
    await this.children.update(childId, { fcmToken: token });
  }

  private async sendFcm(token: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.messaging) {
      this.log.log(`[FCM] → ${token.slice(0, 20)}... | ${JSON.stringify(payload)}`);
      return;
    }

    await this.messaging.send({
      token,
      notification: {
        title: payload['title'] as string,
        body:  payload['body']  as string,
      },
      data: payload['data'] as Record<string, string> | undefined,
      android: { priority: 'high' },
      apns:    { payload: { aps: { sound: 'default' } } },
    });
  }
}
