import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository }  from '@nestjs/typeorm';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';
import { Task, TaskDifficulty }  from './task.entity';
import { Transaction }           from '../transactions/transaction.entity';
import { NotificationIntent }    from '../notifications/notification-intent.entity';
import { Child }                 from '../children/child.entity';
import { FamiliesService }       from '../families/families.service';
import { XP_BY_DIFFICULTY }      from '../rpg/rpg.constants';

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

  private todayStart(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private async countTodayCompletions(taskId: string): Promise<number> {
    return this.txs.count({
      where: { referenceId: taskId, type: 'earn', currency: 'gold', createdAt: MoreThanOrEqual(this.todayStart()) },
    });
  }

  private async enrichTasks(tasks: Task[]): Promise<Array<Task & { completedToday: number }>> {
    return Promise.all(tasks.map(async task => {
      const completedToday = await this.countTodayCompletions(task.id);
      return Object.assign(task, { completedToday });
    }));
  }

  async getForChild(childId: string, familyId?: string) {
    const tasks = await this.tasks.find({
      where: { child: { id: childId, family: { id: familyId } } },
      relations: ['child'],
      order: { createdAt: 'DESC' },
    });
    return this.enrichTasks(tasks);
  }

  async getAll(familyId?: string, childId?: string, status?: string) {
    const where: Record<string, any> = {};
    if (familyId) where.child = { family: { id: familyId } };
    else return [];
    if (childId) where.child = { ...where.child, id: childId };
    if (status)  where.status = status;
    const tasks = await this.tasks.find({ where, relations: ['child'], order: { createdAt: 'DESC' } });
    return this.enrichTasks(tasks);
  }

  getHistory(familyId?: string, childId?: string) {
    return this.getAll(familyId, childId);
  }

  async create(body: { childId: string; title: string; goldReward: number; difficulty?: TaskDifficulty; frequency?: string; timesPerDay?: number; bonusGold?: number }, familyId: string) {
    const child = await this.children.findOne({ where: { id: body.childId, family: { id: familyId } }, relations: ['family'] })
      .then(c => { if (!c) throw new ForbiddenException('Enfant introuvable dans cette famille'); return c; });
    const task  = this.tasks.create({
      title:       body.title,
      goldReward:  body.goldReward,
      difficulty:  body.difficulty ?? 'easy',
      frequency:   (body.frequency as any) ?? 'daily',
      timesPerDay: body.timesPerDay ?? 1,
      bonusGold:   body.bonusGold ?? 0,
      child,
    });
    return this.tasks.save(task);
  }

  async complete(id: string, childId: string, photoUrl?: string, note?: string) {
    const task = await this.tasks.findOne({ where: { id }, relations: ['child', 'child.family'] });
    if (!task) throw new NotFoundException('Tâche introuvable');
    if (task.child.id !== childId) throw new ForbiddenException('Cette tâche ne t\'appartient pas');
    if (task.status !== 'created') throw new ConflictException('Tâche déjà soumise');

    if (task.timesPerDay > 1) {
      const completedToday = await this.countTodayCompletions(id);
      if (completedToday >= task.timesPerDay) throw new ConflictException('Limite journalière atteinte');
    }

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

  async approve(id: string, accountId: string, familyId: string) {
    const task = await this.tasks.findOne({ where: { id }, relations: ['child', 'child.family'] });
    if (!task) throw new NotFoundException('Tâche introuvable');
    if ((task.child.family as any).id !== familyId) throw new ForbiddenException('Accès refusé');
    if (task.status !== 'pending_approval') throw new ConflictException('Tâche déjà traitée');

    const approverName = await this.familiesSvc.getDisplayName(accountId);
    const otherParentTokens = await this.familiesSvc.getFamilyParentTokens(familyId, { exclude: accountId });
    const xpReward = XP_BY_DIFFICULTY[task.difficulty];

    await this.ds.transaction(async em => {
      const completedToday = await em.count(Transaction, {
        where: { referenceId: id, type: 'earn', currency: 'gold', createdAt: MoreThanOrEqual(this.todayStart()) },
      });

      const isLast = (completedToday + 1) >= task.timesPerDay;

      const updateFields: Partial<Task> = { approvedByName: approverName };
      if (isLast) {
        updateFields.status     = 'validated';
        updateFields.validatedAt = new Date();
      } else {
        updateFields.status      = 'created';
        updateFields.submittedAt = null as any;
        updateFields.photoUrl    = null as any;
        updateFields.note        = null as any;
      }

      const result = await em.createQueryBuilder()
        .update(Task)
        .set(updateFields)
        .where('id = :id AND status = :status', { id, status: 'pending_approval' })
        .execute();

      if (!result.affected) throw new ConflictException('Tâche déjà validée par l\'autre parent');

      // Gold reward
      await em.save(Transaction, em.create(Transaction, {
        type: 'earn', currency: 'gold', amount: task.goldReward, referenceId: id, child: task.child,
      }));

      // XP reward
      await em.save(Transaction, em.create(Transaction, {
        type: 'earn', currency: 'xp', amount: xpReward, referenceId: id, child: task.child,
      }));
      await em.createQueryBuilder().update(Child).set({ xp: () => `xp + ${xpReward}` }).where('id = :id', { id: task.child.id }).execute();

      if (isLast && task.bonusGold > 0) {
        await em.save(Transaction, em.create(Transaction, {
          type: 'earn', currency: 'gold', amount: task.bonusGold, referenceId: `${id}:bonus`, child: task.child,
        }));
      }

      if (task.child.fcmToken) {
        const hasBonus = isLast && task.bonusGold > 0;
        const notifBody = hasBonus
          ? `+${task.goldReward} pièces + ${xpReward} XP pour ${task.title} + bonus !`
          : `+${task.goldReward} pièces + ${xpReward} XP pour ${task.title}`;
        await em.save(NotificationIntent, em.create(NotificationIntent, {
          fcmToken: task.child.fcmToken,
          payload: { title: 'Validé !', body: notifBody, data: { taskId: id } },
        }));
      }

      for (const fcmToken of otherParentTokens) {
        await em.save(NotificationIntent, em.create(NotificationIntent, {
          fcmToken,
          payload: { title: `${approverName} a validé`, body: task.title, data: { taskId: id } },
        }));
      }
    });
    return this.tasks.findOneOrFail({ where: { id } });
  }

  async reject(id: string, accountId: string, familyId: string, reason?: string) {
    const task = await this.tasks.findOne({ where: { id }, relations: ['child', 'child.family'] });
    if (!task) throw new NotFoundException('Tâche introuvable');
    if ((task.child.family as any).id !== familyId) throw new ForbiddenException('Accès refusé');
    if (task.status !== 'pending_approval') throw new ConflictException('Tâche déjà traitée');

    const approverName = await this.familiesSvc.getDisplayName(accountId);
    const otherParentTokens = await this.familiesSvc.getFamilyParentTokens(familyId, { exclude: accountId });

    await this.ds.transaction(async em => {
      const result = await em.createQueryBuilder()
        .update(Task)
        .set({ status: 'created', rejectionReason: reason ?? '', submittedAt: null as any, photoUrl: null as any, note: null as any })
        .where('id = :id AND status = :status', { id, status: 'pending_approval' })
        .execute();

      if (!result.affected) throw new ConflictException('Tâche déjà traitée par l\'autre parent');

      for (const fcmToken of otherParentTokens) {
        await em.save(NotificationIntent, em.create(NotificationIntent, {
          fcmToken,
          payload: { title: `${approverName} a rejeté`, body: task.title, data: { taskId: id } },
        }));
      }
    });

    return this.tasks.findOneOrFail({ where: { id } });
  }
}
