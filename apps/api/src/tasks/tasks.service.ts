import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository }  from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Task }                from './task.entity';
import { Transaction }         from '../transactions/transaction.entity';
import { NotificationIntent }  from '../notifications/notification-intent.entity';
import { Child }               from '../children/child.entity';
import { FamiliesService }     from '../families/families.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)               private tasks: Repository<Task>,
    @InjectRepository(Transaction)        private txs: Repository<Transaction>,
    @InjectRepository(NotificationIntent) private notifs: Repository<NotificationIntent>,
    @InjectRepository(Child)              private children: Repository<Child>,
    private ds: DataSource,
    private familiesSvc: FamiliesService,
  ) {}

  getForChild(childId: string) {
    return this.tasks.find({ where: { child: { id: childId } }, relations: ['child'], order: { createdAt: 'DESC' } });
  }

  getAll(childId?: string, status?: string) {
    const where: Record<string, any> = {};
    if (childId) where.child = { id: childId };
    if (status)  where.status = status;
    return this.tasks.find({ where, relations: ['child'], order: { createdAt: 'DESC' } });
  }

  getHistory(childId?: string) {
    return this.getAll(childId);
  }

  async create(body: { childId: string; title: string; points: number; frequency?: string }) {
    const child = await this.children.findOne({ where: { id: body.childId } }).then(c => { if (!c) throw new NotFoundException('Enfant introuvable'); return c; });
    const task  = this.tasks.create({ title: body.title, points: body.points, frequency: (body.frequency as any) ?? 'daily', child });
    return this.tasks.save(task);
  }

  async complete(id: string, photoUrl?: string, note?: string) {
    const task = await this.tasks.findOne({ where: { id }, relations: ['child', 'child.family'] });
    if (!task) throw new NotFoundException('Tâche introuvable');
    if (task.status !== 'created') throw new ConflictException('Tâche déjà soumise');

    const familyId = (task.child.family as any).id as string;
    const parentTokens = await this.familiesSvc.getFamilyParentTokens(familyId, { event: 'task' });

    await this.ds.transaction(async em => {
      const result = await em.createQueryBuilder()
        .update(Task)
        .set({ status: 'pending_approval', submittedAt: new Date(), photoUrl, note })
        .where('id = :id AND status = :status', { id, status: 'created' })
        .execute();

      if (!result.affected) throw new ConflictException('Tâche déjà soumise');

      for (const fcmToken of parentTokens) {
        await em.save(NotificationIntent, em.create(NotificationIntent, {
          fcmToken,
          payload: { title: `${task.child.name} a fait : ${task.title}`, body: 'Tape pour valider ✓', data: { taskId: id } },
        }));
      }
    });
    return this.tasks.findOneOrFail({ where: { id } });
  }

  async approve(id: string, accountId: string) {
    const task = await this.tasks.findOne({ where: { id }, relations: ['child', 'child.family'] });
    if (!task) throw new NotFoundException('Tâche introuvable');
    if (task.status !== 'pending_approval') throw new ConflictException('Tâche déjà traitée');

    const approverName = await this.familiesSvc.getDisplayName(accountId);
    const familyId = (task.child.family as any).id as string;
    const otherParentTokens = await this.familiesSvc.getFamilyParentTokens(familyId, { exclude: accountId });

    await this.ds.transaction(async em => {
      const result = await em.createQueryBuilder()
        .update(Task)
        .set({ status: 'validated', validatedAt: new Date(), approvedByName: approverName })
        .where('id = :id AND status = :status', { id, status: 'pending_approval' })
        .execute();

      if (!result.affected) throw new ConflictException('Tâche déjà validée par l\'autre parent');

      await em.save(Transaction, em.create(Transaction, { type: 'earn', amount: task.points, referenceId: id, child: task.child }));

      // Notif à l'enfant
      if (task.child.fcmToken) {
        await em.save(NotificationIntent, em.create(NotificationIntent, {
          fcmToken: task.child.fcmToken,
          payload: { title: '🎉 Validé !', body: `+${task.points} pts pour ${task.title}`, data: { taskId: id } },
        }));
      }

      // Notif à l'autre parent
      for (const fcmToken of otherParentTokens) {
        await em.save(NotificationIntent, em.create(NotificationIntent, {
          fcmToken,
          payload: { title: `✅ ${approverName} a validé`, body: task.title, data: { taskId: id } },
        }));
      }
    });
    return this.tasks.findOneOrFail({ where: { id } });
  }

  async reject(id: string, accountId: string, reason?: string) {
    const task = await this.tasks.findOne({ where: { id }, relations: ['child', 'child.family'] });
    if (!task) throw new NotFoundException('Tâche introuvable');
    if (task.status !== 'pending_approval') throw new ConflictException('Tâche déjà traitée');

    const approverName = await this.familiesSvc.getDisplayName(accountId);
    const familyId = (task.child.family as any).id as string;
    const otherParentTokens = await this.familiesSvc.getFamilyParentTokens(familyId, { exclude: accountId });

    await this.ds.transaction(async em => {
      const result = await em.createQueryBuilder()
        .update(Task)
        .set({ status: 'created', rejectionReason: reason ?? '', submittedAt: null as any, photoUrl: null as any, note: null as any })
        .where('id = :id AND status = :status', { id, status: 'pending_approval' })
        .execute();

      if (!result.affected) throw new ConflictException('Tâche déjà traitée par l\'autre parent');

      // Notif à l'autre parent
      for (const fcmToken of otherParentTokens) {
        await em.save(NotificationIntent, em.create(NotificationIntent, {
          fcmToken,
          payload: { title: `↩️ ${approverName} a rejeté`, body: task.title, data: { taskId: id } },
        }));
      }
    });

    return this.tasks.findOneOrFail({ where: { id } });
  }
}
