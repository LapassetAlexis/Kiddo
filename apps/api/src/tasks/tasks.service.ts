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
    const task = await this.tasks.findOne({ where: { id }, relations: ['child', 'child.family'] }).then(t => { if (!t) throw new NotFoundException('Tâche introuvable'); return t; });
    if (task.status !== 'created') throw new ConflictException('Tâche déjà soumise');

    const familyId = (task.child.family as any).id as string;
    const parentTokens = await this.familiesSvc.getFamilyParentTokens(familyId);

    await this.ds.transaction(async em => {
      await em.update(Task, id, { status: 'pending_approval', submittedAt: new Date(), photoUrl, note });
      for (const fcmToken of parentTokens) {
        await em.save(NotificationIntent, em.create(NotificationIntent, {
          fcmToken,
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
      await em.save(Transaction, em.create(Transaction, { type: 'earn', amount: task.points, referenceId: id, child: task.child }));
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
    await this.tasks.update(id, { status: 'created', rejectionReason: reason ?? '', submittedAt: null as any, photoUrl: null as any, note: null as any });
    return this.tasks.findOne({ where: { id } }).then(t => { if (!t) throw new NotFoundException('Tâche introuvable'); return t; });
  }
}
