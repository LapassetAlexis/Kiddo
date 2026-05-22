import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { Family }             from './families/family.entity';
import { ParentAccount }      from './families/parent-account.entity';
import { Child }              from './children/child.entity';
import { PinAttempt }         from './children/pin-attempt.entity';
import { Task }               from './tasks/task.entity';
import { Reward }             from './rewards/reward.entity';
import { Transaction }        from './transactions/transaction.entity';
import { NotificationIntent } from './notifications/notification-intent.entity';
import { EmailVerification }  from './auth/entities/email-verification.entity';
import { PasswordReset }      from './auth/entities/password-reset.entity';

const ds = new DataSource({
  type:        'postgres',
  url:          process.env.DATABASE_URL,
  synchronize:  true,
  logging:      false,
  entities: [
    Family, ParentAccount, Child, PinAttempt,
    Task, Reward, Transaction,
    NotificationIntent, EmailVerification, PasswordReset,
  ],
});

async function seed() {
  await ds.initialize();
  console.log('Connected to DB');

  const familyRepo  = ds.getRepository(Family);
  const accountRepo = ds.getRepository(ParentAccount);
  const childRepo   = ds.getRepository(Child);
  const taskRepo    = ds.getRepository(Task);
  const rewardRepo  = ds.getRepository(Reward);
  const txRepo      = ds.getRepository(Transaction);

  // ── Find existing account ─────────────────────────────────────────────────
  const accounts = await accountRepo.find({ relations: ['family'] });
  let family: Family;

  if (accounts.length > 0) {
    // Use first existing account's family
    const account = accounts[0];
    family = account.family;
    console.log(`✓ Compte existant trouvé — ${account.email} (famille: ${family.id})`);

    // Clear existing seed data for this family to avoid dupes
    const existingChildren = await childRepo.find({ where: { family: { id: family.id } }, relations: ['family'] });
    if (existingChildren.length > 0) {
      console.log(`  ${existingChildren.length} enfant(s) déjà présents — suppression pour re-seed propre…`);
      for (const child of existingChildren) {
        await txRepo.delete({ child: { id: child.id } });
        await taskRepo.delete({ child: { id: child.id } });
      }
      await childRepo.remove(existingChildren);
    }
    await rewardRepo.delete({ family: { id: family.id } });

  } else {
    // No existing account — create a test one
    family = await familyRepo.save(
      familyRepo.create({ name: 'Famille Test', inviteCode: 'KIDDO001' }),
    );
    await accountRepo.save(accountRepo.create({
      email:        'parent@kiddo.test',
      passwordHash: await bcrypt.hash('Test1234!', 12),
      name:         'Parent Test',
      family,
    }));
    console.log('✓ Compte de test créé — parent@kiddo.test / Test1234!');
  }

  // ── Children ──────────────────────────────────────────────────────────────
  const emma = await childRepo.save(childRepo.create({
    name: 'Emma', avatar: '🦄', color: '#FF80AB',
    pinHash: await bcrypt.hash('1234', 12), family,
  }));
  const lucas = await childRepo.save(childRepo.create({
    name: 'Lucas', avatar: '🚀', color: '#40C4FF',
    pinHash: await bcrypt.hash('5678', 12), family,
  }));
  const zoe = await childRepo.save(childRepo.create({
    name: 'Zoé', avatar: '🌈', color: '#69F0AE',
    pinHash: await bcrypt.hash('0000', 12), family,
  }));
  console.log('✓ 3 enfants — Emma (PIN: 1234), Lucas (PIN: 5678), Zoé (PIN: 0000)');

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const now = new Date();

  // Emma — mix de statuts
  const emmaT1 = await taskRepo.save(taskRepo.create({
    title: 'Ranger sa chambre', points: 20, frequency: 'daily',
    status: 'validated', child: emma,
    submittedAt: now, validatedAt: now, approvedByName: 'Maman',
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Faire ses devoirs', points: 30, frequency: 'daily',
    description: 'Tous les devoirs du soir',
    status: 'pending_approval', child: emma, submittedAt: now,
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Mettre la table', points: 10, frequency: 'daily',
    status: 'created', child: emma,
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Lire 20 minutes', points: 15, frequency: 'daily',
    status: 'rejected', child: emma, submittedAt: now,
    rejectionReason: 'Photo pas claire, recommence !',
  }));
  const emmaT5 = await taskRepo.save(taskRepo.create({
    title: 'Nettoyer les vitres', points: 50, frequency: 'weekly',
    status: 'validated', child: emma,
    submittedAt: now, validatedAt: now, approvedByName: 'Maman',
  }));

  // Lucas — plusieurs validées → bon solde
  const lucasT1 = await taskRepo.save(taskRepo.create({
    title: 'Sortir la poubelle', points: 15, frequency: 'weekly',
    status: 'validated', child: lucas,
    submittedAt: now, validatedAt: now, approvedByName: 'Maman',
  }));
  const lucasT2 = await taskRepo.save(taskRepo.create({
    title: 'Passer l\'aspirateur', points: 40, frequency: 'weekly',
    status: 'validated', child: lucas,
    submittedAt: now, validatedAt: now, approvedByName: 'Maman',
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Faire la vaisselle', points: 20, frequency: 'daily',
    status: 'pending_approval', child: lucas, submittedAt: now,
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Réviser les maths', points: 35, frequency: 'daily',
    description: 'Tables de multiplication × 7 et × 8',
    status: 'created', child: lucas,
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Arroser les plantes', points: 10, frequency: 'weekly',
    status: 'created', child: lucas,
  }));

  // Zoé — tâches simples
  const zoeT1 = await taskRepo.save(taskRepo.create({
    title: 'Se brosser les dents', points: 10, frequency: 'daily',
    status: 'validated', child: zoe,
    submittedAt: now, validatedAt: now, approvedByName: 'Maman',
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Ranger ses jouets', points: 15, frequency: 'daily',
    status: 'pending_approval', child: zoe, submittedAt: now,
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Faire son lit', points: 10, frequency: 'daily',
    status: 'created', child: zoe,
  }));
  console.log('✓ 13 tâches créées');

  // ── Rewards ───────────────────────────────────────────────────────────────
  await rewardRepo.save([
    rewardRepo.create({ title: '1h de jeux vidéo',         emoji: '🎮', cost: 50,  availability: 'unlimited', family }),
    rewardRepo.create({ title: 'Choisir le film du soir',  emoji: '🍿', cost: 30,  availability: 'unlimited', family }),
    rewardRepo.create({ title: 'Sortie parc aquatique',    emoji: '🏊', cost: 200, availability: 'once',      family }),
    rewardRepo.create({ title: 'Nouvelle BD',              emoji: '📚', cost: 80,  availability: 'once',      family }),
    rewardRepo.create({ title: 'Pizza de son choix',       emoji: '🍕', cost: 60,  availability: 'unlimited', family }),
    rewardRepo.create({ title: 'Dormir chez un(e) ami(e)', emoji: '🛌', cost: 150, availability: 'unlimited', family }),
    rewardRepo.create({ title: 'Jouet surprise',           emoji: '🎁', cost: 300, availability: 'once',      family }),
  ]);
  console.log('✓ 7 récompenses créées');

  // ── Transactions (earn only — spend créées par le vrai flow récompenses) ──
  await txRepo.save([
    // Emma — 70 pts
    txRepo.create({ type: 'earn', amount: 20, referenceId: emmaT1.id, note: 'Ranger sa chambre',   child: emma }),
    txRepo.create({ type: 'earn', amount: 50, referenceId: emmaT5.id, note: 'Nettoyer les vitres', child: emma }),

    // Lucas — 105 pts
    txRepo.create({ type: 'earn', amount: 15,  referenceId: lucasT1.id,          note: 'Sortir la poubelle',   child: lucas }),
    txRepo.create({ type: 'earn', amount: 40,  referenceId: lucasT2.id,          note: 'Passer l\'aspirateur', child: lucas }),
    txRepo.create({ type: 'earn', amount: 50,  referenceId: crypto.randomUUID(), note: 'Super semaine 🌟',     child: lucas }),

    // Zoé — 10 pts
    txRepo.create({ type: 'earn', amount: 10, referenceId: zoeT1.id, note: 'Se brosser les dents', child: zoe }),
  ]);
  console.log('✓ Soldes — Emma: 70pts | Lucas: 105pts | Zoé: 10pts');

  await ds.destroy();
  console.log('\n🎉 Seed terminé !');
  console.log('   Emma PIN: 1234  |  Lucas PIN: 5678  |  Zoé PIN: 0000');
}

seed().catch(e => { console.error(e); process.exit(1); });
