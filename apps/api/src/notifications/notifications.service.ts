import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationIntent, NotifStatus } from './notification-intent.entity';
import { Child } from '../children/child.entity';

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationIntent)
    private intents: Repository<NotificationIntent>,
    @InjectRepository(Child)
    private children: Repository<Child>,
  ) {}

  // Appelé par les workers pour livrer les notifications en attente
  async processPending(): Promise<void> {
    const pending = await this.intents.find({
      where: { status: 'pending' as NotifStatus },
      take: 50,
      order: { createdAt: 'ASC' },
    });

    for (const intent of pending) {
      try {
        await this.sendFcm(intent.fcmToken, intent.payload);
        await this.intents.update(intent.id, { status: 'sent', sentAt: new Date(), attempts: intent.attempts + 1 });
      } catch (err) {
        const attempts = intent.attempts + 1;
        const status: NotifStatus = attempts >= 3 ? 'failed' : 'pending';
        await this.intents.update(intent.id, { attempts, status });
        this.log.warn(`FCM attempt ${attempts} failed for intent ${intent.id}: ${err.message}`);
      }
    }
  }

  // Enregistre ou met à jour le token FCM d'un enfant
  async registerChildToken(childId: string, token: string): Promise<void> {
    await this.children.update(childId, { fcmToken: token });
  }

  private async sendFcm(token: string, payload: Record<string, unknown>): Promise<void> {
    // TODO: Intégrer Firebase Admin SDK en production
    // Pour le moment, log la notification
    this.log.log(`[FCM] → ${token.slice(0, 20)}... | ${JSON.stringify(payload)}`);

    // Simuler un envoi (remplacer par firebase-admin en production)
    // const message = { token, notification: { title: payload.title, body: payload.body }, data: payload.data };
    // await admin.messaging().send(message);
  }
}
