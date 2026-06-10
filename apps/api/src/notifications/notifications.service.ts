import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { NotificationIntent, NotifStatus } from './notification-intent.entity';
import { Child } from '../children/child.entity';
import { Task } from '../tasks/task.entity';
import { Family } from '../families/family.entity';
import { FamiliesService } from '../families/families.service';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly log = new Logger(NotificationsService.name);
  private messaging: import('firebase-admin/messaging').Messaging | null = null;

  constructor(
    @InjectRepository(NotificationIntent)
    private intents: Repository<NotificationIntent>,
    @InjectRepository(Child)
    private children: Repository<Child>,
    @InjectRepository(Task)
    private tasks: Repository<Task>,
    @InjectRepository(Family)
    private families: Repository<Family>,
    private familiesSvc: FamiliesService,
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
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getMessaging } = await import('firebase-admin/messaging');
      if (!getApps().length) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }
      this.messaging = getMessaging();
      this.log.log('Firebase Admin initialized ✓');
    } catch (err) {
      this.log.error(`Firebase Admin init failed: ${(err as Error).message}`);
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
        this.log.warn(`FCM attempt ${attempts} failed for intent ${intent.id}: ${(err as Error).message}`);
      }
    }));
  }

  // Every day at 20:00 Paris time — warn parents whose child hasn't done a task today
  // but had an active streak (last task was yesterday).
  @Cron('0 18 * * *', { timeZone: 'Europe/Paris' })
  async checkStreakAlerts(): Promise<void> {
    const allFamilies = await this.families.find({ relations: { children: true } });

    for (const family of allFamilies) {
      if (!family.children?.length) continue;

      const tz = family.timezone ?? 'Europe/Paris';
      const todayStr = this.todayInTimezone(tz);

      for (const child of family.children) {
        const streakInfo = await this.getChildStreakInfo(child.id, tz);
        if (!streakInfo) continue;

        const { lastActiveDate, streakLength } = streakInfo;
        if (streakLength < 2) continue;

        const today    = new Date(todayStr);
        const lastDay  = new Date(lastActiveDate);
        const diff     = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

        // Streak at risk: last task was yesterday, no task today yet
        if (diff !== 1) continue;

        const parents = await this.familiesSvc.getFamilyParentsForNotif(family.id, { event: 'streak' });
        for (const parent of parents) {
          await this.intents.save(this.intents.create({
            fcmToken: parent.fcmToken,
            payload: {
              title: `🔥 Streak de ${child.name} en danger !`,
              body: `${streakLength} jours de suite — aide ${child.name} à compléter une quête ce soir !`,
            },
          }));
        }

        this.log.log(`Streak alert queued for child ${child.id} (${streakLength}j streak at risk)`);
      }
    }
  }

  async registerChildToken(childId: string, token: string): Promise<void> {
    await this.children.update(childId, { fcmToken: token });
  }

  private async getChildStreakInfo(
    childId: string,
    tz: string,
  ): Promise<{ lastActiveDate: string; streakLength: number } | null> {
    const rows = await this.tasks
      .createQueryBuilder('task')
      .select(`DATE(task."validatedAt" AT TIME ZONE :tz)`, 'day')
      .where('task.childId = :childId', { childId })
      .andWhere("task.status = 'validated'")
      .andWhere('task."validatedAt" IS NOT NULL')
      .setParameter('tz', tz)
      .groupBy('day')
      .orderBy('day', 'DESC')
      .getRawMany<{ day: string }>();

    if (!rows.length) return null;

    const days = rows.map(r => r.day);
    let streak = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);
      const gap  = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
      if (gap === 1) streak++;
      else break;
    }

    return { lastActiveDate: days[0], streakLength: streak };
  }

  private todayInTimezone(tz: string): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: tz });
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
