import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository }  from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Task }                from './task.entity';
import { Transaction }         from '../transactions/transaction.entity';
import { NotificationIntent }  from '../notifications/notification-intent.entity';
import { Child }               from '../children/child.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)               private tasks: Repository<Task>,
    @InjectRepository(Transaction)        private txs: Repository<Transaction>,
    @InjectRepository(NotificationIntent) private notifs: Repository<NotificationIntent>,
    @InjectRepository(Child)              private children: Repository<Child>,
    private ds: DataSource,
  ) {}

  getForChild(childId: string) {
    return this.tasks.find({ where: { child: { id: childId } }, order: { createdAt: 'DESC' } });
  }

  async create(body: { childId: string; title: string; points: number; frequency?: string }) {
    const child = await this.children.findOne({ where: { id: body.childId } }).then(c => { if (!c) throw new NotFoundException('Enfant introuvable'); return c; });
    const task  = this.tasks.create({ title: body.title, points: body.points, frequency: (body.frequency as any) ?? 'daily', child });
    return this.tasks.save(task);
  }

  async complete(id: string, photoUrl?: string) {
    const task = await this.tasks.findOne({ where: { id }, relations: ['child', 'child.family'] }).then(t => { if (!t) throw new NotFoundException('Tâche introuvable'); return t; });
    if (task.status !== 'created') throw new ConflictException('Tâche déjà soumise');

    await this.ds.transaction(async em => {
      await em.update(Task, id, { status: 'pending_approval', submittedAt: new Date(), photoUrl });
      // Outbox: notify parent via FCM (worker delivers async)
      const parentToken = (task.child.family as any).fcmToken;
      if (parentToken) {
        await em.save(NotificationIntent, em.create(NotificationIntent, {
          fcmToken: parentToken,
          payload: { title: `${task.child.name} a fait : ${task.title}`, body: 'Tape pour valider ✓', data: { taskId: id } },
        }));
      }
    });
    return this.tasks.findOne({ where: { id } }).then(t => { if (!t) throw new NotFoundException('Tâche introuvable'); return t; });
  }

  async approve(id: string) {
    const task = await this.tasks.findOne({ where: { id }, relations: ['child'] }).then(t => { if (!t) throw new NotFoundException('Tâche introuvable'); return t; });
    if (task.status !== 'pending_approval') throw new ConflictException();

    await this.ds.transaction(async em => {
      await em.update(Task, id, { status: 'validated', validatedAt: new Date() });
      // Immutable ledger: insert transaction
      await em.save(Transaction, em.create(Transaction, { type: 'earn', amount: task.points, referenceId: id, child: task.child }));
      // Notify child
      const childToken = task.child.fcmToken;
      if (childToken) {
        await em.save(NotificationIntent, em.create(NotificationIntent, {
          fcmToken: childToken,
          payload: { title: '🎉 Validé !', body: `+${task.points} pts pour ${task.title}`, data: { taskId: id } },
        }));
      }
    });
    return this.tasks.findOne({ where: { id } }).then(t => { if (!t) throw new NotFoundException('Tâche introuvable'); return t; });
  }

  async reject(id: string, reason?: string) {
    const task = await this.tasks.findOne({ where: { id }, relations: ['child'] }).then(t => { if (!t) throw new NotFoundException('Tâche introuvable'); return t; });
    if (task.status !== 'pending_approval') throw new ConflictException();
    await this.tasks.update(id, { status: 'rejected', rejectionReason: reason ?? '' });
    return this.tasks.findOne({ where: { id } }).then(t => { if (!t) throw new NotFoundException('Tâche introuvable'); return t; });
  }
}
