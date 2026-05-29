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
    const account = accounts[0];
    family = account.family;
    console.log(`✓ Compte existant trouvé — ${account.email} (famille: ${family.id})`);

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
  // 5 enfants — un par chapitre pour tester chaque background et histoire
  // Niveaux cibles : 1, 10, 20, 30, 40 (XP calculés depuis getLevelFromXp)
  const emma = await childRepo.save(childRepo.create({
    name: 'Emma',   avatar: '✨', color: '#FF80AB', class: 'mage',    sprite: 'f_1', xp: 50,
    pinHash: await bcrypt.hash('1111', 12), family,
  }));
  const lucas = await childRepo.save(childRepo.create({
    name: 'Lucas',  avatar: '⚔️', color: '#40C4FF', class: 'warrior', sprite: 'm_1', xp: 6800,
    pinHash: await bcrypt.hash('2222', 12), family,
  }));
  const zoe = await childRepo.save(childRepo.create({
    name: 'Zoé',    avatar: '🌿', color: '#69F0AE', class: 'archer',  sprite: 'f_3', xp: 44000,
    pinHash: await bcrypt.hash('3333', 12), family,
  }));
  const nadia = await childRepo.save(childRepo.create({
    name: 'Nadia',  avatar: '🔮', color: '#CE93D8', class: 'mage',    sprite: 'f_4', xp: 128000,
    pinHash: await bcrypt.hash('4444', 12), family,
  }));
  const kwame = await childRepo.save(childRepo.create({
    name: 'Kwame',  avatar: '🛡️', color: '#FFCC02', class: 'warrior', sprite: 'm_4', xp: 273000,
    pinHash: await bcrypt.hash('5555', 12), family,
  }));
  console.log('✓ 5 enfants de test :');
  console.log('   Emma/Lyra       PIN: 1111  (niv.~1  → ch.1 forêt verte)');
  console.log('   Lucas/Aldric    PIN: 2222  (niv.~10 → ch.2 hiver bleu)');
  console.log('   Zoé/Amara       PIN: 3333  (niv.~20 → ch.3 grotte sombre)');
  console.log('   Nadia/Nadia     PIN: 4444  (niv.~30 → ch.4 ruines crépuscule)');
  console.log('   Kwame/Kwame     PIN: 5555  (niv.~40 → ch.5 épique dorée)');

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const now = new Date();

  // Emma
  const emmaT1 = await taskRepo.save(taskRepo.create({
    title: 'Ranger sa chambre', goldReward: 20, difficulty: 'easy', frequency: 'daily',
    status: 'validated', child: emma,
    submittedAt: now, validatedAt: now, approvedByName: 'Maman',
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Faire ses devoirs', goldReward: 30, difficulty: 'medium', frequency: 'daily',
    description: 'Tous les devoirs du soir',
    status: 'pending_approval', child: emma, submittedAt: now,
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Mettre la table', goldReward: 10, difficulty: 'easy', frequency: 'daily',
    status: 'created', child: emma,
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Lire 20 minutes', goldReward: 15, difficulty: 'easy', frequency: 'daily',
    status: 'rejected', child: emma, submittedAt: now,
    rejectionReason: 'Photo pas claire, recommence !',
  }));
  const emmaT5 = await taskRepo.save(taskRepo.create({
    title: 'Nettoyer les vitres', goldReward: 50, difficulty: 'hard', frequency: 'weekly',
    status: 'validated', child: emma,
    submittedAt: now, validatedAt: now, approvedByName: 'Maman',
  }));

  // Lucas
  const lucasT1 = await taskRepo.save(taskRepo.create({
    title: 'Sortir la poubelle', goldReward: 15, difficulty: 'easy', frequency: 'weekly',
    status: 'validated', child: lucas,
    submittedAt: now, validatedAt: now, approvedByName: 'Maman',
  }));
  const lucasT2 = await taskRepo.save(taskRepo.create({
    title: 'Passer l\'aspirateur', goldReward: 40, difficulty: 'medium', frequency: 'weekly',
    status: 'validated', child: lucas,
    submittedAt: now, validatedAt: now, approvedByName: 'Maman',
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Faire la vaisselle', goldReward: 20, difficulty: 'easy', frequency: 'daily',
    status: 'pending_approval', child: lucas, submittedAt: now,
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Réviser les maths', goldReward: 35, difficulty: 'hard', frequency: 'daily',
    description: 'Tables de multiplication × 7 et × 8',
    status: 'created', child: lucas,
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Arroser les plantes', goldReward: 10, difficulty: 'easy', frequency: 'weekly',
    status: 'created', child: lucas,
  }));

  // Zoé
  const zoeT1 = await taskRepo.save(taskRepo.create({
    title: 'Se brosser les dents', goldReward: 10, difficulty: 'easy', frequency: 'daily',
    status: 'validated', child: zoe,
    submittedAt: now, validatedAt: now, approvedByName: 'Maman',
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Ranger ses jouets', goldReward: 15, difficulty: 'easy', frequency: 'daily',
    status: 'pending_approval', child: zoe, submittedAt: now,
  }));
  await taskRepo.save(taskRepo.create({
    title: 'Faire son lit', goldReward: 10, difficulty: 'easy', frequency: 'daily',
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

  // ── Transactions ──────────────────────────────────────────────────────────
  await txRepo.save([
    // Emma — 70 gold, 60 XP
    txRepo.create({ type: 'earn', currency: 'gold', amount: 20, referenceId: emmaT1.id, note: 'Ranger sa chambre',   child: emma }),
    txRepo.create({ type: 'earn', currency: 'gold', amount: 50, referenceId: emmaT5.id, note: 'Nettoyer les vitres', child: emma }),
    txRepo.create({ type: 'earn', currency: 'xp',   amount: 10, referenceId: emmaT1.id, child: emma }),
    txRepo.create({ type: 'earn', currency: 'xp',   amount: 50, referenceId: emmaT5.id, child: emma }),

    // Lucas — 105 gold, 85 XP
    txRepo.create({ type: 'earn', currency: 'gold', amount: 15,  referenceId: lucasT1.id,          note: 'Sortir la poubelle',   child: lucas }),
    txRepo.create({ type: 'earn', currency: 'gold', amount: 40,  referenceId: lucasT2.id,          note: 'Passer l\'aspirateur', child: lucas }),
    txRepo.create({ type: 'earn', currency: 'gold', amount: 50,  referenceId: crypto.randomUUID(), note: 'Super semaine !',      child: lucas }),
    txRepo.create({ type: 'earn', currency: 'xp',   amount: 10,  referenceId: lucasT1.id, child: lucas }),
    txRepo.create({ type: 'earn', currency: 'xp',   amount: 25,  referenceId: lucasT2.id, child: lucas }),

    // Zoé — 10 gold, 10 XP
    txRepo.create({ type: 'earn', currency: 'gold', amount: 10, referenceId: zoeT1.id, note: 'Se brosser les dents', child: zoe }),
    txRepo.create({ type: 'earn', currency: 'xp',   amount: 10, referenceId: zoeT1.id, child: zoe }),
  ]);
  console.log('✓ Soldes — Emma: 70 pièces | Lucas: 105 pièces | Zoé: 10 pièces');

  await ds.destroy();
  console.log('\n🎉 Seed terminé !');
  console.log('   Emma PIN: 1234  |  Lucas PIN: 5678  |  Zoé PIN: 0000');
}

seed().catch(e => { console.error(e); process.exit(1); });
